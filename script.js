document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            const icon = mobileBtn.querySelector('i');
            if (nav.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Close mobile menu when clicking a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            nav.classList.remove('active');
            const icon = mobileBtn.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        });
    });

    // Intersection Observer for Scroll Animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    document.querySelectorAll('.fade-in-up, .fade-in').forEach(el => {
        observer.observe(el);
    });

    // Smooth Scroll for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Review Form Tabs
    const reviewTabs = document.querySelectorAll('.review-tab');
    const textInput = document.getElementById('textInput');
    const mediaInput = document.getElementById('mediaInput');
    let currentReviewType = 'text';

    reviewTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all
            reviewTabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked
            tab.classList.add('active');

            currentReviewType = tab.dataset.type;

            if (currentReviewType === 'text') {
                textInput.style.display = 'block';
                mediaInput.style.display = 'none';
            } else {
                textInput.style.display = 'none';
                mediaInput.style.display = 'block';
            }
        });
    });

    // Education Toggle
    const toggleEducationBtn = document.getElementById('toggleEducationBtn');
    const schoolEducation = document.getElementById('schoolEducation');

    if (toggleEducationBtn && schoolEducation) {
        toggleEducationBtn.addEventListener('click', () => {
            if (schoolEducation.style.display === 'none') {
                schoolEducation.style.display = 'grid';
                toggleEducationBtn.innerHTML = 'Hide School Education <i class="fas fa-chevron-up"></i>';
                // Trigger animation for new elements
                schoolEducation.querySelectorAll('.education-card').forEach(card => {
                    card.classList.add('visible');
                });
            } else {
                schoolEducation.style.display = 'none';
                toggleEducationBtn.innerHTML = 'Show School Education <i class="fas fa-chevron-down"></i>';
            }
        });
    }

    // --- Media Recording Logic ---
    // CLOUDFLARE WORKER URL (Update this after deploying your worker)
    const WORKER_URL = "https://shiny-queen-f1fa.suvamsingh55.workers.dev";

    let mediaRecorder;
    let audioChunks = [];
    let videoChunks = [];
    let stream;

    const startRecordBtn = document.getElementById('startRecordBtn');
    const stopRecordBtn = document.getElementById('stopRecordBtn');
    const recordingStatus = document.getElementById('recordingStatus');
    const audioPlayer = document.getElementById('audioPlayer');
    const videoPlayer = document.getElementById('videoPlayer');
    const audioPreview = document.getElementById('audioPreview');
    const videoPreview = document.getElementById('videoPreview');
    const downloadLink = document.getElementById('downloadLink');
    const recordingTitle = document.getElementById('recordingTitle');

    // Helper to upload to R2 via Worker
    async function uploadToR2(blob, filename) {
        if (WORKER_URL === "YOUR_WORKER_URL_HERE") {
            alert("Please configure the Cloudflare Worker URL in script.js to enable uploads.");
            // Fallback to download
            downloadLink.style.display = 'inline-block';
            downloadLink.textContent = "Download Recording (Upload Not Configured)";
            return null;
        }

        recordingStatus.textContent = "Uploading...";
        recordingStatus.style.color = "blue";

        try {
            const response = await fetch(`${WORKER_URL}/upload?fileName=${filename}`, {
                method: 'POST',
                body: blob
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            recordingStatus.textContent = "Upload Successful! You can now submit.";
            recordingStatus.style.color = "green";

            // Auto-fill the media link input with the public URL
            document.getElementById('mediaLink').value = data.url;
            return data.key;
        } catch (error) {
            console.error(error);
            recordingStatus.textContent = "Upload Failed. Please download the file instead.";
            recordingStatus.style.color = "red";
            // Show download link on failure
            downloadLink.style.display = 'inline-block';
            downloadLink.textContent = "Download Recording";
            return null;
        }
    }

    if (startRecordBtn && stopRecordBtn) {
        startRecordBtn.addEventListener('click', async () => {
            const type = currentReviewType; // 'audio' or 'video'
            audioChunks = [];
            videoChunks = [];

            try {
                if (type === 'audio') {
                    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                } else {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    videoPlayer.srcObject = stream;
                    videoPlayer.play();
                    videoPreview.style.display = 'block';
                    audioPreview.style.display = 'none';
                }

                mediaRecorder = new MediaRecorder(stream);

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        if (type === 'audio') audioChunks.push(event.data);
                        else videoChunks.push(event.data);
                    }
                };

                mediaRecorder.onstop = async () => {
                    let blob;
                    const timestamp = new Date().getTime();
                    let filename;

                    if (type === 'audio') {
                        blob = new Blob(audioChunks, { type: 'audio/webm' });
                        audioPlayer.src = URL.createObjectURL(blob);
                        audioPreview.style.display = 'block';
                        videoPreview.style.display = 'none';
                        filename = `audio_${timestamp}.webm`;

                        // Setup download link (hidden initially)
                        downloadLink.href = URL.createObjectURL(blob);
                        downloadLink.download = filename;
                    } else {
                        blob = new Blob(videoChunks, { type: 'video/webm' });
                        videoPlayer.srcObject = null;
                        videoPlayer.src = URL.createObjectURL(blob);
                        videoPlayer.controls = true;
                        filename = `video_${timestamp}.webm`;

                        // Setup download link (hidden initially)
                        downloadLink.href = URL.createObjectURL(blob);
                        downloadLink.download = filename;
                    }

                    stream.getTracks().forEach(track => track.stop());

                    downloadLink.style.display = 'none'; // Hide download button initially

                    // Trigger Upload
                    await uploadToR2(blob, filename);

                    startRecordBtn.classList.remove('recording');
                    startRecordBtn.disabled = false;
                    stopRecordBtn.disabled = true;
                };

                mediaRecorder.start();
                startRecordBtn.classList.add('recording');
                startRecordBtn.disabled = true;
                stopRecordBtn.disabled = false;
                recordingStatus.textContent = "Recording...";
                downloadLink.style.display = 'none';

                // Reset previews
                if (currentReviewType === 'audio') {
                    audioPreview.style.display = 'none';
                }

            } catch (err) {
                console.error("Error accessing media devices:", err);
                recordingStatus.textContent = "Error: Could not access microphone/camera. Please allow permissions.";
            }
        });

        stopRecordBtn.addEventListener('click', () => {
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                mediaRecorder.stop();
            }
        });
    }

    // Handle Review Form Submission
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('reviewName').value;
            const childName = document.getElementById('childName').value;
            const childAge = document.getElementById('childAge').value;
            const message = document.getElementById('reviewMessage').value;
            const mediaLink = document.getElementById('mediaLink').value;
            const email = "payal.akshadhaafoundation@gmail.com";

            let subject = `New ${currentReviewType.toUpperCase()} Review from ${name}`;
            let body = `Name: ${name}\n`;

            if (childName) body += `Child's Name: ${childName}\n`;
            if (childAge) body += `Child's Age: ${childAge}\n`;

            body += `Review Type: ${currentReviewType}\n\n`;

            if (currentReviewType === 'text') {
                body += `Review:\n${message}`;
            } else {
                if (mediaLink) {
                    body += `Media Link: ${mediaLink}\n\n`;
                }
                body += `I would like to submit an ${currentReviewType} review.`;
                if (!mediaLink) {
                    body += ` Please find the attached file (I have recorded/downloaded it).`;
                }
            }

            // Construct Mailto Link
            const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

            // Modal Logic
            const modal = document.getElementById('reviewModal');
            const closeModal = document.querySelector('.close-modal');
            const cancelBtn = document.getElementById('cancelBtn');
            const proceedBtn = document.getElementById('proceedBtn');
            const downloadStep = document.getElementById('downloadStep');
            const attachStep = document.getElementById('attachStep');
            const modalBodyText = document.querySelector('.modal-body p');

            // Show/Hide steps based on review type
            if ((currentReviewType === 'audio' || currentReviewType === 'video') && !mediaLink) {
                downloadStep.style.display = 'list-item';
                attachStep.style.display = 'list-item';
                if (modalBodyText) modalBodyText.textContent = "To complete your review submission, please follow these steps:";
            } else {
                downloadStep.style.display = 'none';
                attachStep.style.display = 'none';
                if (modalBodyText) modalBodyText.textContent = "Your review is ready to send. Click 'Proceed to Email' to finish.";
            }

            // Show Modal
            modal.style.display = 'block';

            // Proceed Button Click
            proceedBtn.onclick = function () {
                window.location.href = mailtoLink;
                modal.style.display = 'none';
                // Reset form
                document.getElementById('reviewForm').reset();
            }

            // Close/Cancel Logic
            closeModal.onclick = function () {
                modal.style.display = 'none';
            }
            cancelBtn.onclick = function () {
                modal.style.display = 'none';
            }
            window.onclick = function (event) {
                if (event.target == modal) {
                    modal.style.display = 'none';
                }
            }
        });
    }

    // Handle Contact Form Submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const emailInput = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            const targetEmail = "payal.akshadhaafoundation@gmail.com";

            const subject = `New Contact Message from ${name}`;
            const body = `Name: ${name}\nEmail: ${emailInput}\n\nMessage:\n${message}`;

            window.location.href = `mailto:${targetEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        });
    }
});
