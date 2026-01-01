// js/modules/charModule.js

window.initCharModule = () => {
    console.log("Character Module Loaded");
    renderCharCards();
};

// 1. Render Kartu Karakter (Kosong atau Isi)
window.renderCharCards = () => {
    const chars = window.appState.project.characters;
    const container = document.getElementById('char-grid');
    
    if (!container) return; // Safety check

    if (chars.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-10 opacity-50">
                <i class="ph ph-users-three text-4xl mb-2"></i>
                <p>Belum ada karakter terdeteksi dari Tab 1.</p>
            </div>`;
        return;
    }

    container.innerHTML = chars.map((char, index) => `
        <div class="glass-panel p-3 rounded-xl relative group transition-all hover:border-accent">
            <!-- Image Area -->
            <div class="aspect-[2/3] bg-black/50 rounded-lg overflow-hidden mb-3 relative cursor-pointer" onclick="openCharModal(${index})">
                ${char.img 
                    ? `<img src="${char.img}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">` 
                    : `<div class="flex items-center justify-center h-full text-gray-600"><i class="ph ph-user text-3xl"></i></div>`
                }
                
                <!-- Overlay Actions -->
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <button onclick="generateChar(${index}, event)" class="btn-primary text-xs px-3 py-1">
                        <i class="ph ph-arrows-clockwise"></i> ${char.img ? 'Regenerate' : 'Generate'}
                    </button>
                    <span class="text-[10px] text-gray-400">Seed: ${char.seed || 'Random'}</span>
                </div>
            </div>

            <!-- Info -->
            <h4 class="font-bold text-white text-sm truncate">${char.name}</h4>
            <p class="text-[10px] text-gray-400 line-clamp-2">${char.desc}</p>
        </div>
    `).join('');
};

// 2. Generate Karakter (Logic Konsistensi)
window.generateChar = async (index, event) => {
    if(event) event.stopPropagation(); // Biar gak kebuka modalnya

    const char = window.appState.project.characters[index];
    const style = window.appState.project.style.prompt || "Cinematic, Realistic";
    
    // A. Tentukan Seed (Kalau belum ada, bikin baru. Kalau udah ada, pake yg lama biar konsisten pas diedit dikit)
    const seed = char.seed || Math.floor(Math.random() * 1000000000);
    
    // B. Prompt Engineering (Gabungin Fisik + Style)
    const finalPrompt = `Character Portrait of ${char.name}, ${char.desc}, ${style}, detailed face, 8k resolution, best quality`;

    // C. Update UI jadi Loading
    showToast(`Generating ${char.name}...`, 'info');
    
    // D. Construct URL (Pake Model SEEDREAM sesuai riset lu)
    // Format: https://image.pollinations.ai/prompt/...
    const encodedPrompt = encodeURIComponent(finalPrompt);
    const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1536&seed=${seed}&model=seedream&nologo=true`;

    // E. Simpan Data
    window.appState.project.characters[index].img = url;
    window.appState.project.characters[index].seed = seed; // KUNCI SEED DISINI
    
    // F. Refresh UI (Kasih delay dikit biar gambar ke-load di server sana)
    setTimeout(() => {
        renderCharCards();
        showToast(`${char.name} Generated!`, 'success');
    }, 1000);
};

// 3. Modal Preview (Buat Download & Liat Full)
window.openCharModal = (index) => {
    const char = window.appState.project.characters[index];
    if(!char.img) return;

    // Inject Modal HTML ke body kalau belum ada
    if(!document.getElementById('preview-modal')) {
        const modalHtml = `
            <div id="preview-modal" class="fixed inset-0 z-[200] hidden">
                <div class="absolute inset-0 bg-black/90 backdrop-blur-md" onclick="closePreviewModal()"></div>
                <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl p-4">
                    <img id="modal-img" src="" class="w-full rounded-xl shadow-2xl border border-white/10">
                    <div class="flex justify-center gap-4 mt-4">
                        <a id="btn-download" href="#" download="character.jpg" class="btn-primary flex items-center gap-2">
                            <i class="ph ph-download"></i> Download HD
                        </a>
                        <button onclick="closePreviewModal()" class="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // Set Content
    const modal = document.getElementById('preview-modal');
    const img = document.getElementById('modal-img');
    const btn = document.getElementById('btn-download');

    img.src = char.img;
    
    // Logic Download biar gak kebuka di tab baru doang
    fetch(char.img)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            btn.href = url;
            btn.download = `MrG_${char.name}_${char.seed}.jpg`;
        });

    modal.classList.remove('hidden');
};

window.closePreviewModal = () => {
    document.getElementById('preview-modal').classList.add('hidden');
};
