// js/state.js
// =========================================
// OTAK PENYIMPANAN DATA (STATE MANAGEMENT)
// =========================================

// 1. DEFINISI DATA DEFAULT
// -----------------------------------------

// Data Project (Akan hilang kalau di-Reset)
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

// Data Config (TIDAK hilang kalau di-Reset)
const defaultConfig = {
    pollinationsKey: "",
    imgbbKey: ""
};

// 2. LOGIC PROXY (AUTO-SAVE)
// -----------------------------------------
// Fungsi ini bikin data otomatis tersimpan ke LocalStorage tiap kali berubah
const createPersistentProxy = (initialData, storageKey) => {
    return new Proxy(initialData, {
        set(target, property, value) {
            // 1. Update data di memori
            target[property] = value;
            
            // 2. Simpan ke LocalStorage
            // console.log(`[AUTO-SAVE] Saving ${property} to ${storageKey}`); // Uncomment buat debugging
            localStorage.setItem(storageKey, JSON.stringify(target));
            
            return true;
        }
    });
};

// 3. INISIALISASI STATE
// -----------------------------------------
const initAppState = () => {
    // Cek LocalStorage, kalau kosong pake Default
    const savedProject = localStorage.getItem('mrg_project_data');
    const savedConfig = localStorage.getItem('mrg_config_data');

    const projectData = savedProject ? JSON.parse(savedProject) : JSON.parse(JSON.stringify(defaultProjectState));
    const configData = savedConfig ? JSON.parse(savedConfig) : {...defaultConfig};

    return {
        // Kita bungkus pake Proxy biar reaktif
        project: createPersistentProxy(projectData, 'mrg_project_data'),
        config: createPersistentProxy(configData, 'mrg_config_data')
    };
};

// Assign ke Window biar bisa diakses dari mana aja
window.appState = initAppState();


// 4. FUNGSI GLOBAL (RESET & SAVE)
// -----------------------------------------

// Fungsi Reset Data Project (Bahaya)
window.resetProjectData = () => {
    if(!confirm("Yakin mau RESET PROJECT? Semua cerita & gambar akan dihapus. (API Key aman)")) return;

    console.log("Resetting Project Data...");

    // 1. Timpa data project di memori dengan default
    // Kita pake JSON parse/stringify biar bener-bener deep copy (bersih)
    const cleanData = JSON.parse(JSON.stringify(defaultProjectState));
    
    // 2. Update satu-satu property-nya biar Proxy ke-trigger
    Object.keys(cleanData).forEach(key => {
        window.appState.project[key] = cleanData[key];
    });

    // 3. Paksa simpan ke LocalStorage (Double safety)
    localStorage.setItem('mrg_project_data', JSON.stringify(cleanData));
    
    // 4. Reload halaman biar UI bersih total
    // Kita kasih delay dikit biar user liat feedback
    if(window.showToast) window.showToast("Project Reset! Refreshing...", "error");
    
    setTimeout(() => {
        window.location.reload();
    }, 1000);
};

// Fungsi Simpan API Key (Dipanggil dari Modal Settings)
window.saveSettings = (polliKey, imgbbKey) => {
    // Update State (Otomatis ke-save ke LocalStorage karena Proxy)
    window.appState.config.pollinationsKey = polliKey;
    window.appState.config.imgbbKey = imgbbKey;
    
    console.log("Settings Saved:", { polliKey, imgbbKey });
};
