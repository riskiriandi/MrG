// ============================================================
// MODULE TAB 3: CHARACTER CASTING (STYLE INTEGRATED)
// ============================================================

// 1. INISIALISASI
window.initCharModule = () => {
    console.log("Character Module Loaded");
    renderCharCards();
};

// 2. RENDER KARTU KARAKTER
window.renderCharCards = () => {
    const chars = window.appState.project.characters;
    const container = document.getElementById('char-grid');
    
    if (!container) return;

    // State Kosong
    if (chars.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-10 opacity-50 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                <i class="ph ph-users-three text-4xl mb-2 text-gray-400"></i>
                <p class="text-gray-300 font-bold">Belum ada karakter.</p>
                <p class="text-xs text-gray-500 mt-1">Generate cerita dulu di Tab 1.</p>
            </div>`;
        return;
    }

    // Render Loop
    container.innerHTML = chars.map((char, index) => {
        const currentModel = char.model || 'seedream';
        
        // List Model (VIP)
        const modelOptions = [
            {val: 'seedream', label: 'Seedream (Best Quality)'},
            {val: 'nanobanana', label: 'Nanobanana (Fast)'},
            {val: 'kontext', label: 'Kontext (Artistic)'},
            {val: 'flux', label: 'Flux (Stable)'},
            {val: 'seedream-pro', label: 'Seedream Pro (4K)'},
            {val: 'nanobanana-pro', label: 'Nanobanana Pro'}
        ].map(m => `<option value="${m.val}" ${currentModel === m.val ? 'selected' : ''}>${m.label}</option>`).join('');

        const dropdownHtml = `
            <div class="mb-2 relative z-30">
                <label class="text-[10px] text-gray-500 uppercase font-bold ml-1">AI Model</label>
                <select id="model-char-${index}" class="bg-black/50 border border-white/10 text-[10px] text-gray-300 rounded px-2 py-1.5 w-full focus:outline-none focus:border-accent cursor-pointer hover:bg-white/5 transition-colors">
                    ${modelOptions}
                </select>
            </div>
        `;

        // KONDISI A: GAMBAR SUDAH ADA
        if (char.img) {
            return `
            <div class="glass-panel p-3 rounded-xl relative group transition-all hover:border-accent/50 animate-fade-in-up">
                ${dropdownHtml}
                
                <div class="aspect-[2/3] bg-black/50 rounded-lg overflow-hidden mb-3 relative cursor-pointer border border-white/5 z-10" onclick="openImageModal(${index})">
                    <img src="${char.img}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onerror="this.src='https://placehold.co/400x600?text=Error+Loading'">
                    
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm pointer-events-none">
                        <i class="ph ph-arrows-out-simple text-3xl text-white drop-shadow-lg"></i>
                        <span class="text-[10px] text-white font-bold bg-black/50 px-2 py-1 rounded border border-white/20">Preview HD</span>
                    </div>
                </div>
                
                <div class="flex justify-between items-center pt-2 border-t border-white/5 relative z-20">
                    <h4 class="font-bold text-white text-sm truncate w-24" title="${char.name}">${char.name}</h4>
                    <button onclick="resetChar(${index}, event)" class="text-xs text-red-400 hover:text-white flex items-center gap-1 bg-red-500/10 px-2 py-1.5 rounded hover:bg-red-500 transition-all">
                        <i class="ph ph-arrow-counter-clockwise"></i> Redo
                    </button>
                </div>
            </div>`;
        } 
        
        // KONDISI B: EDITOR MODE
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
                    oninput="updateCharDesc(${index}, this.value)">${char.desc}</textarea>
                
                <button onclick="generateChar(${index})" class="btn-primary w-full mt-auto text-xs py-2.5 flex items-center justify-center gap-2 shadow-lg shadow-accent/20">
                    <i class="ph ph-paint-brush"></i> Generate Visual
                </button>
            </div>`;
        }
    }).join('');
};

// 3. UPDATE DESKRIPSI
window.updateCharDesc = (index, value) => {
    window.appState.project.characters[index].desc = value;
};

// 4. RESET KARAKTER
window.resetChar = (index, event) => {
    if(event) event.stopPropagation();
    if(confirm("Generate ulang? Gambar lama akan dihapus.")) {
        window.appState.project.characters[index].img = null;
        renderCharCards();
    }
};

// 5. GENERATE KARAKTER (CORE LOGIC - STYLE INTEGRATED)
window.generateChar = async (index) => {
    const char = window.appState.project.characters[index];
    
    // === A. AMBIL STYLE DARI TAB 2 ===
    let stylePrompt = window.appState.project.style.prompt;
    // Fallback kalau Tab 2 kosong
    if (!stylePrompt || stylePrompt.length < 5) {
        console.warn("Style Tab 2 kosong, pakai default.");
        stylePrompt = "Cinematic 3D Render, High Quality, Detailed Texture, 8k, Octane Render";
    }

    // === B. AMBIL RATIO DARI TAB 2 ===
    const ratio = window.appState.project.style.ratio || "16:9";
    
    // === C. AMBIL MODEL DARI DROPDOWN ===
    const dropdown = document.getElementById(`model-char-${index}`);
    const selectedModel = dropdown ? dropdown.value : 'seedream';
    window.appState.project.characters[index].model = selectedModel;

    // === D. HITUNG RESOLUSI ===
    let width = 1024, height = 1024;
    if (ratio === '16:9') { width = 1280; height = 720; }
    else if (ratio === '9:16') { width = 720; height = 1280; }
    
    // === E. RUMUS PROMPT FINAL (GABUNGAN) ===
    // Format: [Fisik Tab 1] + [Pose Wajib] + [Style Tab 2]
    const finalPrompt = `(${char.desc}), full body shot, standing pose, neutral background, ${stylePrompt}`;

    console.log("🚀 GENERATING WITH PROMPT:", finalPrompt);

    // UI Loading
    const btn = document.querySelector(`button[onclick="generateChar(${index})"]`);
    if(btn) {
        btn.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Rendering...`;
        btn.disabled = true;
    }
    showToast(`Requesting ${selectedModel}...`, 'info');

    const seed = char.seed || Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(finalPrompt);
    
    // === F. URL CONSTRUCTION (VIP) ===
    let url = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&seed=${seed}&model=${selectedModel}&nologo=true`;
    
    // Append API Key
    const apiKey = window.appState.config.pollinationsKey;
    if(apiKey) {
        url += `&key=${apiKey}`;
    } else {
        console.warn("⚠️ No API Key found!");
        showToast("Warning: API Key kosong.", "warning");
    }

    // === G. FETCH & HANDLE ERROR ===
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }

        // Sukses
        window.appState.project.characters[index].img = response.url;
        window.appState.project.characters[index].seed = seed;
        renderCharCards();
        showToast("Berhasil!", "success");

    } catch (error) {
        console.error(error);
        showToast("Gagal: " + error.message, "error");
        if(btn) {
            btn.innerHTML = `<i class="ph ph-warning"></i> Failed`;
            btn.disabled = false;
        }
    }
};

// 6. GENERATE ALL
window.generateAllChars = async () => {
    const chars = window.appState.project.characters;
    if(chars.length === 0) return showToast("Tidak ada karakter.", "error");
    
    if(!confirm(`Generate ${chars.length} karakter sekaligus?`)) return;

    for (let i = 0; i < chars.length; i++) {
        if (!chars[i].img) {
            await window.generateChar(i);
            await new Promise(r => setTimeout(r, 1000)); 
        }
    }
};

// ============================================================
// MODAL PREVIEW & DOWNLOAD
// ============================================================

window.openImageModal = (index) => {
    const char = window.appState.project.characters[index];
    const modal = document.getElementById('image-modal');
    const fullImg = document.getElementById('modal-full-image');
    const seedLabel = document.getElementById('modal-seed');
    const btnDownload = document.getElementById('btn-download-hd');

    if(!modal || !fullImg) return console.error("Modal HTML missing!");

    fullImg.src = char.img;
    seedLabel.innerText = char.seed || "Random";
    
    modal.classList.remove('hidden');
    requestAnimationFrame(() => modal.classList.remove('opacity-0', 'pointer-events-none'));

    btnDownload.onclick = async () => {
        btnDownload.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Downloading...`;
        try {
            const response = await fetch(char.img);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const cleanName = char.name.replace(/[^a-zA-Z0-9]/g, '_');
            a.download = `MrG_${cleanName}_${char.seed}.jpg`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            btnDownload.innerHTML = `<i class="ph ph-check"></i> Saved!`;
            setTimeout(() => btnDownload.innerHTML = `<i class="ph ph-download-simple text-lg"></i> <span>Download HD</span>`, 2000);
        } catch (e) {
            showToast("Gagal download.", "error");
            btnDownload.innerHTML = "Error";
        }
    };
};

window.closeImageModal = () => {
    const modal = document.getElementById('image-modal');
    if(modal) {
        modal.classList.add('opacity-0', 'pointer-events-none');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
};
