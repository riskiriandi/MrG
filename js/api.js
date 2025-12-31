/**
 * js/api.js
 * Mengatur semua komunikasi ke API Eksternal (Pollinations & ImgBB).
 * File ini membutuhkan 'AppState' dari state.js untuk mengambil API Key.
 */

const API_BASE_CHAT = 'https://gen.pollinations.ai/v1/chat/completions'; // Text & Vision
const API_BASE_IMAGE = 'https://image.pollinations.ai/prompt/';          // Image Gen

// =================================================================
// 1. HELPER: URL ENCODING (PENTING BUAT IMAGE-TO-IMAGE)
// =================================================================
function safeEncode(url) {
    // Mengubah karakter spesial (?, &, =) menjadi format aman URL
    // Contoh: "https://site.com?id=1" -> "https%3A%2F%2Fsite.com%3Fid%3D1"
    return encodeURIComponent(url);
}

// =================================================================
// 2. IMGBB UPLOAD (TAB 2 - STYLE REFERENCE)
// =================================================================
async function uploadToImgBB(file) {
    // Ambil key dari State
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
            // Handle error spesifik dari ImgBB
            throw new Error(data.error ? data.error.message : "Gagal upload gambar ke ImgBB.");
        }
        
        console.log("✅ Upload Success:", data.data.url);
        return data.data.url; // Return URL gambar publik

    } catch (error) {
        console.error("ImgBB Error:", error);
        throw error; // Lempar error biar bisa ditangkap di UI
    }
}

// =================================================================
// 3. TEXT & VISION GENERATION (TAB 1 & TAB 2)
// =================================================================
/**
 * Fungsi serbaguna untuk Chat & Vision.
 * @param {Array} messages - Format pesan OpenAI [{role: "user", content: ...}]
 * @param {Boolean} jsonMode - Jika true, memaksa output jadi Object JSON (bukan string)
 */
async function generateTextAI(messages, jsonMode = false) {
    const apiKey = AppState.settings.pollinationsKey || null; // Optional
    
    const headers = {
        'Content-Type': 'application/json',
    };
    // Kalau user punya key, pake. Kalau enggak, mode gratis (rate limit lebih ketat).
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    // Body Request
    const body = {
        model: "openai", // Model paling stabil buat instruksi kompleks/vision
        messages: messages,
        temperature: 0.7, // Kreativitas sedang
        json: jsonMode    // Flag khusus Pollinations buat maksa JSON
    };

    try {
        console.log("🤖 Calling Pollinations Text/Vision API...", jsonMode ? "(JSON Mode)" : "");
        
        const response = await fetch(API_BASE_CHAT, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            // Handle HTTP Errors (401, 500, etc)
            if (response.status === 401) throw new Error("API Key Pollinations Salah/Expired.");
            if (response.status === 500) throw new Error("Server Pollinations sedang sibuk/error internal.");
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        let content = data.choices[0].message.content;

        // PARSING JSON (PENTING BUAT TAB 1)
        if (jsonMode) {
            // Kadang AI ngasih markdown ```json ... ```, kita bersihin dulu
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                return JSON.parse(content); // Return sebagai Object
            } catch (e) {
                console.error("JSON Parse Error. Raw Content:", content);
                throw new Error("AI gagal membuat format JSON yang valid. Coba lagi.");
            }
        }

        return content; // Return sebagai String biasa

    } catch (error) {
        console.error("Text Gen Error:", error);
        throw error;
    }
}

// =================================================================
// 4. IMAGE GENERATION URL BUILDER (TAB 3 & TAB 4)
// =================================================================
/**
 * Membuat URL gambar Pollinations. Tidak perlu fetch, cukup pasang di src <img>.
 * @param {String} prompt - Deskripsi gambar
 * @param {Object} options - Config (width, height, model, seed, refImage)
 */
function generateImageURL(prompt, options = {}) {
    // 1. Validasi Model (Hanya 3 pilihan sesuai request)
    const allowedModels = ['seedream', 'seedream-pro', 'nanobanana'];
    let model = options.model || 'seedream';
    
    if (!allowedModels.includes(model)) {
        console.warn(`Model ${model} tidak dikenal, fallback ke seedream.`);
        model = 'seedream';
    }

    // 2. Setup Parameter Dasar
    const width = options.width || 1024;
    const height = options.height || 1024;
    const seed = options.seed || Math.floor(Math.random() * 1000000); // Random seed kalau gak diset
    
    // 3. Encode Prompt (Biar spasi & simbol gak ngerusak link)
    const encodedPrompt = encodeURIComponent(prompt);

    // 4. Rakit URL Dasar
    let url = `${API_BASE_IMAGE}${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${seed}&nologo=true`;

    // 5. Fitur Image-to-Image (Buat Tab 4 Consistency)
    // Kalau ada referensi gambar (misal wajah karakter), tempel di URL
    if (options.refImage) {
        const encodedRef = safeEncode(options.refImage);
        url += `&image=${encodedRef}`;
        url += `&guidance_scale=1.5`; // Tingkat kemiripan (bisa di-tweak)
    }

    return url;
}

// =================================================================
// 5. VISION WRAPPER (KHUSUS TAB 2)
// =================================================================
async function analyzeImageStyle(imageUrl) {
    // Kita panggil generateTextAI tapi dengan payload gambar
    const messages = [
        {
            role: "user",
            content: [
                { 
                    type: "text", 
                    text: "Analyze the art style of this image. Focus on: Lighting, Color Palette, Rendering Style (e.g. 3D, Anime, Oil Painting), and Mood. Output ONLY a comma-separated list of style keywords (Master Prompt)." 
                },
                { 
                    type: "image_url", 
                    image_url: { url: imageUrl } 
                }
            ]
        }
    ];

    // Panggil fungsi Text Gen (return string, bukan JSON)
    return await generateTextAI(messages, false);
}
