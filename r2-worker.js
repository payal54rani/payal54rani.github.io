/**
 * Cloudflare Worker for R2 File Uploads
 * 
 * Setup:
 * 1. Create R2 bucket named 'payal54rani'
 * 2. Bind R2 bucket to worker with variable name 'MY_BUCKET'
 * 3. Update ALLOWED_ORIGINS with your GitHub Pages URL
 * 4. (Optional) Set AUTH_SECRET environment variable for additional security
 */

const BUCKET_NAME = 'payal54rani';
const MAX_FILE_SIZE = 250 * 1024 * 1024; // 250MB limit
const ALLOWED_ORIGINS = [
    'https://payal54rani.github.io', // Production
    'http://127.0.0.1:5500',         // Local Development (VS Code Live Server)
    'http://localhost:3000'          // Local Development (Generic)
];

// Allowed file types (MIME types)
const ALLOWED_TYPES = [
    'audio/webm',
    'audio/wav',
    'audio/mp3',
    'audio/mpeg',
    'video/webm',
    'video/mp4'
];

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const origin = request.headers.get('Origin');

        // CORS Headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin)
                ? origin
                : ALLOWED_ORIGINS[0],
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Secret',
            'Access-Control-Max-Age': '86400',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders
            });
        }

        // Only allow POST requests to /upload or /send-email
        if (request.method !== 'POST' || (url.pathname !== '/upload' && url.pathname !== '/send-email')) {
            return new Response(JSON.stringify({
                error: 'Not Found'
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Route: Send Email
        if (url.pathname === '/send-email') {
            return handleEmail(request, env, corsHeaders);
        }

        // Optional: Check auth secret
        if (env.AUTH_SECRET) {
            const authHeader = request.headers.get('X-Auth-Secret');
            if (authHeader !== env.AUTH_SECRET) {
                return new Response(JSON.stringify({
                    error: 'Unauthorized'
                }), {
                    status: 401,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // Validate file name
        const fileName = url.searchParams.get('fileName');
        if (!fileName) {
            return new Response(JSON.stringify({
                error: 'Missing fileName parameter'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Validate file size
        const contentLength = parseInt(request.headers.get('content-length') || '0');
        if (contentLength > MAX_FILE_SIZE) {
            return new Response(JSON.stringify({
                error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`
            }), {
                status: 413,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (contentLength === 0) {
            return new Response(JSON.stringify({
                error: 'Empty file'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Validate content type
        const contentType = request.headers.get('content-type');
        if (!contentType || !ALLOWED_TYPES.includes(contentType)) {
            return new Response(JSON.stringify({
                error: 'Invalid file type. Only audio and video files are allowed.'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Generate unique object key
        const timestamp = Date.now();
        const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
        const objectKey = `uploads/${timestamp}-${sanitizedFileName}`;

        // Upload to R2
        try {
            await env.MY_BUCKET.put(objectKey, request.body, {
                httpMetadata: {
                    contentType: contentType
                },
                customMetadata: {
                    uploadedAt: new Date().toISOString(),
                    originalFileName: fileName
                }
            });

            // Generate public URL
            const publicUrl = `https://pub-f32ce6d68dac4a60b7e83a8c3aa2b5bc.r2.dev/${objectKey}`;

            return new Response(JSON.stringify({
                success: true,
                key: objectKey,
                url: publicUrl,
                message: 'File uploaded successfully'
            }), {
                status: 200,
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });

        } catch (err) {
            console.error('Upload error:', err);

            return new Response(JSON.stringify({
                error: 'Upload failed',
                details: err.message
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    }
};

// Helper to handle email sending
async function handleEmail(request, env, corsHeaders) {
    try {
        const { subject, html, to } = await request.json();

        if (!env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY not configured');
        }

        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${env.RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev', // Use this until you verify a domain
                //to: to || 'payal.akshadhaafoundation@gmail.com', // Default to owner
                to: to || 'suvamsingh55@gmail.com', // Default to resend owner
                subject: subject,
                html: html
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Failed to send email');
        }

        return new Response(JSON.stringify(data), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
