// js/main.js (SAFETY VERSION)

document.addEventListener('DOMContentLoaded', () => {
    console.log("MrG Engine v2.0 Started...");
    try {
        switchTab(1);
        if(window.appState && window.appState.config) {
            const savedKey = window.appState.config.pollinationsKey;
            if(savedKey) console.log("API Key loaded.");
        }
    } catch (e) {
        document.body.innerHTML = `<div style="color:red; padding:20px; text-align:center;">CRITICAL ERROR: ${e.message}</div>`;
    }
});

window.switchTab = (tabIndex) => {
    // Update Nav
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        const icon = btn.querySelector('i');
        if(icon) icon.classList.remove('text-accent');
    });

    const activeBtn = document.getElementById(`btn-tab-${tabIndex}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        const icon = activeBtn.querySelector('i');
        if(icon) icon.classList.add('text-accent');
    }

    // Render Content
    const contentContainer = document.getElementById('app-content');
    if(!contentContainer) return;

    contentContainer.style.opacity = '0';
    contentContainer.style.transform = 'translateY(10px)';

    setTimeout(() => {
        const templateKey = `tab${tabIndex}`;
        
        // CEK APAKAH TEMPLATE ADA
        if (Templates && Templates[templateKey]) {
            contentContainer.innerHTML = Templates[templateKey];
            
            // JALANKAN MODULE (Pake try-catch biar gak blank semua kalau satu error)
            try {
                if(tabIndex === 1 && window.initStoryModule) window.initStoryModule();
                if(tabIndex === 2 && window.initStyleModule) window.initStyleModule();
                if(tabIndex === 3 && window.initCharModule) window.initCharModule();
                if(tabIndex === 4 && window.initSceneModule) window.initSceneModule();
                if(tabIndex === 5 && window.generateVideoPrompts) window.generateVideoPrompts();
            } catch (err) {
                console.error(`Error init module tab ${tabIndex}:`, err);
                showToast(`Error Module: ${err.message}`, 'error');
            }

        } else {
            contentContainer.innerHTML = `<div class="p-10 text-center text-red-500">
                Error: Template tab${tabIndex} tidak ditemukan.<br>
                Cek file js/templates.js
            </div>`;
        }

        contentContainer.style.opacity = '1';
        contentContainer.style.transform = 'translateY(0)';
    }, 300);
};

// ... (Sisa fungsi toggleSettings, handleSaveSettings, showToast SAMA KAYA SEBELUMNYA) ...
// Pastikan fungsi-fungsi itu tetap ada di bawah sini.

// js/main.js (Update bagian ini aja)

// 1. FUNGSI TOGGLE YANG LEBIH STABIL
window.toggleSettings = () => {
    const modal = document.getElementById('settings-modal');
    const content = modal.querySelector('div[class*="absolute top-1/2"]'); // Ambil box kontennya

    if (modal.classList.contains('hidden')) {
        // BUKA MODAL
        modal.classList.remove('hidden');
        
        // Load value API Key yang tersimpan ke input
        const currentConfig = window.appState.config;
        document.getElementById('input-imgbb-key').value = currentConfig.imgbbKey || '';
        document.getElementById('input-polli-key').value = currentConfig.pollinationsKey || '';

        // Animasi Masuk (Kasih delay dikit biar browser render 'block' dulu)
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0', 'pointer-events-none');
            content.classList.remove('scale-95');
            content.classList.add('scale-100');
        });
    } else {
        // TUTUP MODAL
        modal.classList.add('opacity-0', 'pointer-events-none');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');

        // Tunggu animasi selesai baru hide (300ms sesuai duration di CSS)
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
};

// 2. FUNGSI SAVE DARI UI
window.handleSaveSettings = () => {
    const imgbb = document.getElementById('input-imgbb-key').value.trim();
    const polli = document.getElementById('input-polli-key').value.trim();

    if(!imgbb) {
        showToast("ImgBB Key wajib diisi bro!", "error");
        return;
    }

    // Panggil fungsi save di state.js
    window.saveSettings(polli, imgbb);
    
    // Tutup modal
    toggleSettings();
    showToast("Konfigurasi berhasil disimpan!", "success");
};

// 4. Global Toast Notification (Penting buat UX)
window.showToast = (message, type = 'info') => {
    // Buat elemen toast
    const toast = document.createElement('div');
    toast.className = `fixed bottom-5 right-5 px-6 py-3 rounded-xl backdrop-blur-md border border-white/10 shadow-2xl z-[200] animate-fade-in-up flex items-center gap-3`;
    
    // Warna berdasarkan tipe
    if(type === 'success') {
        toast.classList.add('bg-green-500/20', 'text-green-400');
        toast.innerHTML = `<i class="ph ph-check-circle text-xl"></i> <span class="font-bold text-sm">${message}</span>`;
    } else if (type === 'error') {
        toast.classList.add('bg-red-500/20', 'text-red-400');
        toast.innerHTML = `<i class="ph ph-warning-circle text-xl"></i> <span class="font-bold text-sm">${message}</span>`;
    } else {
        toast.classList.add('bg-blue-500/20', 'text-blue-400');
        toast.innerHTML = `<i class="ph ph-info text-xl"></i> <span class="font-bold text-sm">${message}</span>`;
    }

    document.body.appendChild(toast);

    // Hapus otomatis setelah 3 detik
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};
