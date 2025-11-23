# Cloudflare R2 & Automation Setup Guide

This guide explains how to set up the backend infrastructure to allow direct file uploads from your website and automatic syncing to YouTube/SoundCloud.

## Part 1: Cloudflare R2 & Worker Setup

### 1. Create an R2 Bucket
1.  Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2.  Go to **R2** from the sidebar.
3.  Click **Create Bucket**.
4.  Name it `payal-reviews`.
5.  Click **Create Bucket**.
6.  Go to **Settings** -> **CORS Policy** and add:
    ```json
    [
      {
        "AllowedOrigins": ["*"],
        "AllowedMethods": ["PUT", "GET"],
        "AllowedHeaders": ["*"]
      }
    ]
    ```
    *(Note: In production, replace `"*"` with your actual domain name).*

### 2. Deploy the Worker
1.  Go to **Workers & Pages** in Cloudflare.
2.  Click **Create Application** -> **Create Worker**.
3.  Name it `payal-upload-worker`.
4.  Click **Deploy**.
5.  Click **Edit Code**.
6.  Copy the content of `r2-worker.js` (from your project folder) and paste it into the editor (replace existing code).
7.  **IMPORTANT**: Go to **Settings** -> **Variables** -> **R2 Bucket Bindings**.
    *   Variable name: `MY_BUCKET`
    *   R2 Bucket: `payal-reviews`
    *   Click **Save and Deploy**.
8.  Note down your **Worker URL** (e.g., `https://payal-upload-worker.yourname.workers.dev`).

### 3. Update Your Website
1.  Open `script.js` in your project.
2.  Find the line `const WORKER_URL = "YOUR_WORKER_URL_HERE";`.
3.  Replace `"YOUR_WORKER_URL_HERE"` with your actual Worker URL from step 2.8.

---

## Part 2: Python Automation Script Setup

### 1. Install Requirements
You need Python installed. Then run:
```bash
pip install boto3 requests google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### 2. Get API Keys

#### Cloudflare R2 Keys
1.  Go to R2 Dashboard -> **Manage R2 API Tokens**.
2.  Create API Token -> Permissions: **Admin Read & Write**.
3.  Copy `Account ID`, `Access Key ID`, and `Secret Access Key`.
4.  Open `upload_manager.py` and update the `R2_...` variables.

#### YouTube (Google Cloud)
1.  Go to [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a Project.
3.  Enable **YouTube Data API v3**.
4.  Go to **Credentials** -> **Create Credentials** -> **OAuth client ID** (Desktop App).
5.  Download the JSON file, rename it to `client_secret.json`, and place it in the same folder as `upload_manager.py`.

#### SoundCloud
1.  Register an App at [SoundCloud Developers](https://developers.soundcloud.com/).
2.  Get your `Client ID` and `Access Token`.
3.  Update `upload_manager.py`.

### 3. Run the Script
Run the script manually to check for new files and upload them:
```bash
python3 upload_manager.py
```
*   The first time you run it, it will open a browser to log in to your YouTube account.
