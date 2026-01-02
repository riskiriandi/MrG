// ============================================================
// API HANDLER (ImgBB & Pollinations Vision)
// ============================================================

// 1. UPLOAD KE IMGBB
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
    if (!data.success) throw new Error("Gagal upload gambar ke ImgBB.");
    return data.data.url;
};

// 2. ANALISA STYLE (VISION AI)
window.analyzeStyle = async (imageUrl) => {
    const apiKey = window.appState.config.pollinationsKey;
    if (!apiKey) throw new Error("Pollinations API Key wajib diisi buat fitur Vision!");

    // Prompt: Fokus ke Teknik & Render
    const prompt = `
        Analyze the ART STYLE of this image.
        Focus on: Art Medium (3D/2D/Painting), Rendering Style (Unreal Engine/Pixar/Anime), Lighting, and Color Palette.
        Do NOT describe the subject (e.g. don't say "a cat sitting").
        Keep it concise (1 paragraph).
    `;

    console.log("Analyzing Image URL:", imageUrl);

    // Pake Endpoint Chat Completions
    const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}` // Wajib pake Bearer Token
        },
        body: JSON.stringify({
            model: "openai-large", // WAJIB 'openai-large' atau 'gemini' buat Vision!
            messages: [
                { 
                    role: "user", 
                    content: [
                        { type: "text", text: prompt },
                        { type: "image_url", image_url: { url: imageUrl } }
                    ] 
                }
            ],
            max_tokens: 300
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Vision API Error (${response.status}): ${errText}`);
    }

    const result = await response.json();
    
    // Cek apakah ada isinya
    if (result.choices && result.choices.length > 0 && result.choices[0].message) {
        const styleDescription = result.choices[0].message.content;
        console.log("Style Result:", styleDescription);
        return styleDescription.trim();
    } else {
        console.error("Empty Response:", result);
        throw new Error("AI merespon tapi tidak ada teks deskripsi.");
    }
};

// 3. GENERATE IMAGE (Helper function)
window.generateImage = (prompt, width, height, seed, model = 'seedream') => {
    const encodedPrompt = encodeURIComponent(prompt);
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;
    
    if(window.appState.config.pollinationsKey) {
        url += `&key=${window.appState.config.pollinationsKey}`;
    }
    
    return { url, seed };
};
