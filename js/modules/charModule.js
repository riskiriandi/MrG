// ============================================================
// MODULE TAB 3: CHARACTER CASTING
// ============================================================

window.initCharModule = () => {
    console.log("Character Module Loaded");
    renderCharCards();
};

// 1. RENDER KARTU KARAKTER
window.renderCharCards = () => {
    const chars = window.appState.project.characters;
    const container = document.getElementById('char-grid');
    
    if (!container) return;

    // State Kosong
    if (chars.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-10 opacity-50 border-2 border-dashed border-white/10 rounded-xl">
                <i class="ph ph-users-three text-4xl mb-2"></i>
                <p>Belum ada karakter terdeteksi.</p>
                <p class="text-xs text-gray-500">Silakan generate cerita dulu di Tab 1.</p>
            </div>`;
        return;
    }

    // Render Loop
    container.innerHTML = chars.map((char, index) => {
        // Logic Dropdown Model (Kita bikin manual biar 'selected'-nya bener)
        const currentModel = char.model || 'seedream';
        const modelOptions = [
            {val: 'seedream', label: 'Seedream (Default)'},
            {val: 'kontext', label: 'Kontext (Artistic)'},
            {val: 'nanobanana', label: 'Nanobanana (Fast)'},
            {val: 'seedream-pro', label: 'Seedream Pro (4K)'},
            {val: 'nanobanana-pro', label: 'Nanobanana Pro'}
        ].map(m => `<option value="${m.val}" ${currentModel === m.val ? 'selected' : ''}>${m.label}</option>`).join('');

        const dropdownHtml = `
            <select id="model-char-${index}" class="bg-black/50 border border-white/10 text-[10px] text-gray-300 rounded px-2 py-1 mb-2 w-full focus:outline-none focus:border-accent cursor-pointer hover:bg-white/5 transition-colors">
                ${modelOptions}
            </select>
        `;

        // KONDISI A: GAMBAR SUDAH ADA (PREVIEW MODE)
        if (char.img) {
            return `
            <div class="glass-panel p-3 rounded-xl relative group transition-all hover:border-accent/50">
                ${dropdownHtml}
                
                <div class="aspect-[2/3] bg-black/50 rounded-lg overflow-hidden mb-3 relative cursor-pointer" onclick="openImageModal(${index})">
                    <img src="${char.img}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">
                    
                    <!-- Hover Overlay -->
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                        <i class="ph ph-arrows-out-simple text-3xl text-white drop-shadow-lg"></i>
                        <span class="text-[10px] text-white font-bold bg-black/50 px-2 py-1 rounded">Click to Preview</span>
                    </div>
                </div>
                
                <div class="flex justify-between items-center">
                    <div>
                        <h4 class="font-bold text-white text-sm truncate w-24" title="${char.name}">${char.name}</h4>
                        <span class="text-[10px] text-gray-500 font-mono">Seed: ${char.seed}</span>
                    </div>
                    <button onclick="resetChar(${index}, event)" class="text-xs text-red-400 hover:text-white flex items-center gap-1 bg-red-500/10 px-2 py-1 rounded hover:bg-red-500 transition-all">
                        <i class="ph ph-arrow-counter-clockwise"></i> Redo
                    </button>
                </div>
            </div>`;
        } 
        
        // KONDISI B: BELUM ADA GAMBAR (EDITOR MODE)
        else {
            return `
            <div class="glass-panel p-4 rounded-xl border border-white/10 flex flex-col h-full hover:border-white/30 transition-colors">
                <div class="flex justify-between items-center mb-2">
                    <h4 class="font-bold text-accent truncate w-32" title="${char.name}">${char.name}</h4>
                    <span class="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">Ready</span>
                </div>
                
                ${dropdownHtml}
                
                <label class="text-[10px] text-gray-400 uppercase mb-1 mt-1">Visual Prompt (English)</label>
                <textarea id="char-prompt-${index}" 
                    class="input-neon w-full h-32 text-xs mb-3 resize-none focus:ring-1 focus:ring-accent leading-relaxed" 
                    placeholder="Describe appearance..."
                    oninput="updateCharDesc(${index}, this.value)">${char.desc}</textarea>
                
                <button onclick="generateChar(${index})" class="btn-primary w-full mt-auto text-xs py-2 flex items-center justify-center gap-2">
                    <i class="ph ph-paint-brush"></i> Generate Visual
                </button>
            </div>`;
        }
    }).join('');
};

// 2. UPDATE DESKRIPSI SAAT NGETIK
window.updateCharDesc = (index, value) => {
    window.appState.project.characters[index].desc = value;
};

// 3. RESET KARAKTER (HAPUS GAMBAR)
window.resetChar = (index, event) => {
    if(event) event.stopPropagation();
    if(confirm("Generate ulang karakter ini? Gambar lama akan dihapus.")) {
        window.appState.project.characters[index].img = null;
        renderCharCards();
    }
};

// 4. GENERATE KARAKTER (CORE LOGIC)
window.generateChar = async (index) => {
    const char = window.appState.project.characters[index];
    const style = window.appState.project.style.prompt || "Cinematic, Realistic, 8k";
    const ratio = window.appState.project.style.ratio || "16:9";
    
    // Ambil Model dari Dropdown
    const dropdown = document.getElementById(`model-char-${index}`);
    const selectedModel = dropdown ? dropdown.value : 'seedream';
    
    // Simpan model ke state
    window.appState.project.characters[index].model = selectedModel;

    // Tentukan Resolusi Berdasarkan Ratio Tab 2
    let width = 1024, height = 1024;
    if (ratio === '16:9') { width = 1280; height = 720; }
    else if (ratio === '9:16') { width = 720; height = 1280; }
    
    // PROMPT FORMULA (Full Body & Plain BG)
    const finalPrompt = `Full body shot of ${char.name}, ${char.desc}, standing pose, neutral plain background, ${style}, masterpiece, best quality, 8k uhd`;

    // Update UI Button
    const btn = document.querySelector(`button[onclick="generateChar(${index})"]`);
    if(btn) {
        btn.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Rendering...`;
        btn.disabled = true;
    }
    showToast(`Casting ${char.name} (${selectedModel})...`, 'info');

    // Construct URL
    const seed = char.seed || Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(finalPrompt);
    
    // URL BARU (gen.pollinations.ai)
    const url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${selectedModel}&nologo=true`;

    // Preload Image
    const img = new Image();
    img.onload = () => {
        window.appState.project.characters[index].img = url;
        window.appState.project.characters[index].seed = seed;
        renderCharCards();
        showToast(`${char.name} Ready!`, 'success');
    };
    img.onerror = () => {
        showToast("Gagal generate. Coba ganti model.", "error");
        if(btn) {
            btn.innerHTML = `<i class="ph ph-warning"></i> Failed`;
            btn.disabled = false;
        }
    };
    img.src = url;
};

// 5. GENERATE ALL (BONUS)
window.generateAllChars = async () => {
    const chars = window.appState.project.characters;
    if(chars.length === 0) return showToast("Tidak ada karakter.", "error");
    
    if(!confirm(`Generate ${chars.length} karakter sekaligus?`)) return;

    // Loop satu-satu biar gak spam server parah
    for (let i = 0; i < chars.length; i++) {
        if (!chars[i].img) { // Cuma generate yang belum ada gambarnya
            await window.generateChar(i);
            // Delay dikit antar request
            await new Promise(r => setTimeout(r, 1000)); 
        }
    }
};

// ============================================================
// MODAL PREVIEW & DOWNLOAD LOGIC
// ============================================================

window.openImageModal = (index) => {
    const char = window.appState.project.characters[index];
    const modal = document.getElementById('image-modal');
    const fullImg = document.getElementById('modal-full-image');
    const seedLabel = document.getElementById('modal-seed');
    const btnDownload = document.getElementById('btn-download-hd');

    if(!modal || !fullImg) return console.error("Modal HTML not found in index.html");

    // Set Content
    fullImg.src = char.img;
    seedLabel.innerText = char.seed || "Random";
    
    // Buka Modal
    modal.classList.remove('hidden');
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0', 'pointer-events-none');
    });

    // Logic Download
    btnDownload.onclick = async () => {
        btnDownload.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Downloading...`;
        
        try {
            const response = await fetch(char.img);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            // Nama File Bersih: MrG_Nama_Seed.jpg
            const cleanName = char.name.replace(/[^a-zA-Z0-9]/g, '_');
            a.download = `MrG_${cleanName}_${char.seed}.jpg`;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            btnDownload.innerHTML = `<i class="ph ph-check"></i> Saved!`;
            setTimeout(() => {
                btnDownload.innerHTML = `<i class="ph ph-download-simple text-lg"></i> <span>Download HD</span>`;
            }, 2000);
        } catch (e) {
            showToast("Gagal download: " + e.message, "error");
            btnDownload.innerHTML = "Error";
        }
    };
};

window.closeImageModal = () => {
    const modal = document.getElementById('image-modal');
    if(!modal) return;
    
    modal.classList.add('opacity-0', 'pointer-events-none');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
};
