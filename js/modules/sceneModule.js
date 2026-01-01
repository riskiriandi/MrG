// js/modules/sceneModule.js

window.initSceneModule = () => {
    console.log("Scene Module Loaded");
    renderSceneGrid();
};

window.renderSceneGrid = () => {
    const scenes = window.appState.project.scenes;
    const container = document.getElementById('scenes-container');
    
    if (!container) return;

    if (scenes.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-10 opacity-50">Generate Story dulu di Tab 1 bro.</div>`;
        return;
    }

    container.innerHTML = scenes.map((scene, index) => `
        <div class="glass-panel p-4 rounded-xl border-l-4 border-accent">
            <div class="flex justify-between items-start mb-3">
                <h4 class="font-bold text-white">Scene ${index + 1}</h4>
                <button onclick="generateScene(${index})" class="btn-primary text-xs px-3 py-1">
                    <i class="ph ph-film-strip"></i> Generate
                </button>
            </div>
            
            <p class="text-xs text-gray-400 mb-3 h-10 overflow-hidden">${scene.text}</p>
            
            <!-- Image Result -->
            <div class="aspect-video bg-black/50 rounded-lg overflow-hidden relative group">
                ${scene.img 
                    ? `<img src="${scene.img}" class="w-full h-full object-cover cursor-pointer" onclick="window.open('${scene.img}', '_blank')">` 
                    : `<div class="flex items-center justify-center h-full text-gray-600 text-xs">Waiting to render...</div>`
                }
            </div>
        </div>
    `).join('');
};

// LOGIC UTAMA: IMAGE-TO-IMAGE INJECTION
window.generateScene = async (index) => {
    const scene = window.appState.project.scenes[index];
    const chars = window.appState.project.characters;
    const style = window.appState.project.style.prompt;

    showToast(`Rendering Scene ${index + 1}...`, 'info');

    // 1. Cari Karakter Utama di Scene Ini
    // Kita cari karakter mana yang namanya disebut di teks scene
    let mainChar = null;
    let promptInjection = scene.text;

    chars.forEach(char => {
        if (scene.text.includes(char.name)) {
            // Inject Deskripsi Fisik ke Prompt (Text Guidance)
            promptInjection = promptInjection.replace(char.name, `${char.name} (${char.desc})`);
            
            // Ambil Gambar Referensi (Image Guidance)
            // Prioritaskan karakter pertama yang ketemu sebagai "Anchor"
            if (!mainChar && char.img) {
                mainChar = char;
            }
        }
    });

    // 2. Final Prompt
    const finalPrompt = `${promptInjection}, ${style}, cinematic lighting, 8k`;
    const encodedPrompt = encodeURIComponent(finalPrompt);
    
    // 3. Construct URL
    // Kalau ada Main Character, kita pake parameter ?image=URL
    let url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1280&height=720&model=seedream&nologo=true`;
    
    if (mainChar) {
        console.log(`Using Anchor Image for ${mainChar.name}`);
        // Encode URL gambar referensi juga!
        const encodedRefImg = encodeURIComponent(mainChar.img);
        url += `&image=${encodedRefImg}`;
    }

    // 4. Random Seed buat Scene (Biar posenya beda sama pas foto KTP di Tab 3)
    const sceneSeed = Math.floor(Math.random() * 1000000);
    url += `&seed=${sceneSeed}`;

    // 5. Update State
    window.appState.project.scenes[index].img = url;
    window.appState.project.scenes[index].seed = sceneSeed;

    // 6. Refresh UI
    setTimeout(() => {
        renderSceneGrid();
        showToast(`Scene ${index + 1} Rendered!`, 'success');
    }, 1000);
};
