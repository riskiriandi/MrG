// js/templates.js

const Templates = {
    
    // TAB 1: STORY WRITER
    tab1: `
        <div class="animate-fade-in-up max-w-5xl mx-auto space-y-8">
            <!-- Header Section -->
            <div class="flex justify-between items-end border-b border-white/5 pb-4">
                <div>
                    <h2 class="text-3xl font-display font-bold text-white">Concept & Story</h2>
                    <p class="text-sm text-gray-400 mt-1">Tulis ide kasarmu, biarkan AI merangkai naskahnya.</p>
                </div>
                <div class="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-full border border-white/10">
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mode:</span>
                    <span class="text-xs font-bold text-accent">NARRATIVE V2</span>
                </div>
            </div>

            <!-- Input Area -->
            <div class="glass-panel p-1 rounded-2xl relative group">
                <div class="absolute -inset-0.5 bg-gradient-to-r from-accent to-purple-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                <div class="relative bg-darkbg/80 rounded-xl p-6">
                    <label class="text-xs text-accent font-bold mb-3 block uppercase tracking-widest">
                        <i class="ph ph-brain"></i> Raw Idea Input
                    </label>
                    <textarea id="story-input" 
                        class="w-full h-40 bg-transparent text-gray-200 placeholder-gray-600 focus:outline-none resize-none text-lg leading-relaxed font-light"
                        placeholder="Contoh: Seorang hacker bernama Neo menemukan bahwa dunianya hanyalah simulasi komputer..."></textarea>
                    
                    <div class="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                        <span class="text-[10px] text-gray-500">AI Model: <span class="text-gray-300">OpenAI GPT-4o Compatible</span></span>
                        <button onclick="generateStory()" class="btn-primary flex items-center gap-2">
                            <i class="ph ph-magic-wand"></i>
                            Generate Script
                        </button>
                    </div>
                </div>
            </div>

            <!-- Result Area (Hidden by default) -->
            <div id="story-result" class="hidden space-y-6">
                <div class="flex items-center gap-4">
                    <div class="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                    <span class="text-xs font-bold text-gray-500 uppercase tracking-widest">AI Output</span>
                    <div class="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </div>

                <div class="glass-panel p-8 rounded-2xl border-l-4 border-accent relative overflow-hidden">
                    <!-- Decorative BG -->
                    <i class="ph ph-quotes text-9xl absolute -top-4 -right-4 text-white/5 rotate-12"></i>
                    
                    <div id="final-story-text" class="relative z-10 text-gray-300 leading-loose font-serif text-lg whitespace-pre-wrap"></div>
                </div>
                
                <div class="flex justify-end">
                    <button onclick="switchTab(2)" class="btn-primary bg-white text-black hover:bg-gray-200 border-none">
                        Next: Visual Style <i class="ph ph-arrow-right"></i>
                    </button>
                </div>
            </div>
        </div>
    `,

    // TAB 2: VISUAL STYLE
    tab2: `
        <div class="animate-fade-in-up max-w-6xl mx-auto pb-10">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                <!-- Left Column: Controls -->
                <div class="lg:col-span-4 space-y-6">
                    <div class="glass-panel p-6 rounded-2xl">
                        <h3 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <i class="ph ph-faders text-accent"></i> Configuration
                        </h3>
                        
                        <!-- Aspect Ratio -->
                        <div class="mb-6">
                            <label class="text-[10px] font-bold text-gray-400 uppercase mb-3 block">Aspect Ratio</label>
                            <div class="grid grid-cols-3 gap-2">
                                <button onclick="setRatio('1:1')" class="ratio-btn active p-3 rounded-lg border border-accent bg-accent/10 text-white text-xs font-bold transition-all">1:1</button>
                                <button onclick="setRatio('16:9')" class="ratio-btn p-3 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 text-xs font-bold transition-all">16:9</button>
                                <button onclick="setRatio('9:16')" class="ratio-btn p-3 rounded-lg border border-white/10 hover:bg-white/5 text-gray-400 text-xs font-bold transition-all">9:16</button>
                            </div>
                        </div>

                        <!-- Style Input -->
                        <div>
                            <label class="text-[10px] font-bold text-gray-400 uppercase mb-3 block">Style Prompt</label>
                            <textarea id="style-prompt" rows="4" class="input-neon w-full text-xs" placeholder="Describe the visual style (e.g., Cyberpunk, Ghibli, Noir)..."></textarea>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Preview -->
                <div class="lg:col-span-8">
                    <div class="glass-panel p-1 rounded-2xl h-full min-h-[400px] flex flex-col relative overflow-hidden group">
                        <div class="absolute inset-0 bg-black/40 z-0"></div>
                        
                        <!-- Upload Area -->
                        <div id="style-upload-area" class="relative z-10 flex-grow flex flex-col items-center justify-center border-2 border-dashed border-white/10 m-4 rounded-xl hover:border-accent/50 transition-colors cursor-pointer group-hover:bg-white/5">
                            <div class="text-center p-6">
                                <div class="w-16 h-16 bg-black/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 group-hover:scale-110 transition-transform">
                                    <i class="ph ph-image text-3xl text-gray-400 group-hover:text-accent"></i>
                                </div>
                                <h4 class="text-white font-bold">Upload Reference Image</h4>
                                <p class="text-xs text-gray-500 mt-2">Or drag and drop here to analyze style</p>
                            </div>
                            <input type="file" class="absolute inset-0 opacity-0 cursor-pointer">
                        </div>

                        <!-- Action Bar -->
                        <div class="p-4 border-t border-white/10 relative z-10 bg-black/20 backdrop-blur-sm flex justify-between items-center">
                            <span class="text-xs text-gray-400">AI Vision Model: <span class="text-accent">Active</span></span>
                            <button onclick="switchTab(3)" class="btn-primary py-2 px-6 text-sm">
                                Save Style & Continue
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,

    // Placeholder buat tab lain biar gak error
    tab3: `<div class="text-center py-20"><h2 class="text-2xl text-gray-500">Character Casting Module (Coming Soon)</h2></div>`,
    tab4: `<div class="text-center py-20"><h2 class="text-2xl text-gray-500">Scene Director Module (Coming Soon)</h2></div>`,
    tab5: `<div class="text-center py-20"><h2 class="text-2xl text-gray-500">Video Production Module (Coming Soon)</h2></div>`,
};
