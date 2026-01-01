// js/state.js

// Default Data Project (Isi Cerita, Gambar, dll)
const defaultProjectState = {
    story: {
        rawIdea: "",
        useDialog: true, // Toggle Dialog Mode
        title: "",
        synopsis: "",
        scripts: [] 
    },
    style: {
        ratio: "16:9",
        prompt: "",
        refImage: null
    },
    characters: [], // { name, desc, visual, seed, img }
    scenes: []      // { id, text, prompt, img, seed }
};

// Default Config (API Key) - Terpisah!
const defaultConfig = {
    pollinationsKey: "",
    imgbbKey: ""
};

// Load Data dari LocalStorage
const loadState = () => {
    const savedProject = localStorage.getItem('mrg_project_data');
    const savedConfig = localStorage.getItem('mrg_config_data');

    return {
        project: savedProject ? JSON.parse(savedProject) : JSON.parse(JSON.stringify(defaultProjectState)),
        config: savedConfig ? JSON.parse(savedConfig) : {...defaultConfig}
    };
};

// Inisialisasi Proxy (Biar otomatis save pas data berubah)
const data = loadState();

const handler = {
    set(target, property, value) {
        target[property] = value;
        
        // Auto Save ke LocalStorage
        if (target === window.appState.project) {
            localStorage.setItem('mrg_project_data', JSON.stringify(target));
        } else if (target === window.appState.config) {
            localStorage.setItem('mrg_config_data', JSON.stringify(target));
        }
        return true;
    }
};

window.appState = {
    project: new Proxy(data.project, handler),
    config: new Proxy(data.config, handler)
};

// FUNGSI RESET (Sesuai Request Lu)
window.resetProjectData = () => {
    // Timpa project data dengan default, TAPI config jangan disentuh
    Object.assign(window.appState.project, JSON.parse(JSON.stringify(defaultProjectState)));
    localStorage.setItem('mrg_project_data', JSON.stringify(window.appState.project));
    
    // Refresh halaman biar bersih
    window.location.reload();
};

// FUNGSI SAVE API KEY
window.saveSettings = (polliKey, imgbbKey) => {
    window.appState.config.pollinationsKey = polliKey;
    window.appState.config.imgbbKey = imgbbKey;
    alert("Konfigurasi Tersimpan! (Aman walau di-reset)");
};
