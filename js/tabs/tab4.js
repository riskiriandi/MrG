/**
 * js/tabs/tab4.js
 * Logika Tab 4: Scene Director (Storyboard).
 * UPDATE: Fix JSON Parsing Error, Face Lock Consistency, & 3D Style Support.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. AMBIL ELEMENT DOM
    const sceneCountInput = document.getElementById('scene-count-input');
    const btnGenerateScenes = document.getElementById('btn-generate-scenes');
    const scenesContainer = document.getElementById('scenes-container');
    const btnNext = document.getElementById('btn-next-to-video');

    // Load data saat tab dibuka
    const tab4Btn = document.querySelector('button[data-tab="4"]');
    if (tab4Btn) tab4Btn.addEventListener('click', loadScenesUI);
    
    // Load awal (jika refresh di tab ini)
    loadScenesUI();

    // =================================================================
    // A. LOGIC GENERATE TEXT SCENES (AI SPLITTER)
    // =================================================================
    if (btnGenerateScenes) {
        btnGenerateScenes.addEventListener('click', async () => {
            // Validasi: Harus ada cerita dulu
            if (!AppState.story.masterScript) {
                alert("Belum ada cerita di Tab 1! Buat cerita dulu.");
                window.switchTab(1);
                return;
            }

            const targetCount = sceneCountInput ? sceneCountInput.value : 6;
            
            // UI Loading
            const originalText = btnGenerateScenes.innerHTML;
            btnGenerateScenes.disabled = true;
            btnGenerateScenes.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Merancang Storyboard...';
            
            // Tampilan Loading di Container
            scenesContainer.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-20 text-accent animate-pulse">
                    <i class="ph ph-film-strip text-5xl mb-4"></i>
                    <p>AI sedang membaca naskah dan membagi adegan...</p>
                    <p class="text-xs text-gray-500 mt-2">Mohon tunggu, sedang menyusun JSON...</p>
                </div>
            `;

            try {
                // SYSTEM PROMPT KHUSUS SCENE (Strict JSON)
                const systemPrompt = `
You are an expert Movie Director for a 3D Animation Movie.
Task: Split the story into exactly ${targetCount} visual scenes.

INSTRUCTIONS:
1. Analyze the story.
2. Break it down into ${targetCount} scenes.
3. **Visual Prompt (ENGLISH):** Describe the scene for a 3D Image Generator. 
   - Use keywords: "3D render", "Pixar style", "cute", "volumetric lighting".
   - Mention the character's action clearly.
4. **Characters:** List EXACT names of characters present.

OUTPUT JSON FORMAT ONLY (NO MARKDOWN):
{
  "scenes": [
    {
      "id": 1,
      "description": "Deskripsi singkat scene (Indo)...",
      "visual_prompt": "Wide shot, 3D render, cute cat running in a kitchen, motion blur, bright lighting, Pixar style",
      "characters_in_scene": ["Kiko"] 
    }
  ]
}
`;

                const messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `STORY:\n${AppState.story.masterScript}` }
                ];

                // Panggil API Text (JSON Mode)
                console.log("🚀 Mengirim request scene ke AI...");
                const result = await generateTextAI(messages, true);
                
                console.log("✅ Scene Result:", result);

                // Validasi Struktur JSON
                if (!result || !result.scenes || !Array.isArray(result.scenes)) {
                    throw new Error("Format JSON dari AI tidak valid. Coba generate ulang.");
                }

                // Simpan ke State
                AppState.scenes.data = result.scenes;
                AppState.scenes.count = result.scenes.length;
                saveProject();

                // Render UI
                renderScenes();

            } catch (error) {
                console.error("❌ Error Tab 4:", error);
                alert("Gagal membuat scene: " + error.message);
                scenesContainer.innerHTML = `
                    <div class="col-span-full text-center p-10 border border-red-500/30 bg-red-500/10 rounded-xl">
                        <i class="ph ph-warning text-3xl text-red-400 mb-2"></i>
                        <p class="text-red-300 mb-4">Terjadi kesalahan saat memproses data.</p>
                        <button onclick="location.reload()" class="text-xs underline text-gray-400">Refresh Halaman</button>
                    </div>`;
            } finally {
                btnGenerateScenes.disabled = false;
                btnGenerateScenes.innerHTML = originalText;
            }
        });
    }

    // =================================================================
    // B. RENDER SCENES UI
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
            card.style.animationDelay = `${index * 100}ms`;

            card.innerHTML = `
                <!-- KOLOM KIRI: INFO SCENE -->
                <div class="p-5 md:w-1/3 flex flex-col border-b md:border-b-0 md:border-r border-white/10 bg-black/20">
                    <div class="flex justify-between items-start mb-3">
                        <span class="px-2 py-1 rounded bg-accent/20 text-accent text-xs font-bold border border-accent/20">SCENE ${scene.id}</span>
                        <button id="btn-edit-scene-${index}" class="text-gray-400 hover:text-white" title="Edit Prompt">
                            <i class="ph ph-pencil-simple"></i>
                        </button>
                    </div>
                    
                    <p class="text-sm text-gray-300 mb-4 flex-grow font-serif leading-relaxed">"${scene.description}"</p>
                    
                    <div class="mt-auto">
                        <p class="text-[10px] text-gray-500 uppercase font-bold mb-1">Karakter Terdeteksi:</p>
                        <div class="flex flex-wrap gap-1">
                            ${scene.characters_in_scene && scene.characters_in_scene.length > 0 
                                ? scene.characters_in_scene.map(c => `<span class="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">${c}</span>`).join('') 
                                : '<span class="text-[10px] text-gray-600">-</span>'}
                        </div>
                    </div>
                </div>

                <!-- KOLOM KANAN: GAMBAR -->
                <div class="relative md:w-2/3 bg-black/50 min-h-[250px] group">
                    ${savedImage 
                        ? `<img src="${savedImage}" class="w-full h-full object-cover cursor-pointer" id="img-scene-${index}">`
                        : `<div id="placeholder-scene-${index}" class="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
                                <i class="ph ph-image text-4xl mb-2 opacity-50"></i>
                                <p class="text-xs">Klik Render Image</p>
                           </div>
                           <img id="img-scene-${index}" class="hidden w-full h-full object-cover cursor-pointer">`
                    }

                    <!-- Loading Overlay -->
                    <div id="loader-scene-${index}" class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center hidden z-20">
                        <i class="ph ph-spinner animate-spin text-accent text-3xl mb-3"></i>
                        <span class="text-xs text-gray-300">Rendering Scene...</span>
                    </div>

                    <!-- Action Buttons (Overlay) -->
                    <div class="absolute bottom-4 right-4 flex gap-2">
                        <button id="btn-dl-scene-${index}" class="p-2 rounded-lg bg-black/60 hover:bg-accent text-white backdrop-blur-md border border-white/10 transition-all ${savedImage ? '' : 'hidden'}" title="Download">
                            <i class="ph ph-download-simple"></i>
                        </button>
                        <button id="btn-gen-scene-${index}" class="px-4 py-2 rounded-lg btn-neon text-xs font-bold flex items-center gap-2 shadow-lg">
                            ${savedImage ? '<i class="ph ph-arrows-clockwise"></i> Re-Render' : '<i class="ph ph-paint-brush"></i> Render Image'}
                        </button>
                    </div>
                </div>
            `;

            scenesContainer.appendChild(card);

            // EVENT LISTENERS
            
            // 1. Generate Image
            document.getElementById(`btn-gen-scene-${index}`).addEventListener('click', () => {
                generateSceneImage(scene, index);
            });

            // 2. Edit Prompt
            document.getElementById(`btn-edit-scene-${index}`).addEventListener('click', () => {
                const newPrompt = prompt("Edit Visual Prompt Scene ini:", scene.visual_prompt);
                if (newPrompt) {
                    scene.visual_prompt = newPrompt;
                    saveProject();
                }
            });

            // 3. Download
            const btnDl = document.getElementById(`btn-dl-scene-${index}`);
            if(btnDl) {
                btnDl.addEventListener('click', () => {
                    if(scene.imageUrl) downloadImage(scene.imageUrl, `Scene_${scene.id}.jpg`);
                });
            }
            
            // 4. View Fullscreen (Pake Modal Tab 3 kalau ada, atau window.open)
            const imgEl = document.getElementById(`img-scene-${index}`);
            if(imgEl) {
                imgEl.addEventListener('click', () => {
                    if(scene.imageUrl) {
                        // Coba panggil modal global dari Tab 3
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
    // C. LOGIC GENERATE IMAGE (FACE LOCK & 3D STYLE)
    // =================================================================
    function generateSceneImage(scene, index) {
        const loader = document.getElementById(`loader-scene-${index}`);
        const imgEl = document.getElementById(`img-scene-${index}`);
        const placeholder = document.getElementById(`placeholder-scene-${index}`);
        const btnDl = document.getElementById(`btn-dl-scene-${index}`);

        if(loader) loader.classList.remove('hidden');

        // 1. CARI REFERENSI KARAKTER (Face Lock)
        let refImage = null;
        
        if (scene.characters_in_scene && scene.characters_in_scene.length > 0) {
            // Ambil karakter pertama
            const mainCharName = scene.characters_in_scene[0];
            
            // Cari URL di AppState (Case Insensitive)
            const savedChars = AppState.characters.generatedImages;
            const matchKey = Object.keys(savedChars).find(key => key.toLowerCase().includes(mainCharName.toLowerCase()));
            
            if (matchKey) {
                refImage = savedChars[matchKey];
                console.log(`🔗 Linking character: ${matchKey} to Scene ${scene.id}`);
            }
        }

        // 2. RAKIT PROMPT (3D PIXAR STYLE)
        let consistencyPrompt = "";
        if (refImage) {
            // Prompt khusus biar wajah mirip tapi pose bebas
            consistencyPrompt = "(Same character as reference:1.5), ";
        }

        // Gabungkan: [Konsistensi] + [Prompt Scene] + [Style 3D]
        const finalPrompt = `${consistencyPrompt}${scene.visual_prompt}, (3D Render:1.3), (Disney Pixar Style), (Cute), (Volumetric Lighting), masterpiece, 8k`;

        // 3. CONFIG
        const options = {
            width: AppState.style.width || 1280,
            height: AppState.style.height || 720,
            model: AppState.style.selectedModel || 'seedream', // Seedream bagus buat 3D
            seed: scene.seed || Math.floor(Math.random() * 1000000), 
            refImage: refImage // Kirim URL referensi
        };

        // Simpan seed
        scene.seed = options.seed; 

        // 4. GENERATE URL
        let url = generateImageURL(finalPrompt, options);
        // Negative prompt biar gak jadi 2D/Sketch
        url += `&negative_prompt=${encodeURIComponent("sketch, 2d, drawing, painting, bad anatomy, blurry, text, watermark")}`;
        url += `&t=${Date.now()}`;

        // 5. LOAD IMAGE
        const tempImg = new Image();
        tempImg.onload = () => {
            if(loader) loader.classList.add('hidden');
            if(placeholder) placeholder.classList.add('hidden');
            if(imgEl) {
                imgEl.src = url;
                imgEl.classList.remove('hidden');
            }
            if(btnDl) btnDl.classList.remove('hidden');

            scene.imageUrl = url;
            saveProject();
        };

        tempImg.onerror = () => {
            if(loader) loader.classList.add('hidden');
            alert("Gagal render scene. Coba lagi.");
        };

        tempImg.src = url;
    }

    // =================================================================
    // D. HELPER DOWNLOAD
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

    if (btnNext) {
        btnNext.addEventListener('click', () => window.switchTab(5));
    }
});
