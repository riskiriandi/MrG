/**
 * js/tabs/tab4.js
 * Logika Tab 4: Scene Director.
 * VERSI FULL: Menggunakan Seed Consistency (Bukan URL) untuk hasil 3D yang rapi.
 */

document.addEventListener('DOMContentLoaded', () => {
    const sceneCountInput = document.getElementById('scene-count-input');
    const btnGenerateScenes = document.getElementById('btn-generate-scenes');
    const scenesContainer = document.getElementById('scenes-container');
    const btnNext = document.getElementById('btn-next-to-video');

    const tab4Btn = document.querySelector('button[data-tab="4"]');
    if (tab4Btn) tab4Btn.addEventListener('click', loadScenesUI);
    
    loadScenesUI();

    // =================================================================
    // A. GENERATE TEXT SCENES (AI SPLITTER)
    // =================================================================
    if (btnGenerateScenes) {
        btnGenerateScenes.addEventListener('click', async () => {
            if (!AppState.story.masterScript) {
                alert("Belum ada cerita di Tab 1!");
                window.switchTab(1);
                return;
            }
            const targetCount = sceneCountInput ? sceneCountInput.value : 6;
            
            btnGenerateScenes.disabled = true;
            btnGenerateScenes.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Merancang Storyboard...';
            scenesContainer.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-20 text-accent animate-pulse">
                    <i class="ph ph-film-strip text-5xl mb-4"></i>
                    <p>AI sedang menyusun adegan 3D...</p>
                </div>`;

            try {
                const systemPrompt = `
You are a 3D Animation Director (Pixar/Disney Style).
Split story into ${targetCount} visual scenes.

OUTPUT JSON ONLY:
{
  "scenes": [
    {
      "id": 1,
      "description": "Deskripsi singkat (Indo)...",
      "visual_prompt": "Wide shot, 3D render, cute cat running in kitchen, motion blur, bright lighting, Pixar style",
      "characters_in_scene": ["Kiko"] 
    }
  ]
}`;
                const messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `STORY:\n${AppState.story.masterScript}` }
                ];

                const result = await generateTextAI(messages, true);
                if (!result || !result.scenes) throw new Error("Format JSON invalid.");

                AppState.scenes.data = result.scenes;
                AppState.scenes.count = result.scenes.length;
                saveProject();
                renderScenes();

            } catch (error) {
                console.error(error);
                alert("Gagal: " + error.message);
                scenesContainer.innerHTML = `<div class="text-center text-red-400">Error: ${error.message}</div>`;
            } finally {
                btnGenerateScenes.disabled = false;
                btnGenerateScenes.innerHTML = '<i class="ph ph-film-strip"></i> Generate Storyboard';
            }
        });
    }

    // =================================================================
    // B. RENDER UI
    // =================================================================
    function loadScenesUI() {
        if (AppState.scenes.data && AppState.scenes.data.length > 0) {
            renderScenes();
        }
    }

    function renderScenes() {
        scenesContainer.innerHTML = '';
        AppState.scenes.data.forEach((scene, index) => {
            const savedImage = scene.imageUrl; 
            const card = document.createElement('div');
            card.className = 'glass-panel rounded-xl overflow-hidden flex flex-col md:flex-row animate-fade-in border border-white/10 mb-4';
            
            card.innerHTML = `
                <div class="p-5 md:w-1/3 flex flex-col border-b md:border-b-0 md:border-r border-white/10 bg-black/20">
                    <div class="flex justify-between items-start mb-3">
                        <span class="px-2 py-1 rounded bg-accent/20 text-accent text-xs font-bold border border-accent/20">SCENE ${scene.id}</span>
                        <button id="btn-edit-scene-${index}" class="text-gray-400 hover:text-white"><i class="ph ph-pencil-simple"></i></button>
                    </div>
                    <p class="text-sm text-gray-300 mb-4 flex-grow font-serif leading-relaxed">"${scene.description}"</p>
                    <div class="mt-auto">
                        <p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Karakter:</p>
                        <div class="flex flex-wrap gap-1">
                            ${scene.characters_in_scene && scene.characters_in_scene.length > 0 
                                ? scene.characters_in_scene.map(c => `<span class="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">${c}</span>`).join('') 
                                : '-'}
                        </div>
                    </div>
                </div>
                <div class="relative md:w-2/3 bg-black/50 min-h-[250px] group">
                    ${savedImage 
                        ? `<img src="${savedImage}" class="w-full h-full object-cover cursor-pointer" id="img-scene-${index}">`
                        : `<div id="placeholder-scene-${index}" class="absolute inset-0 flex flex-col items-center justify-center text-gray-600"><i class="ph ph-image text-4xl mb-2 opacity-50"></i><p class="text-xs">Klik Render</p></div><img id="img-scene-${index}" class="hidden w-full h-full object-cover cursor-pointer">`
                    }
                    <div id="loader-scene-${index}" class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center hidden z-20">
                        <i class="ph ph-spinner animate-spin text-accent text-3xl mb-3"></i><span class="text-xs text-gray-300">Rendering...</span>
                    </div>
                    <div class="absolute bottom-4 right-4 flex gap-2">
                        <button id="btn-dl-scene-${index}" class="p-2 rounded-lg bg-black/60 hover:bg-accent text-white backdrop-blur-md border border-white/10 transition-all ${savedImage ? '' : 'hidden'}"><i class="ph ph-download-simple"></i></button>
                        <button id="btn-gen-scene-${index}" class="px-4 py-2 rounded-lg btn-neon text-xs font-bold flex items-center gap-2 shadow-lg">
                            ${savedImage ? '<i class="ph ph-arrows-clockwise"></i> Re-Render' : '<i class="ph ph-paint-brush"></i> Render'}
                        </button>
                    </div>
                </div>
            `;
            scenesContainer.appendChild(card);

            document.getElementById(`btn-gen-scene-${index}`).addEventListener('click', () => generateSceneImage(scene, index));
            document.getElementById(`btn-edit-scene-${index}`).addEventListener('click', () => {
                const newPrompt = prompt("Edit Prompt:", scene.visual_prompt);
                if (newPrompt) { scene.visual_prompt = newPrompt; saveProject(); }
            });
            const btnDl = document.getElementById(`btn-dl-scene-${index}`);
            if(btnDl) btnDl.addEventListener('click', () => { if(scene.imageUrl) downloadImage(scene.imageUrl, `Scene_${scene.id}.jpg`); });
            
            // View Fullscreen
            const imgEl = document.getElementById(`img-scene-${index}`);
            if(imgEl) {
                imgEl.addEventListener('click', () => {
                    if(scene.imageUrl) {
                        const modal = document.getElementById('image-viewer-modal');
                        if(modal) {
                            document.getElementById('full-image-preview').src = scene.imageUrl;
                            modal.classList.remove('hidden');
                        } else {
                            window.open(scene.imageUrl, '_blank');
                        }
                    }
                });
            }
        });
    }

    // =================================================================
    // C. LOGIC GENERATE (THE FIX: SEED + DESC, NO URL)
    // =================================================================
    function generateSceneImage(scene, index) {
        const loader = document.getElementById(`loader-scene-${index}`);
        const imgEl = document.getElementById(`img-scene-${index}`);
        const placeholder = document.getElementById(`placeholder-scene-${index}`);
        const btnDl = document.getElementById(`btn-dl-scene-${index}`);

        if(loader) loader.classList.remove('hidden');

        // 1. CARI DATA KARAKTER (SEED & DESKRIPSI)
        let charSeed = null;
        let charDesc = "";
        
        if (scene.characters_in_scene && scene.characters_in_scene.length > 0) {
            const mainCharName = scene.characters_in_scene[0];
            
            // Cari karakter di list Tab 1 (buat ambil deskripsi visualnya)
            const charData = AppState.story.characters.find(c => c.name.toLowerCase().includes(mainCharName.toLowerCase()));
            if (charData) {
                charDesc = charData.visual_desc; // Ambil deskripsi lengkapnya
            }

            // Cari Seed di Tab 3 (buat konsistensi wajah)
            if (AppState.characters.seeds && AppState.characters.seeds[mainCharName]) {
                charSeed = AppState.characters.seeds[mainCharName];
                console.log(`🧬 Using Seed ${charSeed} for ${mainCharName}`);
            }
        }

        // 2. RAKIT PROMPT (TANPA IMG2IMG URL)
        // Kita gabungin: [Deskripsi Karakter Lengkap] + [Aksi Scene] + [Style]
        
        let finalPrompt = "";
        if (charDesc) {
            finalPrompt += `(${charDesc}), `; // Deskripsi fisik karakter
        }
        finalPrompt += `${scene.visual_prompt}, `; // Aksi scene
        finalPrompt += `(3D Render:1.3), (Disney Pixar Style), (Cute), (Volumetric Lighting), masterpiece, 8k`;

        // 3. CONFIG
        const options = {
            width: AppState.style.width || 1280,
            height: AppState.style.height || 720,
            model: AppState.style.selectedModel || 'seedream',
            // Kalau ada seed karakter, pake itu. Kalau gak, random.
            seed: charSeed || Math.floor(Math.random() * 1000000) 
        };

        // CATATAN: Kita TIDAK mengirim refImage (URL) di sini biar gambar gak penyok.
        // Kita mengandalkan SEED dan DESKRIPSI VISUAL yang sama.

        let url = generateImageURL(finalPrompt, options);
        url += `&negative_prompt=${encodeURIComponent("sketch, 2d, drawing, painting, bad anatomy, blurry, text, watermark, deformed")}`;
        url += `&t=${Date.now()}`;

        const tempImg = new Image();
        tempImg.onload = () => {
            if(loader) loader.classList.add('hidden');
            if(placeholder) placeholder.classList.add('hidden');
            if(imgEl) { imgEl.src = url; imgEl.classList.remove('hidden'); }
            if(btnDl) btnDl.classList.remove('hidden');
            scene.imageUrl = url;
            saveProject();
        };
        tempImg.onerror = () => {
            if(loader) loader.classList.add('hidden');
            alert("Gagal render scene.");
        };
        tempImg.src = url;
    }

    // =================================================================
    // D. HELPER DOWNLOAD (FULL CODE)
    // =================================================================
    async function downloadImage(url, filename) {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) { window.open(url, '_blank'); }
    }

    if (btnNext) btnNext.addEventListener('click', () => window.switchTab(5));
});
