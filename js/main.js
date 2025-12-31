/**
 * js/main.js
 * Controller Utama: Mengatur Navigasi Tab, Modal Settings, dan Inisialisasi Global.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 MrG System Initialized");

    // =================================================================
    // 1. TAB NAVIGATION LOGIC
    // =================================================================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabSections = document.querySelectorAll('.tab-section');

    function switchTab(tabIndex) {
        // A. Update Tombol Navigasi
        tabButtons.forEach(btn => {
            if (btn.dataset.tab === tabIndex.toString()) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // B. Update Konten Section
        tabSections.forEach(section => {
            section.classList.add('hidden'); // Sembunyikan semua
        });

        const targetSection = document.getElementById(`tab-content-${tabIndex}`);
        if (targetSection) {
            targetSection.classList.remove('hidden'); // Munculkan yang dipilih
            
            // Animasi kecil biar smooth
            targetSection.classList.remove('animate-fade-in');
            void targetSection.offsetWidth; // Trigger reflow
            targetSection.classList.add('animate-fade-in');
        }
    }

    // Event Listener untuk Klik Tombol Tab
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            switchTab(target);
        });
    });

    // Default: Buka Tab 1 saat pertama load
    switchTab(1);

    // Expose fungsi ke global (biar bisa dipanggil dari file tab lain, misal: selesai Tab 1 lanjut Tab 2)
    window.switchTab = switchTab;


    // =================================================================
    // 2. SETTINGS MODAL LOGIC
    // =================================================================
    const modal = document.getElementById('settings-modal');
    const btnOpen = document.getElementById('btn-open-settings');
    const btnClose = document.getElementById('btn-close-settings');
    const backdrop = document.getElementById('settings-backdrop');
    
    const inputPolli = document.getElementById('input-pollinations-key');
    const inputImgbb = document.getElementById('input-imgbb-key');
    const btnSave = document.getElementById('btn-save-settings');
    const btnReset = document.getElementById('btn-reset-project');

    // Fungsi Buka Modal
    function openSettings() {
        // Load data dari AppState ke Input
        inputPolli.value = AppState.settings.pollinationsKey || "";
        inputImgbb.value = AppState.settings.imgbbKey || "";
        
        modal.classList.remove('hidden');
    }

    // Fungsi Tutup Modal
    function closeSettings() {
        modal.classList.add('hidden');
    }

    // Event Listeners Modal
    if (btnOpen) btnOpen.addEventListener('click', openSettings);
    if (btnClose) btnClose.addEventListener('click', closeSettings);
    if (backdrop) backdrop.addEventListener('click', closeSettings);

    // LOGIC SIMPAN SETTINGS
    if (btnSave) {
        btnSave.addEventListener('click', () => {
            const polliKey = inputPolli.value;
            const imgbbKey = inputImgbb.value;

            // Panggil fungsi helper dari state.js
            updateSettings(polliKey, imgbbKey);

            // Visual Feedback
            const originalText = btnSave.innerHTML;
            btnSave.innerHTML = `<i class="ph ph-check"></i> Tersimpan!`;
            btnSave.classList.add('bg-green-600', 'border-green-500');
            
            setTimeout(() => {
                btnSave.innerHTML = originalText;
                btnSave.classList.remove('bg-green-600', 'border-green-500');
                closeSettings();
            }, 1000);
        });
    }

    // LOGIC RESET PROJECT
    if (btnReset) {
        btnReset.addEventListener('click', () => {
            // Panggil fungsi reset dari state.js
            resetProject();
        });
    }

    // =================================================================
    // 3. SYSTEM CHECK (Indikator Status)
    // =================================================================
    function checkSystemReady() {
        const statusInd = document.getElementById('status-indicator');
        if (!statusInd) return;

        // Cek apakah API Key ImgBB sudah ada (karena ini wajib buat Tab 2)
        if (!AppState.settings.imgbbKey) {
            statusInd.innerHTML = `
                <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span class="text-red-400">Setup Required</span>
            `;
            // Kasih notif merah di tombol gear
            const btnGear = document.getElementById('btn-open-settings');
            if(btnGear) btnGear.classList.add('border-red-500', 'text-red-400');
        } else {
            statusInd.innerHTML = `
                <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span class="text-green-400">System Ready</span>
            `;
        }
    }

    // Jalankan cek status saat load
    checkSystemReady();
});
