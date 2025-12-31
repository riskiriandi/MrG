/**
 * js/api.js
 * Mengatur semua komunikasi ke API Eksternal (Pollinations & ImgBB).
 * UPDATE: FIX ERROR 400 (Menghapus parameter 'json' yang tidak valid di body request).
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

    // --- PERBAIKAN DI SINI ---
    // Kita hapus properti 'json: true' karena itu bikin Error 400 di endpoint POST.
    // Kita ganti dengan 'response_format' standar OpenAI, atau kita percayakan pada Prompt.
    
    const body = {
        model: "openai", 
        messages: messages,
        temperature: 0.7,
        // json: jsonMode,  <-- INI BIANG KEROKNYA (HAPUS)
    };

    // Opsional: Kalau mau maksa JSON object (hanya jalan di model GPT terbaru)
    // Kalau error lagi, hapus blok if ini. Tapi standarnya begini:
    if (jsonMode) {
        body.response_format = { type: "json_object" };
    }

    try {
        console.log("🤖 Calling Pollinations API...", jsonMode ? "(JSON Mode)" : "");
        
        const response = await fetch(API_BASE_CHAT, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            // Baca error message dari server biar tau kenapa
            const errText = await response.text();
            console.error("API Error Details:", errText);
            
            if (response.status === 400) throw new Error("Error 400: Bad Request. Coba refresh atau cek console.");
            if (response.status === 401) throw new Error("API Key Pollinations Salah/Expired.");
            if (response.status === 500) throw new Error("Server Pollinations sedang sibuk.");
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content;

        // PARSING JSON
        if (jsonMode) {
            // Bersihin markdown ```json ... ```
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                return JSON.parse(content); 
            } catch (e) {
                console.error("JSON Parse Error. Raw Content:", content);
                throw new Error("AI gagal membuat format JSON yang valid. Coba lagi.");
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

    // Fitur Image-to-Image (Opsional, kalau masih mau dipake)
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
