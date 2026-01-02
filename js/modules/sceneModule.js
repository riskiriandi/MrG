// js/modules/sceneModule.js

window.initSceneModule = () => {
    renderSceneGrid();
};

window.renderSceneGrid = () => {
    const scenes = window.appState.project.scenes;
    const container = document.getElementById('scenes-container');
    if (!container) return;

    if (scenes.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center opacity-50">Generate Story dulu.</div>`;
        return;
    }

    container.innerHTML = scenes.map((scene, index) => {
        // DROPDOWN MODEL PER SCENE
        const modelSelect = `
            <select id="model-scene-${index}" class="bg-black/50 border border-white/10 text-[10px] text-gray-300 rounded px-2 py-1 mb-2 w-full">
                <option value="seedream" ${scene.model === 'seedream' ? 'selected' : ''}>Seedream</option>
                <option value="kontext" ${scene.model === 'kontext' ? 'selected' : ''}>Kontext</option>
                <option value="nanobanana" ${scene.model === 'nanobanana' ? 'selected' : ''}>Nanobanana</option>
                <option value="seedream-pro" ${scene.model === 'seedream-pro' ? 'selected' : ''}>Seedream Pro</option>
            </select>
        `;

        return `
        <div class="glass-panel p-4 rounded-xl border-l-4 border-accent">
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-bold text-white">Scene ${index + 1}</h4>
                <button onclick="generateScene(${index})" class="btn-primary text-xs px-3 py-1">Render</button>
            </div>
            ${modelSelect}
            <p class="text-xs text-gray-400 mb-3 h-10 overflow-hidden">${scene.text}</p>
            
            <div class="aspect-video bg-black/50 rounded-lg overflow-hidden relative group">
                ${scene.img 
                    ? `<img src="${scene.img}" class="w-full h-full object-cover cursor-pointer" onclick="window.open('${scene.img}', '_blank')">` 
                    : `<div class="flex items-center justify-center h-full text-gray-600 text-xs">Ready to Render</div>`
                }
            </div>
        </div>`;
    }).join('');
};

window.generateScene = async (index) => {
    const scene = window.appState.project.scenes[index];
    const chars = window.appState.project.characters;
    const style = window.appState.project.style.prompt;
    
    // AMBIL MODEL
    const selectedModel = document.getElementById(`model-scene-${index}`).value;
    window.appState.project.scenes[index].model = selectedModel;

    showToast(`Rendering Scene ${index + 1}...`, 'info');

    // 1. CARI KARAKTER (INJECTION LOGIC)
    let mainCharImg = null;
    let promptText = scene.text;

    // Cek setiap karakter, apakah namanya ada di scene?
    chars.forEach(char => {
        if (scene.text.includes(char.name)) {
            // Tambah deskripsi fisik ke prompt biar makin akurat
            promptText += `, (${char.desc})`;
            
            // Ambil URL Gambar Karakter (Kalau ada)
            if (!mainCharImg && char.img) {
                mainCharImg = char.img;
            }
        }
    });

    // 2. FINAL PROMPT
    const finalPrompt = `${promptText}, ${style}, cinematic, 8k`;
    const encodedPrompt = encodeURIComponent(finalPrompt);
    const seed = Math.floor(Math.random() * 1000000); // Seed Random biar pose beda

    // 3. CONSTRUCT URL
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=1280&height=720&seed=${seed}&model=${selectedModel}&nologo=true`;
    
    // INJECTION: Kalau ada karakter terdeteksi, tempel gambarnya!
    if (mainCharImg) {
        console.log("Injecting Character Image:", mainCharImg);
        const encodedRef = encodeURIComponent(mainCharImg);
        url += `&image=${encodedRef}`;
    }

    // 4. UPDATE STATE
    window.appState.project.scenes[index].img = url;
    window.appState.project.scenes[index].seed = seed;

    // 5. REFRESH UI (Delay dikit)
    setTimeout(() => {
        renderSceneGrid();
        showToast("Scene Rendered!", "success");
    }, 500);
};
