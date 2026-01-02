// js/api.js

const API_BASE = "https://text.pollinations.ai/";

// 1. Upload ke ImgBB
window.uploadToImgBB = async (file) => {
    const apiKey = window.appState.config.imgbbKey;
    if (!apiKey) throw new Error("ImgBB API Key belum diisi di Settings!");

    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: "POST",
        body: formData
    });
    
    const data = await res.json();
    if (!data.success) throw new Error("Gagal upload gambar.");
    return data.data.url;
};

// 2. Vision Analysis (Khusus Style)
// js/api.js (UPDATE BAGIAN ANALYZE STYLE)

window.analyzeStyle = async (imageUrl) => {
    // PROMPT KHUSUS: FOKUS KE TEKNIK & MEDIUM, BUKAN OBJEK
    const prompt = `
        Analyze the ART MEDIUM, RENDERING STYLE, and VISUAL AESTHETIC of this image.
        
        CRITICAL INSTRUCTIONS:
        1. DO NOT describe the subject matter (e.g., do not say "a forest", "a cat", "a person").
        2. FOCUS ONLY ON:
           - The Medium (e.g., 3D Render, Oil Painting, Sketch, Anime, etc).
           - The Engine/Look (e.g., Unreal Engine 5, Octane Render, Disney Pixar style, Ghibli, etc).
           - The Lighting/Vibe (e.g., Cinematic lighting, Volumetric, Soft glow, Dark fantasy, etc).
           - The Quality (e.g., High-fidelity, Hyper-realistic, Stylized, etc).
        
        EXAMPLE OUTPUT:
        "High-fidelity Photorealistic 3D Animation, similar to Unreal Engine 5 cinematic renders. Blends stylized character design with hyper-realistic environments, volumetric lighting, and soft cinematic depth of field."
    `;
    
    // Pastikan API Key ada
    const apiKey = window.appState.config.pollinationsKey;
    
    // Kita pake endpoint Chat Completion yang support Vision (gpt-4o atau gemini)
    // Note: Kalau user free, ini mungkin agak tricky, tapi kita coba pake 'openai' default poll
    const res = await fetch('https://text.pollinations.ai/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [
                { role: "user", content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: imageUrl } }
                ]}
            ],
            model: "openai", // Model Vision
            json: false // Kita butuh teks deskripsi biasa
        })
    });
    
    if(!res.ok) throw new Error("Gagal analisa gambar.");
    
    const data = await res.text();
    return data.trim(); // Balikin teks deskripsi style
};

// ... (Sisa fungsi uploadToImgBB dan generateImage biarin aja) ...
    
    const data = await res.json();
    return data.choices[0].message.content;
};

// 3. Generate Image (Support Seed)
window.generateImage = (prompt, width, height, seed) => {
    // Kalau seed gak ada, random
    const finalSeed = seed || Math.floor(Math.random() * 1000000);
    const model = "flux"; // Atau 'nanobanana' buat karakter bagus
    
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&seed=${finalSeed}&model=${model}&nologo=true`;
    
    return { url, seed: finalSeed };
};
