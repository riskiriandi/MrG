else {
            return `
            <div class="glass-panel p-4 rounded-xl border border-white/10 flex flex-col h-full hover:border-white/30 transition-colors animate-fade-in-up">
                <div class="flex justify-between items-center mb-2 border-b border-white/5 pb-2">
                    <h4 class="font-bold text-accent truncate w-32" title="${char.name}">${char.name}</h4>
                    <span class="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded border border-white/5">Ready</span>
                </div>
                
                ${dropdownHtml}
                
                <label class="text-[10px] text-gray-400 uppercase mb-1 mt-1 ml-1">Visual Prompt (English)</label>
                <textarea id="char-prompt-${index}" 
                    class="input-neon w-full h-32 text-xs mb-3 resize-none focus:ring-1 focus:ring-accent leading-relaxed bg-black/30" 
                    placeholder="Describe appearance..."
                    oninput="updateCharDesc(${index}, this.value)">${char.desc}</textarea>
                
                <button onclick="generateChar(${index})" class="btn-primary w-full mt-auto text-xs py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-accent/20">
                    <i class="ph ph-paint-brush"></i> Generate Visual
                </button>
            </div>`;
        }
    }).join('');
};

// 3. UPDATE DESKRIPSI SAAT NGETIK
window.updateCharDesc = (index, value) => {
    window.appState.project.characters[index].desc = value;
};

// 4. RESET KARAKTER (HAPUS GAMBAR)
window.resetChar = (index, event) => {
    if(event) event.stopPropagation();
    if(confirm("Generate ulang karakter ini? Gambar lama akan dihapus.")) {
        window.appState.project.characters[index].img = null;
        renderCharCards();
    }
};

// 5. GENERATE KARAKTER (CORE LOGIC)
window.generateChar = async (index) => {
    const char = window.appState.project.characters[index];
    const style = window.appState.project.style.prompt || "Cinematic, Realistic, 8k";
    const ratio = window.appState.project.style.ratio || "16:9";
    
    // Ambil Model dari Dropdown
    const dropdown = document.getElementById(`model-char-${index}`);
    const selectedModel = dropdown ? dropdown.value : 'seedream';
    
