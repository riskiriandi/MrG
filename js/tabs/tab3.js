/**
 * js/tabs/tab3.js
 * Logika Tab 3: Character Casting.
 * VERSI FULL: Menyimpan Seed, Prompt 3D Pixar, dan Semua Fitur UI (Modal/Download).
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. AMBIL ELEMENT DOM
    const charGrid = document.getElementById('char-grid');
    const btnGenAll = document.getElementById('btn-generate-all-chars');
    const btnNext = document.getElementById('btn-next-to-scenes');
    const tab3Btn = document.querySelector('button[data-tab="3"]');

    // Inject Modal Editor & Preview ke Body
    createImageModal();
    createPromptEditorModal();

    // Listener Refresh Data
    if (tab3Btn) tab3Btn.addEventListener('click', loadCharacters);
    
    // Load awal
    loadCharacters();

    // =================================================================
    // A. FUNGSI UTAMA: LOAD KARAKTER
    // =================================================================
    function loadCharacters() {
        const chars = AppState.story.characters;
        
        if (!chars || chars.length === 0) {
            charGrid.innerHTML = `
                <div class="col-span-full text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-xl">
                    <i class="ph ph-users text-4xl mb-2 opacity-50"></i>
                    <p>Belum ada data karakter.</p>
                </div>`;
            if(btnGenAll) btnGenAll.classList.add('hidden');
            return;
        }

        if(btnGenAll) btnGenAll.classList.remove('hidden');
        charGrid.innerHTML = ''; 
        
        chars.forEach((char, index) => {
            const savedImage = AppState.characters.generatedImages[char.name];
            
            const card = document.createElement('div');
            card.className = 'glass-panel rounded-xl overflow-hidden flex flex-col relative group animate-fade-in';
            card.style.animationDelay = `${index * 100}ms`;

            card.innerHTML = `
                <!-- HEADER -->
                <div class="p-3 border-b border-white/10 flex justify-between items-center bg-black/40">
                    <h3 class="font-bold text-white text-sm truncate w-2/3">${char.name}</h3>
                    <button id="btn-edit-${index}" class="text-[10px] bg-white/10 hover:bg-accent hover:text-white px-2 py-1 rounded transition-colors flex items-center gap-1">
                        <i class="ph ph-pencil-simple"></i> Edit
                    </button>
                </div>

                <!-- IMAGE AREA -->
                <div class="relative aspect-[2/3] bg-black/50 flex items-center justify-center overflow-hidden group/img">
                    ${savedImage 
                        ? `<img src="${savedImage}" class="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105 cursor-pointer" id="img-${index}">`
                        : `<div id="placeholder-${index}" class="text-center p-4">
                                <i class="ph ph-user text-4xl text-gray-600 mb-2"></i>
                                <p class="text-[10px] text-gray-500">Siap Digenerate</p>
                           </div>
                           <img id="img-${index}" class="hidden w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105 cursor-pointer">`
                    }
                    
                    <!-- OVERLAY BUTTONS -->
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-sm">
                        <button id="btn-view-${index}" class="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-md transition-transform hover:scale-110" title="Lihat Fullscreen">
                            <i class="ph ph-eye text-xl"></i>
                        </button>
                        <button id="btn-download-${index}" class="p-3 rounded-full bg-white/10 hover:bg-accent text-white border border-white/20 backdrop-blur-md transition-transform hover:scale-110" title="Download HD">
                            <i class="ph ph-download-simple text-xl"></i>
                        </button>
                    </div>

                    <!-- Loading Overlay -->
                    <div id="loader-${index}" class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center hidden z-30">
                        <i class="ph ph-spinner animate-spin text-accent text-2xl mb-2"></i>
                        <span class="text-[10px] text-gray-300">Generating...</span>
                    </div>
                </div>

                <!-- FOOTER ACTIONS -->
                <div class="p-3 border-t border-white/10 mt-auto bg-black/20">
                    <button id="btn-gen-${index}" class="w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${savedImage ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'btn-neon'}">
                        ${savedImage ? '<i class="ph ph-arrows-clockwise"></i> Regenerate' : '<i class="ph ph-lightning"></i> Generate'}
                    </button>
                </div>
            `;

            charGrid.appendChild(card);

            // EVENT LISTENERS
            document.getElementById(`btn-edit-${index}`).addEventListener('click', () => {
                openPromptEditor(char, index);
            });

            document.getElementById(`btn-gen-${index}`).addEventListener('click', () => {
                const currentPrompt = char.customPrompt || constructDefaultPrompt(char);
                generateSingleChar(char.name, currentPrompt, index);
            });

            document.getElementById(`btn-view-${index}`).addEventListener('click', () => {
                const url = AppState.characters.generatedImages[char.name];
                if(url) openImageModal(url);
            });

            document.getElementById(`btn-download-${index}`).addEventListener('click', () => {
                const url = AppState.characters.generatedImages[char.name];
                if(url) downloadImage(url, `MrG_${char.name}.jpg`);
            });
        });
    }

    // =================================================================
    // B. LOGIC PROMPT & GENERATE
    // =================================================================
    
    function constructDefaultPrompt(char) {
        // RUMUS BARU: 3D PIXAR STYLE (Bersih, Tegak, Cute)
        return `(3D Render:1.5), (Disney Pixar Style:1.4), (Full Body Shot), (Standing Straight), (Front View), (Cute and Expressive), (Simple Soft Gradient Background), ${char.visual_desc}, octane render, 8k, masterpiece`;
    }

    async function generateSingleChar(charName, prompt, index) {
        const imgEl = document.getElementById(`img-${index}`);
        const placeholderEl = document.getElementById(`placeholder-${index}`);
        const loaderEl = document.getElementById(`loader-${index}`);
        const btnEl = document.getElementById(`btn-gen-${index}`);

        if(loaderEl) loaderEl.classList.remove('hidden');
        if(btnEl) btnEl.disabled = true;

        // 1. GENERATE SEED DI SINI (PENTING!)
        // Kita simpan seed ini biar bisa dipake di Tab 4
        const charSeed = Math.floor(Math.random() * 1000000000);

        const options = {
            width: 768,  
            height: 1024,
            model: AppState.style.selectedModel || 'seedream',
            seed: charSeed 
        };

        // Negative Prompt biar gak aneh-aneh
        const negative = "text, watermark, low quality, blurry, complex background, scenery, furniture, multiple views, cropped, out of frame, sketch, 2d";
        
        let imageUrl = generateImageURL(prompt, options);
        imageUrl += `&negative_prompt=${encodeURIComponent(negative)}`;
        imageUrl += `&t=${Date.now()}`; // Anti-cache

        const tempImg = new Image();
        tempImg.onload = () => {
            if(loaderEl) loaderEl.classList.add('hidden');
            if(placeholderEl) placeholderEl.classList.add('hidden');
            imgEl.classList.remove('hidden');
            imgEl.src = imageUrl;
            
            if(btnEl) {
                btnEl.disabled = false;
                btnEl.innerHTML = '<i class="ph ph-arrows-clockwise"></i> Regenerate';
                btnEl.classList.remove('btn-neon');
                btnEl.classList.add('bg-white/5', 'hover:bg-white/10', 'text-gray-300');
            }

            // 2. SIMPAN URL & SEED KE STATE
            AppState.characters.generatedImages[charName] = imageUrl;
            
            // Pastikan object seeds ada
            if (!AppState.characters.seeds) AppState.characters.seeds = {};
            AppState.characters.seeds[charName] = charSeed; // <--- INI KUNCINYA

            console.log(`✅ Saved Seed for ${charName}: ${charSeed}`);
            saveProject();
        };
        
        tempImg.onerror = () => {
            if(loaderEl) loaderEl.classList.add('hidden');
            alert("Gagal generate. Coba lagi.");
            if(btnEl) btnEl.disabled = false;
        };

        tempImg.src = imageUrl;
    }

    // =================================================================
    // C. MODAL EDITOR PROMPT (FULL CODE)
    // =================================================================
    function createPromptEditorModal() {
        if (document.getElementById('prompt-editor-modal')) return;

        const html = `
        <div id="prompt-editor-modal" class="fixed inset-0 z-[120] hidden">
            <div class="absolute inset-0 bg-black/90 backdrop-blur-sm" id="editor-backdrop"></div>
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg glass-panel rounded-2xl p-6 shadow-2xl">
                <h3 class="text-lg font-bold text-white mb-1">Edit Prompt Karakter</h3>
                <p class="text-xs text-gray-400 mb-4">Sesuaikan deskripsi jika hasil kurang pas.</p>
                
                <textarea id="editor-textarea" rows="6" class="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-xs text-gray-200 focus:border-accent focus:outline-none mb-4"></textarea>
                
                <div class="flex justify-end gap-2">
                    <button id="btn-cancel-editor" class="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white">Batal</button>
                    <button id="btn-save-generate" class="px-4 py-2 rounded-lg btn-neon text-xs font-bold flex items-center gap-2">
                        <i class="ph ph-lightning"></i> Simpan & Generate
                    </button>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);

        const close = () => document.getElementById('prompt-editor-modal').classList.add('hidden');
        document.getElementById('editor-backdrop').onclick = close;
        document.getElementById('btn-cancel-editor').onclick = close;
    }

    function openPromptEditor(char, index) {
        const modal = document.getElementById('prompt-editor-modal');
        const textarea = document.getElementById('editor-textarea');
        const btnSave = document.getElementById('btn-save-generate');

        textarea.value = char.customPrompt || constructDefaultPrompt(char);
        
        modal.classList.remove('hidden');

        btnSave.onclick = () => {
            char.customPrompt = textarea.value; 
            generateSingleChar(char.name, char.customPrompt, index);
            modal.classList.add('hidden');
        };
    }

    // =================================================================
    // D. MODAL FULLSCREEN IMAGE (FULL CODE)
    // =================================================================
    function createImageModal() {
        if (document.getElementById('image-viewer-modal')) return;
        const html = `
        <div id="image-viewer-modal" class="fixed inset-0 z-[130] hidden flex items-center justify-center">
            <div class="absolute inset-0 bg-black/95 backdrop-blur-md" onclick="this.parentElement.classList.add('hidden')"></div>
            <img id="full-image-preview" src="" class="relative max-w-[95%] max-h-[90vh] rounded-lg shadow-2xl border border-white/10">
            <button class="absolute top-4 right-4 text-white/50 hover:text-white" onclick="document.getElementById('image-viewer-modal').classList.add('hidden')">
                <i class="ph ph-x text-3xl"></i>
            </button>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    function openImageModal(url) {
        const modal = document.getElementById('image-viewer-modal');
        const img = document.getElementById('full-image-preview');
        img.src = url;
        modal.classList.remove('hidden');
    }

    // =================================================================
    // E. HELPER DOWNLOAD (FULL CODE)
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
            window.URL.revokeObjectURL(blobUrl);
        } catch (e) {
            console.error(e);
            window.open(url, '_blank');
        }
    }

    // =================================================================
    // F. GENERATE ALL & NEXT
    // =================================================================
    if (btnGenAll) {
        btnGenAll.addEventListener('click', () => {
            const chars = AppState.story.characters;
            if (!chars || chars.length === 0) return;
            if(!confirm(`Generate ${chars.length} karakter sekaligus?`)) return;

            chars.forEach((char, index) => {
                setTimeout(() => {
                    const prompt = char.customPrompt || constructDefaultPrompt(char);
                    generateSingleChar(char.name, prompt, index);
                }, index * 1000);
            });
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => window.switchTab(4));
    }
});
