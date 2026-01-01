// js/modules/styleModule.js

window.initStyleModule = () => {
    const savedPrompt = window.appState.project.style.prompt;
    const savedRatio = window.appState.project.style.ratio;
    
    if(document.getElementById('style-prompt')) {
        document.getElementById('style-prompt').value = savedPrompt || "";
        setRatio(savedRatio || '16:9');
    }
};

// Handle URL Input Manual
window.handleStyleUrl = async () => {
    const url = document.getElementById('style-url-input').value;
    if(!url) return showToast("Masukin link gambarnya dulu!", "error");

    // Tampilkan Preview
    const img = document.getElementById('style-preview-img');
    const placeholder = document.getElementById('upload-placeholder');
    img.src = url;
    img.classList.remove('hidden');
    placeholder.classList.add('hidden');

    // Analisa
    analyzeImage(url);
};

// Handle Upload File
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

    // Upload ke ImgBB dulu
    try {
        showToast("Uploading to ImgBB...", "info");
        const imgUrl = await window.uploadToImgBB(file);
        analyzeImage(imgUrl);
    } catch (e) {
        showToast("Gagal Upload: " + e.message, "error");
    }
};

// Fungsi Analisa (Dipake oleh kedua metode di atas)
async function analyzeImage(url) {
    const status = document.getElementById('upload-status');
    status.innerText = "Analyzing Style...";
    
    try {
        const styleDescription = await window.analyzeStyle(url);
        
        document.getElementById('style-prompt').value = styleDescription;
        window.appState.project.style.prompt = styleDescription;
        window.appState.project.style.refImage = url;

        status.innerText = "Done!";
        showToast("Style berhasil diambil!", "success");
    } catch (e) {
        status.innerText = "Error Analyzing";
        showToast("Gagal analisa style.", "error");
    }
}

// ... (Fungsi setRatio sama kayak sebelumnya) ...

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
