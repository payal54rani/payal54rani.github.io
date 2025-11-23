# How to Add New Reviews to Your Website

Since your website is hosted on **GitHub Pages** (a static site), new reviews do not appear automatically. When you receive a review via email, you need to manually add it to your `index.html` file.

Here is the step-by-step process.

## Step 1: Open `index.html`
Open your `index.html` file in your code editor.

## Step 2: Find the Testimonials Section
Search for the line that says:
`<!-- Reviews Grid -->`
or find the `<div class="testimonials-grid">` element.

## Step 3: Choose a Template
Copy one of the templates below depending on the type of review you received. Paste it **inside** the `<div class="testimonials-grid">`, preferably at the top (after the opening tag) so it shows up first.

### 📝 Option A: Text Review Template
Use this for written reviews.

```html
<!-- Text Review -->
<div class="testimonial-card fade-in-up">
    <div class="quote-icon"><i class="fas fa-quote-left"></i></div>
    <p class="review-text">"PASTE THE REVIEW TEXT HERE"</p>
    <div class="reviewer-info">
        <div class="reviewer-avatar">N</div> <!-- Change 'N' to the first letter of their name -->
        <div>
            <h4 class="reviewer-name">Reviewer Name</h4>
            <span class="review-type"><i class="fas fa-comment-alt"></i> Text Review</span>
            <!-- Optional: Add Child Details if provided -->
            <!-- <span class="child-details" style="display:block; font-size: 0.8em; color: #666;">Child: Name (Age)</span> -->
        </div>
    </div>
</div>
```

### 🎥 Option B: Video Review Template (YouTube)
Use this if the user sent a YouTube link.

1.  Get the **Embed Code** from YouTube:
    *   Go to the video on YouTube.
    *   Click **Share** -> **Embed**.
    *   Copy the `<iframe>...</iframe>` code.
2.  Paste it into the template below.

```html
<!-- Video Review -->
<div class="testimonial-card fade-in-up">
    <div class="video-container">
        <!-- PASTE YOUTUBE IFRAME HERE -->
        <iframe src="https://www.youtube.com/embed/VIDEO_ID" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
    </div>
    <div class="reviewer-info" style="margin-top: 15px;">
        <div class="reviewer-avatar">N</div> <!-- Change 'N' to First Letter -->
        <div>
            <h4 class="reviewer-name">Reviewer Name</h4>
            <span class="review-type"><i class="fas fa-video"></i> Video Review</span>
        </div>
    </div>
</div>
```

### 🎤 Option C: Audio Review Template (SoundCloud)
Use this if the user sent a SoundCloud link.

1.  Get the **Embed Code** from SoundCloud:
    *   Go to the track on SoundCloud.
    *   Click **Share** -> **Embed**.
    *   Copy the `<iframe>...</iframe>` code.
2.  Paste it into the template below.

```html
<!-- Audio Review -->
<div class="testimonial-card fade-in-up">
    <div class="audio-container">
        <!-- PASTE SOUNDCLOUD IFRAME HERE -->
        <iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=TRACK_URL"></iframe>
    </div>
    <div class="reviewer-info" style="margin-top: 15px;">
        <div class="reviewer-avatar">N</div> <!-- Change 'N' to First Letter -->
        <div>
            <h4 class="reviewer-name">Reviewer Name</h4>
            <span class="review-type"><i class="fas fa-microphone"></i> Audio Review</span>
        </div>
    </div>
</div>
```

## Step 4: Save and Update
1.  Save the `index.html` file.
2.  Commit and push your changes to GitHub.
3.  Your website will update with the new review in a few minutes!
