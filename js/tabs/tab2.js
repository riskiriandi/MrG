/**
 * js/tabs/tab2.js
 * Logika Tab 2: Visual Style & Configuration.
 * Menangani Upload ImgBB, Vision Analysis, dan Pengaturan Model/Ratio.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. AMBIL ELEMENT DOM
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('style-file-input');
    const urlInput = document.getElementById('style-url-input');
    const imgPreview = document.getElementById('style-image-preview');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const btnAnalyze = document.getElementById('btn-analyze-style');
    const statusText = document.getElementById('style-status-text');
    const masterPromptInput = document.getElementById('master-style-prompt');
    const btnSaveNext = document.getElementById('btn-save-style');
    const ratioButtons = document.querySelectorAll('.ratio-btn');

    // 2. INJECT MODEL SELECTOR (Upgrade UI via JS)
    // Kita ganti "Toggle Quality" di HTML jadi "Dropdown 3 Model" sesuai request lu
    upgradeModelSelectorUI();

    // 3. LOAD DATA DARI STATE
    loadStateToUI();

    // =================================================================
    // A. LOGIC UPLOAD GAMBAR (ImgBB)
    // =================================================================
    
    // Klik area -> Buka file explorer
    if (uploadArea) {
        uploadArea.addEventListener('click', () => fileInput.click());
    }

    // Saat file dipilih
    if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validasi Key Dulu
            if (!AppState.settings.imgbbKey) {
                alert("⚠️ ImgBB API Key belum diisi! Masuk ke Settings (ikon gerigi) dulu bro.");
                return;
            }

            // Tampilkan Preview Lokal dulu biar cepet
            const reader = new FileReader();
            reader.onload = (e) => {
                imgPreview.src = e.target.result;
                imgPreview.classList.remove('hidden');
                uploadPlaceholder.classList.add('opacity-0');
            };
            reader.readAsDataURL(file);

            // Proses Upload ke ImgBB
            try {
                statusText.innerText = "⏳ Mengupload ke ImgBB...";
                statusText.className = "text-[10px] text-yellow-500 mt-3 text-center animate-pulse";
                
                // Panggil API (dari api.js)
                const publicUrl = await uploadToImgBB(file);
                
                // Simpan URL ke State & Input URL
                AppState.style.referenceImageUrl = publicUrl;
                urlInput.value = publicUrl;
                
                statusText.innerText = "✅ Upload Berhasil!";
                statusText.className = "text-[10px] text-green-500 mt-3 text-center";
                
                saveProject(); // Auto-save

            } catch (error) {
                console.error(error);
                statusText.innerText = "❌ Gagal Upload: " + error.message;
                statusText.className = "text-[10px] text-red-500 mt-3 text-center";
                alert("Gagal upload ke ImgBB. Cek API Key lu.");
            }
        });
    }

    // =================================================================
    // B. LOGIC VISION ANALYSIS (Analisa Style)
    // =================================================================
    if (btnAnalyze) {
        btnAnalyze.addEventListener('click', async () => {
            const imageUrl = urlInput.value.trim();
            
            if (!imageUrl) {
                alert("Upload gambar dulu atau masukkan link gambar!");
                return;
            }

            // UI Loading
            const originalBtnText = btnAnalyze.innerHTML;
            btnAnalyze.disabled = true;
            btnAnalyze.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Menganalisa...';
            masterPromptInput.value = "Sedang menganalisa style gambar...";

            try {
                // Panggil Vision API (dari api.js)
                const styleDescription = await analyzeImageStyle(imageUrl);
                
                // Masukkan hasil ke Textarea & State
                masterPromptInput.value = styleDescription;
                AppState.style.masterPrompt = styleDescription;
                
                saveProject();

            } catch (error) {
                console.error(error);
                masterPromptInput.value = "Gagal menganalisa style. Pastikan API Key Pollinations sudah diisi (atau kosongkan untuk mode gratis).";
                alert("Error Vision API: " + error.message);
            } finally {
                btnAnalyze.disabled = false;
                btnAnalyze.innerHTML = originalBtnText;
            }
        });
    }

    // =================================================================
    // C. LOGIC CONFIGURATION (Ratio & Model)
    // =================================================================
    
    // 1. Aspect Ratio
    ratioButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Visual Update
            ratioButtons.forEach(b => {
                b.classList.remove('active', 'bg-accent/20', 'border-accent', 'text-white');
                b.classList.add('bg-black/30', 'border-white/10', 'text-gray-400');
            });
            btn.classList.remove('bg-black/30', 'border-white/10', 'text-gray-400');
            btn.classList.add('active', 'bg-accent/20', 'border-accent', 'text-white');

            // State Update
            const ratio = btn.dataset.ratio; // "16:9"
            AppState.style.aspectRatio = ratio;
            
            // Hitung Width/Height berdasarkan ratio
            const dims = getDimensions(ratio); // Fungsi helper dari state.js
            AppState.style.width = dims.w;
            AppState.style.height = dims.h;

            console.log(`Ratio set to ${ratio} (${dims.w}x${dims.h})`);
            saveProject();
        });
    });

    // 2. Master Prompt Manual Edit
    masterPromptInput.addEventListener('input', (e) => {
        AppState.style.masterPrompt = e.target.value;
        saveProject(); // Save tiap ngetik (bisa di-debounce kalau mau lebih hemat)
    });

    // 3. Tombol Lanjut
    if (btnSaveNext) {
        btnSaveNext.addEventListener('click', () => {
            // Validasi dikit
            if (!AppState.style.masterPrompt) {
                if(!confirm("Master Style Prompt masih kosong. Yakin mau lanjut tanpa style khusus?")) return;
            }
            window.switchTab(3);
        });
    }

    // =================================================================
    // D. HELPER FUNCTIONS
    // =================================================================

    function loadStateToUI() {
        // Load URL Gambar
        if (AppState.style.referenceImageUrl) {
            urlInput.value = AppState.style.referenceImageUrl;
            imgPreview.src = AppState.style.referenceImageUrl;
            imgPreview.classList.remove('hidden');
            uploadPlaceholder.classList.add('opacity-0');
        }

        // Load Prompt
        if (AppState.style.masterPrompt) {
            masterPromptInput.value = AppState.style.masterPrompt;
        }

        // Load Ratio Active State
        const currentRatio = AppState.style.aspectRatio || "16:9";
        ratioButtons.forEach(btn => {
            if (btn.dataset.ratio === currentRatio) {
                btn.click(); // Trigger click biar visual & logic jalan
            }
        });
    }

    function upgradeModelSelectorUI() {
        // Cari elemen toggle quality yang lama
        const qualityToggleContainer = document.querySelector('#toggle-quality')?.closest('.glass-panel');
        
        if (qualityToggleContainer) {
            // Kita ganti isinya dengan Dropdown 3 Model
            qualityToggleContainer.innerHTML = `
                <div class="flex flex-col gap-2 w-full">
                    <label class="text-white font-bold text-sm flex items-center gap-2">
                        <i class="ph ph-robot text-accent"></i> Model Generator
                    </label>
                    <select id="model-selector" class="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:border-accent focus:outline-none">
                        <option value="seedream">Seedream (Standard)</option>
                        <option value="seedream-pro">Seedream Pro (High Quality)</option>
                        <option value="nanobanana">Nanobanana (Creative)</option>
                    </select>
                    <p class="text-[10px] text-gray-500">Pilih model yang akan digunakan untuk Tab 3 & 4.</p>
                </div>
            `;

            // Pasang Event Listener buat Dropdown baru ini
            const select = document.getElementById('model-selector');
            
            // Set nilai awal dari State
            select.value = AppState.style.selectedModel || "seedream";

            select.addEventListener('change', (e) => {
                AppState.style.selectedModel = e.target.value;
                console.log("Model selected:", AppState.style.selectedModel);
                saveProject();
            });
        }
    }
});
