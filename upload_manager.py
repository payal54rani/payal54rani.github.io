import os
import time
import boto3
import requests
import json
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2.credentials import Credentials

# --- CONFIGURATION ---
# R2 / S3 Configuration
R2_ACCOUNT_ID = 'YOUR_CLOUDFLARE_ACCOUNT_ID'
R2_ACCESS_KEY_ID = 'YOUR_R2_ACCESS_KEY_ID'
R2_SECRET_ACCESS_KEY = 'YOUR_R2_SECRET_ACCESS_KEY'
BUCKET_NAME = 'payal-reviews'

# YouTube Configuration
YOUTUBE_CLIENT_SECRET_FILE = 'client_secret.json'
YOUTUBE_SCOPES = ['https://www.googleapis.com/auth/youtube.upload']

# SoundCloud Configuration
SOUNDCLOUD_CLIENT_ID = 'YOUR_SOUNDCLOUD_CLIENT_ID'
SOUNDCLOUD_ACCESS_TOKEN = 'YOUR_SOUNDCLOUD_ACCESS_TOKEN'

# Local Download Path
DOWNLOAD_DIR = 'downloaded_reviews'

# --- R2 CONNECTION ---
def get_r2_client():
    return boto3.client(
        's3',
        endpoint_url=f'https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
        aws_access_key_id=R2_ACCESS_KEY_ID,
        aws_secret_access_key=R2_SECRET_ACCESS_KEY
    )

# --- YOUTUBE UPLOAD ---
def upload_to_youtube(file_path, title, description):
    print(f"Uploading {title} to YouTube...")
    # Authenticate (Simplified for script)
    # Note: In a real run, you'd handle the OAuth flow to get 'token.json'
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', YOUTUBE_SCOPES)
    
    if not creds:
        print("Error: valid 'token.json' not found. Please run OAuth flow first.")
        return

    youtube = build('youtube', 'v3', credentials=creds)

    body = {
        'snippet': {
            'title': title,
            'description': description,
            'tags': ['Review', 'Testimonial'],
            'categoryId': '22' # People & Blogs
        },
        'status': {
            'privacyStatus': 'unlisted' # Keep unlisted by default
        }
    }

    media = MediaFileUpload(file_path, chunksize=-1, resumable=True)
    request = youtube.videos().insert(part=','.join(body.keys()), body=body, media_body=media)
    
    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"Uploaded {int(status.progress() * 100)}%")
    
    print(f"YouTube Upload Complete! Video ID: {response['id']}")
    return response['id']

# --- SOUNDCLOUD UPLOAD ---
def upload_to_soundcloud(file_path, title):
    print(f"Uploading {title} to SoundCloud...")
    url = "https://api.soundcloud.com/tracks"
    headers = {
        "Authorization": f"OAuth {SOUNDCLOUD_ACCESS_TOKEN}"
    }
    
    files = {
        'track[asset_data]': open(file_path, 'rb'),
        'track[title]': (None, title),
        'track[sharing]': (None, 'private') # Private by default
    }
    
    response = requests.post(url, headers=headers, files=files)
    
    if response.status_code == 201:
        track = response.json()
        print(f"SoundCloud Upload Complete! Track URL: {track['permalink_url']}")
        return track['permalink_url']
    else:
        print(f"SoundCloud Error: {response.text}")
        return None

# --- MAIN LOOP ---
def main():
    if not os.path.exists(DOWNLOAD_DIR):
        os.makedirs(DOWNLOAD_DIR)

    s3 = get_r2_client()
    
    print("Checking for new files in R2...")
    
    # List objects
    try:
        response = s3.list_objects_v2(Bucket=BUCKET_NAME)
    except Exception as e:
        print(f"Error connecting to R2: {e}")
        return

    if 'Contents' in response:
        for obj in response['Contents']:
            key = obj['Key']
            # Check if already processed (you might want a database or log file for this)
            if key.endswith('.processed'):
                continue
                
            print(f"Found new file: {key}")
            local_path = os.path.join(DOWNLOAD_DIR, key)
            
            # Download
            s3.download_file(BUCKET_NAME, key, local_path)
            
            # Determine Type
            title = f"Review - {key}"
            description = "User submitted review"
            
            if key.endswith('.mp4') or key.endswith('.webm'):
                # Video -> YouTube
                vid_id = upload_to_youtube(local_path, title, description)
                if vid_id:
                    # Mark as processed (rename in R2)
                    s3.copy_object(Bucket=BUCKET_NAME, CopySource=f"{BUCKET_NAME}/{key}", Key=f"{key}.processed")
                    s3.delete_object(Bucket=BUCKET_NAME, Key=key)
                    print(f"Marked {key} as processed.")
                    
            elif key.endswith('.mp3') or key.endswith('.wav') or key.endswith('.ogg'):
                # Audio -> SoundCloud
                track_url = upload_to_soundcloud(local_path, title)
                if track_url:
                    # Mark as processed
                    s3.copy_object(Bucket=BUCKET_NAME, CopySource=f"{BUCKET_NAME}/{key}", Key=f"{key}.processed")
                    s3.delete_object(Bucket=BUCKET_NAME, Key=key)
                    print(f"Marked {key} as processed.")

    else:
        print("No new files found.")

if __name__ == "__main__":
    main()
