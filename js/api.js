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

    // Prompt Khusus: Fokus ke Teknik & Render, BUKAN Objek.
    const prompt = `
        Analyze the ART STYLE, RENDERING TECHNIQUE, and VISUAL AESTHETIC of this image.
        
        CRITICAL INSTRUCTIONS:
        1. IGNORE the subject matter (do not describe the person, place, or objects).
        2. FOCUS ONLY ON:
           - Medium (e.g. 3D Render, Oil Painting, Digital Art, etc).
           - Engine/Look (e.g. Unreal Engine 5, Octane Render, Pixar Style, Ghibli, etc).
           - Lighting (e.g. Volumetric, Cinematic, Soft, Hard, etc).
           - Quality (e.g. 8k, Hyper-realistic, Stylized, etc).
        
        OUTPUT FORMAT:
        Just a single paragraph describing the style keywords.
        Example: "High-fidelity 3D animation style, similar to Unreal Engine 5, with volumetric lighting, soft cinematic depth of field, and hyper-realistic textures."
    `;

    console.log("Analyzing Image:", imageUrl);

    // Pake Endpoint Chat Completions (Support Vision)
    const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}` // Wajib pake Bearer Token
        },
        body: JSON.stringify({
            model: "openai", // Model OpenAI paling bagus buat Vision
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
    const styleDescription = result.choices[0].message.content;
    
    console.log("Style Result:", styleDescription);
    return styleDescription.trim();
};

// 3. GENERATE IMAGE (Helper function, kalau butuh direct call)
window.generateImage = (prompt, width, height, seed, model = 'seedream') => {
    const encodedPrompt = encodeURIComponent(prompt);
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${model}&nologo=true`;
    
    if(window.appState.config.pollinationsKey) {
        url += `&key=${window.appState.config.pollinationsKey}`;
    }
    
    return { url, seed };
};
