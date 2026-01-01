// js/modules/charModule.js

window.initCharModule = () => {
    renderCharCards();
};

window.renderCharCards = () => {
    const chars = window.appState.project.characters;
    const container = document.getElementById('char-grid');
    
    if (!container) return;

    if (chars.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center py-10 opacity-50">Belum ada karakter. Generate di Tab 1 dulu.</div>`;
        return;
    }

    container.innerHTML = chars.map((char, index) => {
        // Kalau gambar udah ada, tampilin gambar. Kalau belum, tampilin EDITOR.
        if (char.img) {
            return `
            <div class="glass-panel p-3 rounded-xl relative group">
                <div class="aspect-[2/3] bg-black/50 rounded-lg overflow-hidden mb-3 relative cursor-pointer" onclick="openCharModal(${index})">
                    <img src="${char.img}" class="w-full h-full object-cover">
                    <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <button onclick="resetChar(${index}, event)" class="btn-primary text-xs px-3 py-1 bg-red-500 border-red-500">
                            <i class="ph ph-pencil"></i> Edit Prompt
                        </button>
                    </div>
                </div>
                <h4 class="font-bold text-white text-sm text-center">${char.name}</h4>
            </div>`;
        } else {
            // MODE EDITOR (Belum di-generate)
            return `
            <div class="glass-panel p-4 rounded-xl border border-white/10 flex flex-col h-full">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold text-accent">${char.name}</h4>
                    <span class="text-[10px] text-gray-500">Ready to Cast</span>
                </div>
                
                <label class="text-[10px] text-gray-400 uppercase mb-1">Visual Prompt (English)</label>
                <textarea id="char-prompt-${index}" class="input-neon w-full h-32 text-xs mb-3 resize-none" oninput="updateCharDesc(${index}, this.value)">${char.desc}</textarea>
                
                <button onclick="generateChar(${index})" class="btn-primary w-full mt-auto text-xs py-2">
                    <i class="ph ph-paint-brush"></i> Generate Visual
                </button>
            </div>`;
        }
    }).join('');
};

// Update deskripsi saat user ngetik manual
window.updateCharDesc = (index, value) => {
    window.appState.project.characters[index].desc = value;
};

// Reset biar bisa edit lagi
window.resetChar = (index, event) => {
    if(event) event.stopPropagation();
    window.appState.project.characters[index].img = null;
    renderCharCards();
};

window.generateChar = async (index) => {
    const char = window.appState.project.characters[index];
    const style = window.appState.project.style.prompt || "Cinematic";
    
    // === PROMPT FORMULA (FULL BODY & PLAIN BG) ===
    // Kita gabungin deskripsi user + style + pose wajib
    const finalPrompt = `Full body shot of ${char.name}, ${char.desc}, standing pose, neutral plain background, ${style}, 8k resolution, best quality`;

    showToast(`Casting ${char.name}...`, 'info');
    
    // Update UI jadi loading
    const btn = document.querySelector(`button[onclick="generateChar(${index})"]`);
    if(btn) {
        btn.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Rendering...`;
        btn.disabled = true;
    }

    const seed = char.seed || Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(finalPrompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1536&seed=${seed}&model=seedream&nologo=true`;

    // Pre-load image biar gak flicker
    const img = new Image();
    img.onload = () => {
        window.appState.project.characters[index].img = url;
        window.appState.project.characters[index].seed = seed;
        renderCharCards();
        showToast(`${char.name} Ready!`, 'success');
    };
    img.src = url;
};

// ... (Fungsi Modal Preview sama kayak sebelumnya) ...
