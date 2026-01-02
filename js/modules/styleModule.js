// ============================================================
// MODULE TAB 2: VISUAL STYLE & CONFIGURATION
// ============================================================

// 1. INISIALISASI
window.initStyleModule = () => {
    console.log("Style Module Loaded");
    
    const savedPrompt = window.appState.project.style.prompt;
    const savedRatio = window.appState.project.style.ratio;
    const savedRefImage = window.appState.project.style.refImage;
    
    // Restore Prompt
    const promptBox = document.getElementById('style-prompt');
    if(promptBox) {
        promptBox.value = savedPrompt || "";
        
        // Auto-save
        promptBox.addEventListener('input', (e) => {
            window.appState.project.style.prompt = e.target.value;
        });
    } else {
        console.error("CRITICAL ERROR: Textarea 'style-prompt' tidak ditemukan di HTML!");
    }

    // Restore Ratio
    setRatio(savedRatio || '16:9');

    // Restore Image
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

// 2. HANDLE UPLOAD FILE
window.handleStyleUpload = async (input) => {
    const file = input.files[0];
    if (!file) return;

    // Preview
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
        // A. Upload
        const imgUrl = await window.uploadToImgBB(file);
        window.appState.project.style.refImage = imgUrl;

        // B. Analisa
        status.innerText = "Analyzing Art Style...";
        
        // Panggil API
        const styleDescription = await window.analyzeStyle(imgUrl);
        
        // DEBUGGING: Cek di Console Browser (F12)
        console.log("HASIL ANALISA DARI API:", styleDescription);

        // C. Update UI (DENGAN PENGECEKAN)
        const promptBox = document.getElementById('style-prompt');
        if (promptBox) {
            if (styleDescription && styleDescription.length > 0) {
                promptBox.value = styleDescription;
                window.appState.project.style.prompt = styleDescription;
                
                status.innerText = "Style Analyzed Successfully!";
                status.className = "text-center text-[10px] text-green-400 h-4";
                showToast("Style berhasil masuk!", "success");
            } else {
                status.innerText = "AI returned empty text.";
                showToast("AI merespon, tapi teks kosong.", "warning");
            }
        } else {
            alert("Error: Kotak 'Master Style Prompt' hilang dari layar!");
        }

    } catch (error) {
        console.error(error);
        status.innerText = "Error: " + error.message;
        status.className = "text-center text-[10px] text-red-400 h-4";
        showToast("Gagal analisa. Cek Console.", "error");
    }
};

// 3. HANDLE URL INPUT
window.handleStyleUrl = async () => {
    const urlInput = document.getElementById('style-url-input');
    const url = urlInput.value.trim();
    
    if(!url) return showToast("Masukin link gambarnya dulu!", "error");

    const img = document.getElementById('style-preview-img');
    const placeholder = document.getElementById('upload-placeholder');
    const status = document.getElementById('upload-status');
    
    img.src = url;
    img.classList.remove('hidden');
    placeholder.classList.add('hidden');
    window.appState.project.style.refImage = url;

    status.innerText = "Analyzing Art Style...";
    status.className = "text-center text-[10px] text-yellow-400 h-4 animate-pulse";

    try {
        const styleDescription = await window.analyzeStyle(url);
        console.log("HASIL ANALISA URL:", styleDescription);

        const promptBox = document.getElementById('style-prompt');
        if (promptBox) {
            promptBox.value = styleDescription;
            window.appState.project.style.prompt = styleDescription;
            
            status.innerText = "Style Analyzed Successfully!";
            status.className = "text-center text-[10px] text-green-400 h-4";
            showToast("Style berhasil masuk!", "success");
        }

    } catch (error) {
        console.error(error);
        status.innerText = "Error Analyzing";
        status.className = "text-center text-[10px] text-red-400 h-4";
        showToast("Gagal analisa URL.", "error");
    }
};

// 4. SET RATIO
window.setRatio = (ratio) => {
    window.appState.project.style.ratio = ratio;
    
    const buttons = { '1:1': 'ratio-1-1', '16:9': 'ratio-16-9', '9:16': 'ratio-9-16' };
    Object.values(buttons).forEach(id => {
        const btn = document.getElementById(id);
        if(btn) {
            btn.classList.remove('active', 'bg-accent/10', 'border-accent', 'text-white');
            btn.classList.add('border-white/10', 'text-gray-400');
        }
    });

    const activeBtn = document.getElementById(buttons[ratio]);
    if(activeBtn) {
        activeBtn.classList.add('active', 'bg-accent/10', 'border-accent', 'text-white');
        activeBtn.classList.remove('border-white/10', 'text-gray-400');
    }
};
