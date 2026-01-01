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
        }

        // Efek Transisi Masuk
        contentContainer.style.opacity = '1';
        contentContainer.style.transform = 'translateY(0)';
    }, 300); // Tunggu 300ms biar animasi out selesai
};

// 3. Fungsi Toggle Settings Modal
window.toggleSettings = () => {
    const modal = document.getElementById('settings-modal');
    if (modal.classList.contains('hidden')) {
        // Buka
        modal.classList.remove('hidden');
        // Hack dikit biar animasi CSS jalan (tunggu browser render class remove dulu)
        setTimeout(() => {
            modal.classList.remove('opacity-0', 'pointer-events-none');
            modal.querySelector('div[class*="scale-95"]').classList.remove('scale-95');
            modal.querySelector('div[class*="scale-95"]').classList.add('scale-100');
        }, 10);
    } else {
        // Tutup
        modal.classList.add('opacity-0', 'pointer-events-none');
        modal.querySelector('div[class*="scale-100"]').classList.remove('scale-100');
        modal.querySelector('div[class*="scale-100"]').classList.add('scale-95');
        
        setTimeout(() => {
            modal.classList.add('hidden');
        }, 300);
    }
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

// Placeholder Function buat tombol Generate (Biar gak error pas diklik)
window.generateStory = () => {
    const input = document.getElementById('story-input').value;
    if(!input) {
        showToast("Tulis ide ceritanya dulu dong!", "error");
        return;
    }
    
    // Simulasi Loading
    const btn = document.querySelector('button[onclick="generateStory()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Thinking...`;
    btn.disabled = true;

    setTimeout(() => {
        // Simulasi Sukses
        document.getElementById('story-result').classList.remove('hidden');
        
        // Efek ngetik (Streaming simulation)
        const target = document.getElementById('final-story-text');
        const text = "Judul: " + input + "\n\nSinopsis:\nDi dunia cyberpunk tahun 2077, " + input + " menjadi kunci revolusi...";
        let i = 0;
        target.innerHTML = "";
        
        const typeInterval = setInterval(() => {
            target.innerHTML += text.charAt(i);
            i++;
            if (i > text.length - 1) {
                clearInterval(typeInterval);
                btn.innerHTML = originalText;
                btn.disabled = false;
                showToast("Story Generated Successfully!", "success");
                
                // Simpan ke State
                window.appState.story.rawIdea = input;
                window.appState.story.synopsis = text;
            }
        }, 20); // Kecepatan ngetik

    }, 1500);
};
