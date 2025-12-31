/**
 * js/state.js
 * Bertugas menangani State Management & LocalStorage Persistence.
 * UPDATE: Fix Reset Project agar API Key TIDAK ikut terhapus.
 */

// 1. DEFINISI STATE DEFAULT (Kosong)
const DEFAULT_STATE = {
    // --- TAB 1: STORY ---
    story: {
        rawIdea: "",
        isDialogMode: false,
        masterScript: "",
        characters: [],
        lastGenerated: null
    },

    // --- TAB 2: STYLE ---
    style: {
        referenceImageUrl: "",
        referenceImageFile: null, // Runtime only
        masterPrompt: "",
        aspectRatio: "16:9",
        width: 1280,
        height: 720,
        selectedModel: "seedream"
    },

    // --- TAB 3: CHARACTERS ---
    characters: {
        generatedImages: {} 
    },

    // --- TAB 4: SCENES ---
    scenes: {
        count: 6,
        data: []
    },

    // --- TAB 5: VIDEO ---
    video: {
        generatedVideos: {}
    },

    // --- GLOBAL SETTINGS ---
    settings: {
        pollinationsKey: "",
        imgbbKey: ""
    }
};

// 2. INISIALISASI STATE
let savedData = localStorage.getItem('MrG_Project_Data');
let AppState = savedData ? JSON.parse(savedData) : JSON.parse(JSON.stringify(DEFAULT_STATE));

console.log("State Loaded:", AppState);

// 3. FUNGSI SAVE (PERSISTENCE)
function saveProject() {
    try {
        localStorage.setItem('MrG_Project_Data', JSON.stringify(AppState));
        console.log("✅ Project Auto-Saved");
        
        // Visual Feedback di Header
        const statusInd = document.getElementById('status-indicator');
        if(statusInd) {
            // Cek status API Key buat nentuin warna
            if (!AppState.settings.imgbbKey) {
                statusInd.innerHTML = `<div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div><span class="text-red-400">Setup Required</span>`;
            } else {
                statusInd.innerHTML = `<div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div><span>Saving...</span>`;
                setTimeout(() => {
                    statusInd.innerHTML = `<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span>System Ready</span>`;
                }, 800);
            }
        }
    } catch (e) {
        console.error("Gagal menyimpan project:", e);
    }
}

// 4. FUNGSI RESET (HAPUS DATA TAPI SIMPAN KEY)
function resetProject() {
    if (confirm("Yakin mau hapus data cerita & gambar? (API Key tidak akan dihapus)")) {
        
        // A. AMANKAN API KEY DULU
        const currentSettings = { ...AppState.settings };
        
        // B. RESET STATE KE DEFAULT
        AppState = JSON.parse(JSON.stringify(DEFAULT_STATE));
        
        // C. KEMBALIKAN API KEY
        AppState.settings = currentSettings;
        
        // D. SIMPAN STATE BARU (YANG BERSIH TAPI ADA KEY-NYA)
        saveProject();
        
        // E. RELOAD HALAMAN
        location.reload();
    }
}

// 5. HELPER: UPDATE SETTINGS
function updateSettings(polliKey, imgKey) {
    AppState.settings.pollinationsKey = polliKey.trim();
    AppState.settings.imgbbKey = imgKey.trim();
    saveProject();
    
    // Trigger re-check status UI
    const statusInd = document.getElementById('status-indicator');
    if(statusInd && AppState.settings.imgbbKey) {
        statusInd.innerHTML = `<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span>System Ready</span>`;
        const btnGear = document.getElementById('btn-open-settings');
        if(btnGear) btnGear.classList.remove('border-red-500', 'text-red-400');
    }
}

// 6. HELPER: GET MODEL CONFIG
function getDimensions(ratio) {
    if (ratio === "1:1") return { w: 1024, h: 1024 };
    if (ratio === "16:9") return { w: 1280, h: 720 };
    if (ratio === "9:16") return { w: 720, h: 1280 };
    return { w: 1024, h: 1024 };
}
