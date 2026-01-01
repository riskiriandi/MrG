// js/modules/styleModule.js

window.initStyleModule = () => {
    // Load data lama kalau ada
    const savedPrompt = window.appState.project.style.prompt;
    const savedRatio = window.appState.project.style.ratio;
    
    if(document.getElementById('style-prompt')) {
        document.getElementById('style-prompt').value = savedPrompt;
        setRatio(savedRatio || '16:9');
    }
};

// 1. Handle Upload
window.handleStyleUpload = async (input) => {
    const file = input.files[0];
    if (!file) return;

    // Preview Gambar
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.getElementById('style-preview-img');
        const placeholder = document.getElementById('upload-placeholder');
        img.src = e.target.result;
        img.classList.remove('hidden');
        placeholder.classList.add('hidden');
    };
    reader.readAsDataURL(file);

    // Proses Upload & Analisa
    const status = document.getElementById('upload-status');
    status.innerText = "Uploading to ImgBB...";
    status.className = "text-center text-[10px] text-yellow-400 h-4 animate-pulse";

    try {
        // A. Upload ke ImgBB (Pake fungsi dari api.js)
        const imgUrl = await window.uploadToImgBB(file);
        
        status.innerText = "Analyzing Style with AI Vision...";
        
        // B. Analisa Style (Pake fungsi dari api.js)
        const styleDescription = await window.analyzeStyle(imgUrl);
        
        // C. Update UI & State
        document.getElementById('style-prompt').value = styleDescription;
        window.appState.project.style.prompt = styleDescription;
        window.appState.project.style.refImage = imgUrl;

        status.innerText = "Style Analyzed Successfully!";
        status.className = "text-center text-[10px] text-green-400 h-4";
        showToast("Style berhasil diekstrak!", "success");

    } catch (error) {
        console.error(error);
        status.innerText = "Error: " + error.message;
        status.className = "text-center text-[10px] text-red-400 h-4";
        showToast("Gagal analisa gambar. Cek API Key.", "error");
    }
};

// 2. Set Ratio
window.setRatio = (ratio) => {
    window.appState.project.style.ratio = ratio;
    
    // Update UI Buttons
    document.querySelectorAll('.ratio-btn').forEach(btn => {
        btn.classList.remove('active', 'bg-accent/10', 'border-accent', 'text-white');
        btn.classList.add('border-white/10', 'text-gray-400');
    });

    const idMap = { '1:1': 'ratio-1-1', '16:9': 'ratio-16-9', '9:16': 'ratio-9-16' };
    const activeBtn = document.getElementById(idMap[ratio]);
    if(activeBtn) {
        activeBtn.classList.add('active', 'bg-accent/10', 'border-accent', 'text-white');
        activeBtn.classList.remove('border-white/10', 'text-gray-400');
    }
};
