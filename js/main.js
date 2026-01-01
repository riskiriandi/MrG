// js/main.js

// 1. Inisialisasi saat web dibuka
document.addEventListener('DOMContentLoaded', () => {
    console.log("MrG Engine v2.0 Started...");
    
    // Load Tab 1 secara default
    switchTab(1);

    // Cek apakah ada API Key tersimpan
    const savedKey = localStorage.getItem('mrg_api_key');
    if(savedKey) {
        window.appState.config.apiKey = savedKey;
        console.log("API Key loaded.");
    }
});

// 2. Fungsi Pindah Tab (Core Logic)
window.switchTab = (tabIndex) => {
    // A. Update UI Tombol Navigasi
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        // Reset icon color
        const icon = btn.querySelector('i');
        if(icon) icon.classList.remove('text-accent');
    });

    const activeBtn = document.getElementById(`btn-tab-${tabIndex}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
        const icon = activeBtn.querySelector('i');
        if(icon) icon.classList.add('text-accent');
    }

    // B. Render Konten HTML dari Templates.js
    const contentContainer = document.getElementById('app-content');
    
    // Efek Transisi Keluar
    contentContainer.style.opacity = '0';
    contentContainer.style.transform = 'translateY(10px)';

    setTimeout(() => {
        // Inject HTML baru
        const templateKey = `tab${tabIndex}`;
        if (Templates[templateKey]) {
            contentContainer.innerHTML = Templates[templateKey];
            
            // Re-attach Event Listeners (Kalau ada logic khusus per tab)
            // Contoh: kalau di tab 2 ada slider, inisialisasi ulang disini
        } else {
            contentContainer.innerHTML = `<div class="p-10 text-center text-red-500">Error: Module ${tabIndex} not found.</div>`;
       if(tabIndex === 1) window.initStoryModule();
       if(tabIndex === 2) window.initStyleModule();
       if(tabIndex === 3) window.initCharModule();
       if(tabIndex === 4) window.initSceneModule();
       if(tabIndex === 5) window.generateVideoPrompts();
        }

        // Efek Transisi Masuk
        contentContainer.style.opacity = '1';
        contentContainer.style.transform = 'translateY(0)';
    }, 300); // Tunggu 300ms biar animasi out selesai
};

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
