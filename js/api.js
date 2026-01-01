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
window.analyzeStyle = async (imageUrl) => {
    const prompt = "Analyze the ART STYLE, LIGHTING, COLOR PALETTE, and COMPOSITION of this image. Do NOT describe the characters or subject matter. Focus on keywords for an AI image generator (e.g., 'cyberpunk, neon lighting, unreal engine 5, cinematic grain'). Output ONLY the keywords.";
    
    const res = await fetch(`${API_BASE}openai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            messages: [
                { role: "user", content: [
                    { type: "text", text: prompt },
                    { type: "image_url", image_url: { url: imageUrl } }
                ]}
            ],
            model: "openai" // Vision capable
        })
    });
    
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
