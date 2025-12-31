/**
 * js/tabs/tab4.js
 * Logika Tab 4: Scene Director (Storyboard).
 * Memecah cerita menjadi adegan visual & menjaga konsistensi karakter.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. AMBIL ELEMENT DOM
    const sceneCountInput = document.getElementById('scene-count-input'); // Pastikan ID ini ada di HTML Tab 4
    // Kalau di HTML lu ID-nya 'scene-count', sesuaikan. Di index.html yg gw kasih ID-nya: scene-count-input
    
    const btnGenerateScenes = document.getElementById('btn-generate-scenes');
    const scenesContainer = document.getElementById('scenes-container');
    const btnNext = document.getElementById('btn-next-to-video');

    // Load data saat tab dibuka
    const tab4Btn = document.querySelector('button[data-tab="4"]');
    if (tab4Btn) tab4Btn.addEventListener('click', loadScenesUI);
    
    // Load awal
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
            scenesContainer.innerHTML = `
                <div class="col-span-full flex flex-col items-center justify-center py-20 text-accent animate-pulse">
                    <i class="ph ph-film-strip text-5xl mb-4"></i>
                    <p>AI sedang membaca naskah dan membagi adegan...</p>
                </div>
            `;

            try {
                // SYSTEM PROMPT KHUSUS SCENE
                const systemPrompt = `
You are an expert Movie Director and Storyboard Artist.
Task: Split the provided story into exactly ${targetCount} distinct visual scenes.

INSTRUCTIONS:
1. Analyze the story flow.
2. Break it down into ${targetCount} key moments (Scenes).
3. For each scene, identify which characters are present.
4. Create a "visual_prompt" in ENGLISH for Image Generation.
   - Include: Camera angle, Lighting, Environment, Character Action.
   - Style: ${AppState.style.masterPrompt || "Cinematic, Detailed"}.

OUTPUT JSON FORMAT:
{
  "scenes": [
    {
      "id": 1,
      "description": "Deskripsi singkat scene dalam Bahasa Indonesia...",
      "visual_prompt": "Wide shot, cyberpunk street at night, neon rain, Jono standing looking at a hologram, cinematic lighting, 8k",
      "characters_in_scene": ["Jono"] 
    }
  ]
}
IMPORTANT: "characters_in_scene" must match the names used in the story exactly.
`;

                const messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `STORY:\n${AppState.story.masterScript}` }
                ];

                // Panggil API Text (JSON Mode)
                const result = await generateTextAI(messages, true);
                
                console.log("Scene Result:", result);

                // Simpan ke State
                AppState.scenes.data = result.scenes;
                AppState.scenes.count = result.scenes.length;
                saveProject();

                // Render UI
                renderScenes();

            } catch (error) {
                console.error(error);
                alert("Gagal membuat scene: " + error.message);
                scenesContainer.innerHTML = `<div class="col-span-full text-center text-red-400">Error: ${error.message}</div>`;
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
            const savedImage = scene.imageUrl; // Gambar yg udah digenerate (kalau ada)

            const card = document.createElement('div');
            card.className = 'glass-panel rounded-xl overflow-hidden flex flex-col md:flex-row animate-fade-in border border-white/10';
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
                                <p class="text-xs">Klik Generate</p>
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
                        <button id="btn-dl-scene-${index}" class="p-2 rounded-lg bg-black/60 hover:bg-accent text-white backdrop-blur-md border border-white/10 transition-all ${savedImage ? '' : 'hidden'}">
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
            
            // 4. View Fullscreen
            const imgEl = document.getElementById(`img-scene-${index}`);
            if(imgEl) {
                imgEl.addEventListener('click', () => {
                    if(scene.imageUrl) openImageModal(scene.imageUrl); // Pake fungsi modal dari Tab 3 (kalo global) atau buat baru
                });
            }
        });
    }

    // =================================================================
    // C. LOGIC GENERATE IMAGE (THE TRINITY CONSISTENCY)
    // =================================================================
    function generateSceneImage(scene, index) {
        const loader = document.getElementById(`loader-scene-${index}`);
        const imgEl = document.getElementById(`img-scene-${index}`);
        const placeholder = document.getElementById(`placeholder-scene-${index}`);
        const btnDl = document.getElementById(`btn-dl-scene-${index}`);

        if(loader) loader.classList.remove('hidden');

        // 1. CARI REFERENSI KARAKTER (Face Lock)
        let refImage = null;
        
        // Cek karakter mana yang ada di scene ini
        if (scene.characters_in_scene && scene.characters_in_scene.length > 0) {
            // Kita ambil karakter PERTAMA yang muncul di list sebagai referensi utama
            // (Keterbatasan API biasanya cuma support 1 ref image yang kuat)
            const mainCharName = scene.characters_in_scene[0];
            
            // Cek di AppState Tab 3 apakah karakter ini punya gambar?
            // Kita cari yang namanya mengandung string (case insensitive)
            const savedChars = AppState.characters.generatedImages;
            const matchKey = Object.keys(savedChars).find(key => key.toLowerCase().includes(mainCharName.toLowerCase()));
            
            if (matchKey) {
                refImage = savedChars[matchKey];
                console.log(`🔗 Linking character: ${matchKey} to Scene ${scene.id}`);
            }
        }

        // 2. RAKIT PROMPT (Prompt Engineering)
        // Request Lu: "wajah dan tubuh harus sama persis jangan di ubah tapi make bahasa inggris"
        let consistencyPrompt = "";
        if (refImage) {
            consistencyPrompt = "(Same face and body as reference image:1.6), (Consistent character design:1.4), ";
        }

        const finalPrompt = `${consistencyPrompt}${scene.visual_prompt}, ${AppState.style.masterPrompt || "cinematic"}, masterpiece, 8k`;

        // 3. CONFIG
        const options = {
            width: AppState.style.width || 1280,
            height: AppState.style.height || 720,
            model: AppState.style.selectedModel || 'seedream',
            seed: scene.seed || Math.floor(Math.random() * 1000000), // Kunci seed per scene
            refImage: refImage // Kirim URL referensi ke api.js
        };

        // Simpan seed biar kalau dirender ulang hasilnya konsisten (cuma berubah dikit kalau prompt diedit)
        scene.seed = options.seed; 

        // 4. GENERATE URL
        // Tambah negative prompt standar
        let url = generateImageURL(finalPrompt, options);
        url += `&negative_prompt=${encodeURIComponent("text, watermark, blurry, bad anatomy, distorted face, extra limbs")}`;
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

            // Simpan URL ke State
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
    // D. HELPER (Download & Modal - Copy dari Tab 3 biar mandiri)
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

    function openImageModal(url) {
        // Cek apakah modal global udah ada (dari Tab 3)
        let modal = document.getElementById('image-viewer-modal');
        if (!modal) {
            // Kalau belum ada, buat baru (fallback)
            const html = `
            <div id="image-viewer-modal" class="fixed inset-0 z-[130] hidden flex items-center justify-center">
                <div class="absolute inset-0 bg-black/95 backdrop-blur-md" onclick="this.parentElement.classList.add('hidden')"></div>
                <img id="full-image-preview" src="" class="relative max-w-[95%] max-h-[90vh] rounded-lg shadow-2xl">
                <button class="absolute top-4 right-4 text-white" onclick="document.getElementById('image-viewer-modal').classList.add('hidden')"><i class="ph ph-x text-3xl"></i></button>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
            modal = document.getElementById('image-viewer-modal');
        }
        const img = document.getElementById('full-image-preview');
        if(img) img.src = url;
        modal.classList.remove('hidden');
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => window.switchTab(5));
    }
});
