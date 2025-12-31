/**
 * js/api.js
 * Mengatur semua komunikasi ke API Eksternal.
 * VERSI DEBUG: Menampilkan pesan error asli dari server & menghapus parameter berisiko.
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
    // 1. Ambil & Bersihkan API Key
    let apiKey = AppState.settings.pollinationsKey;
    if (apiKey) apiKey = apiKey.trim(); // Hapus spasi depan/belakang

    const headers = {
        'Content-Type': 'application/json',
    };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    // 2. Body Request Paling Sederhana (Anti-Error)
    // Kita HAPUS 'model' biar server pake default (biasanya gpt-4o atau openai)
    // Kita HAPUS 'temperature' biar default
    const body = {
        messages: messages
    };

    try {
        console.log("🚀 Sending Request:", body); // Cek di Console (F12)

        const response = await fetch(API_BASE_CHAT, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });

        // 3. Cek Error dengan Detail
        if (!response.ok) {
            const errText = await response.text(); // Baca pesan error asli dari server
            console.error("❌ API Error Response:", errText);
            
            // Analisa Error
            if (response.status === 400) {
                // Kemungkinan Key salah format atau Body rusak
                throw new Error(`Server menolak request (400). Pesan Server: ${errText}`);
            }
            if (response.status === 401) {
                throw new Error("API Key Pollinations Salah/Expired. Coba kosongkan Key di Settings (Mode Gratis).");
            }
            throw new Error(`API Error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content;

        // 4. Parsing JSON Manual
        if (jsonMode) {
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                return JSON.parse(content); 
            } catch (e) {
                // Fallback: Cari kurung kurawal
                const first = content.indexOf('{');
                const last = content.lastIndexOf('}');
                if (first !== -1 && last !== -1) {
                    return JSON.parse(content.substring(first, last + 1));
                }
                throw new Error("AI tidak menghasilkan JSON valid.");
            }
        }

        return content; 

    } catch (error) {
        console.error("Text Gen Error:", error);
        throw error; // Lempar ke UI biar muncul di alert
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
