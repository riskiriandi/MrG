const Templates = {
    
    // =============================================
    // TAB 1: STORY (CERITA & KONSEP)
    // =============================================
    tab1: `
        <div class="animate-fade-in-up max-w-5xl mx-auto space-y-6">
            <!-- Header -->
            <div class="flex justify-between items-end border-b border-white/5 pb-4">
                <div>
                    <h2 class="text-2xl font-display font-bold text-white">Story Concept</h2>
                    <p class="text-xs text-gray-400">AI akan mengubah ide kasar menjadi naskah terstruktur.</p>
                </div>
                
                <!-- Toggle Dialog Mode -->
                <div class="flex items-center gap-3 bg-black/30 px-3 py-2 rounded-lg border border-white/10">
                    <span class="text-[10px] font-bold text-gray-400 uppercase">Dialog Mode</span>
                    <button id="toggle-dialog" onclick="toggleDialogMode()" class="w-10 h-5 rounded-full bg-gray-600 relative transition-colors duration-300">
                        <div id="toggle-circle" class="w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 left-0.5 transition-transform duration-300"></div>
                    </button>
                    <span id="dialog-status" class="text-[10px] font-bold text-gray-500">OFF</span>
                </div>
            </div>

            <!-- Input Area -->
            <div class="glass-panel p-6 rounded-2xl">
                <label class="text-xs text-accent font-bold mb-2 block uppercase tracking-widest">IDE CERITA / SINOPSIS KASAR:</label>
                <textarea id="story-input" 
                    class="w-full h-32 bg-black/20 border border-white/10 rounded-xl p-4 text-gray-200 focus:border-accent focus:outline-none resize-none text-sm"
                    placeholder="Contoh: 3 sekawan humanoid kucing mendaki gunung merapi..."></textarea>
                
                <div class="flex justify-end mt-4">
                    <button onclick="generateStory()" class="btn-primary flex items-center gap-2 text-sm">
                        <i class="ph ph-magic-wand"></i> Generate Naskah
                    </button>
                </div>
            </div>

            <!-- Result Area -->
            <div id="story-result" class="hidden space-y-6">
                <div class="glass-panel p-6 rounded-2xl border-l-4 border-accent">
                    <h3 class="text-sm font-bold text-white mb-2 uppercase">Master Script</h3>
                    <div id="final-story-text" class="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-mono bg-black/30 p-4 rounded-lg"></div>
                </div>
                
                <!-- List Karakter Terdeteksi -->
                <div class="glass-panel p-4 rounded-2xl">
                    <h3 class="text-xs font-bold text-gray-400 mb-3 uppercase flex items-center gap-2">
                        <i class="ph ph-users"></i> Karakter Terdeteksi (Auto-Extracted)
                    </h3>
                    <div id="extracted-chars-list" class="flex flex-wrap gap-2">
                        <!-- Badge Karakter bakal muncul disini -->
                    </div>
                </div>

                <div class="flex justify-end pt-4">
                    <button onclick="switchTab(2)" class="btn-primary bg-white text-black hover:bg-gray-200 border-none">
                        Lanjut ke Style <i class="ph ph-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `,

    // =============================================
    // TAB 2: STYLE (VISUAL & UPLOAD)
    // =============================================
    tab2: `
        <div class="animate-fade-in-up max-w-6xl mx-auto pb-10">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <!-- Kiri: Upload & Preview -->
                <div class="lg:col-span-5 space-y-4">
                    <div class="glass-panel p-1 rounded-2xl relative overflow-hidden group">
                        <div id="upload-area" class="relative z-10 h-64 flex flex-col items-center justify-center border-2 border-dashed border-white/10 m-2 rounded-xl hover:border-accent/50 transition-colors cursor-pointer bg-black/20">
                            
                            <!-- Default State -->
                            <div id="upload-placeholder" class="text-center p-6">
                                <i class="ph ph-upload-simple text-3xl text-gray-500 mb-2"></i>
                                <p class="text-xs text-gray-400">Upload Referensi Gambar</p>
                            </div>

                            <!-- Preview State -->
                            <img id="style-preview-img" class="absolute inset-0 w-full h-full object-cover hidden rounded-xl">
                            
                            <input type="file" id="style-file-input" accept="image/*" class="absolute inset-0 opacity-0 cursor-pointer" onchange="handleStyleUpload(this)">
                        </div>
                    </div>

                    <!-- Input URL Manual -->
                    <div class="flex gap-2">
                        <input type="text" id="style-url-input" placeholder="Atau paste link gambar..." class="input-neon w-full text-xs">
                        <button onclick="handleStyleUrl()" class="btn-primary px-3"><i class="ph ph-arrow-right"></i></button>
                    </div>
                    
                    <p id="upload-status" class="text-center text-[10px] text-gray-500 h-4"></p>
                </div>

                <!-- Kanan: Config -->
                <div class="lg:col-span-7 space-y-6">
                    <div class="glass-panel p-6 rounded-2xl">
                        <h3 class="text-sm font-bold text-white mb-4">Visual Configuration</h3>
                        
                        <!-- Ratio -->
                        <div class="mb-6">
                            <label class="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Aspect Ratio</label>
                            <div class="grid grid-cols-3 gap-2">
                                <button onclick="setRatio('1:1')" id="ratio-1-1" class="ratio-btn active p-2 rounded border border-accent bg-accent/10 text-white text-xs font-bold">1:1 (Square)</button>
                                <button onclick="setRatio('16:9')" id="ratio-16-9" class="ratio-btn p-2 rounded border border-white/10 text-gray-400 text-xs font-bold">16:9 (Cinema)</button>
                                <button onclick="setRatio('9:16')" id="ratio-9-16" class="ratio-btn p-2 rounded border border-white/10 text-gray-400 text-xs font-bold">9:16 (Mobile)</button>
                            </div>
                        </div>

                        <!-- Prompt -->
                        <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase mb-2 block">Master Style Prompt</label>
                            <textarea id="style-prompt" rows="4" class="input-neon w-full text-xs leading-relaxed" placeholder="Deskripsi style akan muncul otomatis disini setelah upload gambar..."></textarea>
                        </div>
                    </div>

                    <div class="flex justify-end">
                        <button onclick="switchTab(3)" class="btn-primary">
                            Simpan & Lanjut Karakter <i class="ph ph-arrow-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,

    // =============================================
    // TAB 3: CHARACTERS (CASTING)
    // =============================================
    tab3: `
        <div class="animate-fade-in-up max-w-6xl mx-auto pb-20">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-white">Character Casting</h2>
                <button onclick="generateAllChars()" class="btn-primary text-xs px-4 py-2">
                    <i class="ph ph-lightning"></i> Generate All
                </button>
            </div>
            
            <!-- Grid Container -->
            <div id="char-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"></div>

            <div class="flex justify-end pt-8">
                <button onclick="switchTab(4)" class="btn-primary bg-white text-black hover:bg-gray-200 border-none">
                    Lanjut ke Scenes <i class="ph ph-arrow-right"></i>
                </button>
            </div>
        </div>
    `,

    // =============================================
    // TAB 4: SCENES (STORYBOARD)
    // =============================================
    tab4: `
        <div class="animate-fade-in-up max-w-6xl mx-auto pb-20">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-white">Storyboard Director</h2>
                <button onclick="generateAllScenes()" class="btn-primary text-xs px-4 py-2">
                    <i class="ph ph-film-strip"></i> Render All Scenes
                </button>
            </div>

            <!-- Grid Container -->
            <div id="scenes-container" class="grid grid-cols-1 md:grid-cols-2 gap-6"></div>

            <div class="flex justify-end pt-8">
                <button onclick="switchTab(5)" class="btn-primary bg-white text-black hover:bg-gray-200 border-none">
                    Lanjut ke Video <i class="ph ph-arrow-right"></i>
                </button>
            </div>
        </div>
    `,

    // =============================================
    // TAB 5: VIDEO (PROMPTS)
    // =============================================
    tab5: `
        <div class="animate-fade-in-up max-w-4xl mx-auto pb-20">
            <h2 class="text-xl font-bold text-white mb-6">Video Production Prompts</h2>
            <div id="video-list" class="space-y-4"></div>
        </div>
    `
};
