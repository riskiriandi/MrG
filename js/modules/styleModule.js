// ============================================================
// MODULE TAB 2: VISUAL STYLE & CONFIGURATION
// ============================================================

// 1. INISIALISASI
window.initStyleModule = () => {
    console.log("Style Module Loaded");
    
    // Load data dari State
    const savedPrompt = window.appState.project.style.prompt;
    const savedRatio = window.appState.project.style.ratio;
    const savedRefImage = window.appState.project.style.refImage;
    
    // Restore Prompt
    if(document.getElementById('style-prompt')) {
        document.getElementById('style-prompt').value = savedPrompt || "";
        
        // Auto-save saat user edit manual
        document.getElementById('style-prompt').addEventListener('input', (e) => {
            window.appState.project.style.prompt = e.target.value;
        });
    }

    // Restore Ratio
    setRatio(savedRatio || '16:9');

    // Restore Preview Image (Kalau ada)
    if (savedRefImage) {
        const img = document.getElementById('style-preview-img');
        const placeholder = document.getElementById('upload-placeholder');
        if(img && placeholder) {
            img.src = savedRefImage;
            img.classList.remove('hidden');
            placeholder.classList.add('hidden');
        }
    }
};

// 2. HANDLE UPLOAD FILE (ImgBB + Vision)
window.handleStyleUpload = async (input) => {
    const file = input.files[0];
    if (!file) return;

    // UI Preview Langsung (Biar gak nunggu upload)
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.getElementById('style-preview-img');
        const placeholder = document.getElementById('upload-placeholder');
        img.src = e.target.result;
        img.classList.remove('hidden');
        placeholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);

    const status = document.getElementById('upload-status');
    status.innerText = "Uploading to ImgBB...";
    status.className = "text-center text-[10px] text-yellow-400 h-4 animate-pulse";

    try {
        // A. Upload ke ImgBB
        const imgUrl = await window.uploadToImgBB(file);
        
        // Simpan URL Referensi
        window.appState.project.style.refImage = imgUrl;

        // B. Analisa Style dengan Vision AI
        status.innerText = "Analyzing Art Style...";
        const styleDescription = await window.analyzeStyle(imgUrl);
        
        // C. Update UI & State
        document.getElementById('style-prompt').value = styleDescription;
        window.appState.project.style.prompt = styleDescription;

        status.innerText = "Style Analyzed Successfully!";
        status.className = "text-center text-[10px] text-green-400 h-4";
        showToast("Style berhasil diekstrak!", "success");

    } catch (error) {
        console.error(error);
        status.innerText = "Error: " + error.message;
        status.className = "text-center text-[10px] text-red-400 h-4";
        showToast("Gagal analisa. Cek API Key.", "error");
    }
};

// 3. HANDLE URL INPUT MANUAL
window.handleStyleUrl = async () => {
    const urlInput = document.getElementById('style-url-input');
    const url = urlInput.value.trim();
    
    if(!url) return showToast("Masukin link gambarnya dulu!", "error");

    // UI Preview
    const img = document.getElementById('style-preview-img');
    const placeholder = document.getElementById('upload-placeholder');
    const status = document.getElementById('upload-status');
    
    img.src = url;
    img.classList.remove('hidden');
    placeholder.classList.add('hidden');
    
    // Simpan URL Referensi
    window.appState.project.style.refImage = url;

    status.innerText = "Analyzing Art Style...";
    status.className = "text-center text-[10px] text-yellow-400 h-4 animate-pulse";

    try {
        // Analisa Style
        const styleDescription = await window.analyzeStyle(url);
        
        document.getElementById('style-prompt').value = styleDescription;
        window.appState.project.style.prompt = styleDescription;

        status.innerText = "Style Analyzed Successfully!";
        status.className = "text-center text-[10px] text-green-400 h-4";
        showToast("Style berhasil diekstrak!", "success");

    } catch (error) {
        console.error(error);
        status.innerText = "Error Analyzing";
        status.className = "text-center text-[10px] text-red-400 h-4";
        showToast("Gagal analisa URL.", "error");
    }
};

// 4. SET ASPECT RATIO
window.setRatio = (ratio) => {
    window.appState.project.style.ratio = ratio;
    
    // Update UI Buttons (Visual Feedback)
    const buttons = {
        '1:1': 'ratio-1-1',
        '16:9': 'ratio-16-9',
        '9:16': 'ratio-9-16'
    };

    // Reset semua tombol ke state tidak aktif
    Object.values(buttons).forEach(id => {
        const btn = document.getElementById(id);
        if(btn) {
            btn.classList.remove('active', 'bg-accent/10', 'border-accent', 'text-white');
            btn.classList.add('border-white/10', 'text-gray-400');
        }
    });

    // Aktifkan tombol yang dipilih
    const activeBtn = document.getElementById(buttons[ratio]);
    if(activeBtn) {
        activeBtn.classList.add('active', 'bg-accent/10', 'border-accent', 'text-white');
        activeBtn.classList.remove('border-white/10', 'text-gray-400');
    }
    
    console.log("Ratio set to:", ratio);
};
