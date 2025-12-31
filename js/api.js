/**
 * js/api.js
 * Mengatur semua komunikasi ke API Eksternal (Pollinations & ImgBB).
 * VERSI STABIL: Menghapus parameter eksperimental yang menyebabkan Error 400.
 */

const API_BASE_CHAT = 'https://gen.pollinations.ai/v1/chat/completions'; // Text & Vision
const API_BASE_IMAGE = 'https://image.pollinations.ai/prompt/';          // Image Gen

// =================================================================
// 1. HELPER: URL ENCODING
// =================================================================
function safeEncode(url) {
    return encodeURIComponent(url);
}

// =================================================================
// 2. IMGBB UPLOAD (TAB 2)
// =================================================================
async function uploadToImgBB(file) {
    const apiKey = AppState.settings.imgbbKey;
    
    if (!apiKey) {
        throw new Error("ImgBB API Key belum diisi! Buka Settings (ikon gerigi) untuk mengisi.");
    }
    
    const formData = new FormData();
    formData.append("image", file);

    try {
        console.log("📤 Uploading to ImgBB...");
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: "POST",
            body: formData
        });
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error ? data.error.message : "Gagal upload gambar ke ImgBB.");
        }
        
        console.log("✅ Upload Success:", data.data.url);
        return data.data.url; 

    } catch (error) {
        console.error("ImgBB Error:", error);
        throw error; 
    }
}

// =================================================================
// 3. TEXT & VISION GENERATION (TAB 1 & TAB 2 & TAB 4)
// =================================================================
async function generateTextAI(messages, jsonMode = false) {
    const apiKey = AppState.settings.pollinationsKey || null; 
    
    const headers = {
        'Content-Type': 'application/json',
    };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    // --- PERBAIKAN TOTAL: KEMBALI KE BASIC ---
    // Hapus semua parameter 'json' atau 'response_format'.
    // Kita percayakan sepenuhnya pada System Prompt di Tab 1/4 untuk menghasilkan JSON string.
    
    const body = {
        model: "openai", 
        messages: messages,
        temperature: 0.7
    };

    try {
        console.log("🤖 Calling Pollinations API...", jsonMode ? "(Expect JSON)" : "");
        
        const response = await fetch(API_BASE_CHAT, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("API Error Details:", errText);
            throw new Error(`API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content;

        // PARSING JSON MANUAL (LEBIH AMAN)
        if (jsonMode) {
            // 1. Hapus Markdown Code Blocks (```json ... ```)
            content = content.replace(/```json/g, '').replace(/```/g, '');
            
            // 2. Trim whitespace
            content = content.trim();

            // 3. Coba Parse
            try {
                return JSON.parse(content); 
            } catch (e) {
                console.error("JSON Parse Error. Raw Content:", content);
                // Fallback: Kadang ada teks di depan/belakang JSON, kita coba cari kurung kurawal
                const firstBracket = content.indexOf('{');
                const lastBracket = content.lastIndexOf('}');
                if (firstBracket !== -1 && lastBracket !== -1) {
                    const cleanJson = content.substring(firstBracket, lastBracket + 1);
                    try {
                        return JSON.parse(cleanJson);
                    } catch (e2) {
                        throw new Error("AI gagal membuat format JSON yang valid.");
                    }
                }
                throw new Error("AI gagal membuat format JSON yang valid.");
            }
        }

        return content; 

    } catch (error) {
        console.error("Text Gen Error:", error);
        throw error;
    }
}

// =================================================================
// 4. IMAGE GENERATION URL BUILDER
// =================================================================
function generateImageURL(prompt, options = {}) {
    const allowedModels = ['seedream', 'seedream-pro', 'nanobanana'];
    let model = options.model || 'seedream';
    
    if (!allowedModels.includes(model)) {
        model = 'seedream';
    }

    const width = options.width || 1024;
    const height = options.height || 1024;
    const seed = options.seed || Math.floor(Math.random() * 1000000); 
    
    const encodedPrompt = encodeURIComponent(prompt);

    let url = `${API_BASE_IMAGE}${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true`;

    // Fitur Image-to-Image (Hanya dipakai kalau refImage dikirim)
    if (options.refImage) {
        const encodedRef = safeEncode(options.refImage);
        url += `&image=${encodedRef}`;
        url += `&guidance_scale=1.5`; 
    }

    return url;
}

// =================================================================
// 5. VISION WRAPPER
// =================================================================
async function analyzeImageStyle(imageUrl) {
    const messages = [
        {
            role: "user",
            content: [
                { 
                    type: "text", 
                    text: "Analyze the art style. Output ONLY comma-separated keywords (e.g. 3D Render, Pixar Style, Lighting)." 
                },
                { 
                    type: "image_url", 
                    image_url: { url: imageUrl } 
                }
            ]
        }
    ];

    return await generateTextAI(messages, false);
                }
