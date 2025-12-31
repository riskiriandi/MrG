/**
 * js/api.js
 * Mengatur semua komunikasi ke API Eksternal.
 * FIX FINAL: Mengembalikan parameter 'model: openai' sesuai dokumentasi resmi.
 */

const API_BASE_CHAT = 'https://gen.pollinations.ai/v1/chat/completions'; 
const API_BASE_IMAGE = 'https://image.pollinations.ai/prompt/';

// =================================================================
// 1. HELPER: URL ENCODING
// =================================================================
function safeEncode(url) {
    return encodeURIComponent(url);
}

// =================================================================
// 2. IMGBB UPLOAD
// =================================================================
async function uploadToImgBB(file) {
    const apiKey = AppState.settings.imgbbKey;
    if (!apiKey) throw new Error("ImgBB API Key belum diisi!");
    
    const formData = new FormData();
    formData.append("image", file);

    try {
        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
            method: "POST",
            body: formData
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error ? data.error.message : "Gagal upload.");
        return data.data.url; 
    } catch (error) {
        console.error("ImgBB Error:", error);
        throw error; 
    }
}

// =================================================================
// 3. TEXT & VISION GENERATION (CORE)
// =================================================================
async function generateTextAI(messages, jsonMode = false) {
    // 1. Ambil API Key
    let apiKey = AppState.settings.pollinationsKey;
    if (apiKey) apiKey = apiKey.trim();

    const headers = {
        'Content-Type': 'application/json',
    };
    // Hanya kirim header Authorization kalau key-nya ada
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    // 2. Body Request Sesuai Dokumentasi
    // WAJIB ADA: model: "openai"
    const body = {
        model: "openai", 
        messages: messages,
        temperature: 0.7
        // JANGAN ADA parameter 'json' atau 'response_format' di sini.
    };

    try {
        console.log("🚀 Sending Request to Pollinations...", body);

        const response = await fetch(API_BASE_CHAT, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });

        // 3. Error Handling
        if (!response.ok) {
            const errText = await response.text();
            console.error("❌ API Error Response:", errText);
            
            if (response.status === 400) throw new Error("Error 400 (Bad Request). Cek format pesan atau API Key.");
            if (response.status === 401) throw new Error("Error 401 (Unauthorized). API Key salah.");
            throw new Error(`API Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        
        // Validasi response data
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("Format response API tidak dikenali.");
        }

        let content = data.choices[0].message.content;

        // 4. Parsing JSON Manual (Client Side)
        if (jsonMode) {
            // Bersihkan markdown ```json ... ```
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            
            // Cari kurung kurawal pertama dan terakhir (biar aman dari teks sampah)
            const first = content.indexOf('{');
            const last = content.lastIndexOf('}');
            
            if (first !== -1 && last !== -1) {
                const cleanJson = content.substring(first, last + 1);
                try {
                    return JSON.parse(cleanJson); 
                } catch (e) {
                    console.error("JSON Parse Fail:", cleanJson);
                    throw new Error("AI merespon, tapi format JSON-nya rusak.");
                }
            } else {
                throw new Error("AI tidak memberikan format JSON object.");
            }
        }

        return content; 

    } catch (error) {
        console.error("Text Gen Error:", error);
        throw error; 
    }
}

// =================================================================
// 4. IMAGE GENERATION URL
// =================================================================
function generateImageURL(prompt, options = {}) {
    const allowedModels = ['seedream', 'seedream-pro', 'nanobanana'];
    let model = options.model || 'seedream';
    if (!allowedModels.includes(model)) model = 'seedream';

    const width = options.width || 1024;
    const height = options.height || 1024;
    const seed = options.seed || Math.floor(Math.random() * 1000000); 
    
    const encodedPrompt = encodeURIComponent(prompt);
    let url = `${API_BASE_IMAGE}${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true`;

    if (options.refImage) {
        url += `&image=${safeEncode(options.refImage)}`;
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
                { type: "text", text: "Analyze style: 3D, Lighting, Color. Output comma-separated keywords." },
                { type: "image_url", image_url: { url: imageUrl } }
            ]
        }
    ];
    return await generateTextAI(messages, false);
        }
