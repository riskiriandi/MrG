/**
 * js/state.js
 * Bertugas menangani State Management & LocalStorage Persistence.
 * File ini harus di-load SEBELUM file JS lainnya.
 */

// 1. DEFINISI STATE DEFAULT (Kosong)
// Ini dipakai saat pertama kali buka atau setelah Reset.
const DEFAULT_STATE = {
    // --- TAB 1: STORY ---
    story: {
        rawIdea: "",            // Input ide kasar user
        isDialogMode: false,    // Toggle Dialog Mode
        masterScript: "",       // Hasil generate cerita (Teks/JSON)
        characters: [],         // List karakter hasil ekstraksi (Array of Objects)
        lastGenerated: null     // Timestamp terakhir generate
    },

    // --- TAB 2: STYLE ---
    style: {
        referenceImageUrl: "",  // URL gambar dari ImgBB
        referenceImageFile: null, // (Tidak disimpan di localStorage, cuma runtime)
        masterPrompt: "",       // Prompt gaya visual hasil analisa AI
        aspectRatio: "16:9",    // Default ratio
        width: 1280,            // Default width (16:9)
        height: 720,            // Default height (16:9)
        selectedModel: "seedream" // Pilihan: seedream, seedream-pro, nanobanana
    },

    // --- TAB 3: CHARACTERS ---
    characters: {
        // Menyimpan URL hasil generate per karakter
        // Format key-value: { "Nama Karakter": "URL_GAMBAR_POLLINATIONS" }
        generatedImages: {} 
    },

    // --- TAB 4: SCENES ---
    scenes: {
        count: 6,               // Target jumlah scene
        data: []                // Array of Objects: { id, description, visualPrompt, lighting, imageUrl }
    },

    // --- TAB 5: VIDEO ---
    video: {
        generatedVideos: {}     // Format: { sceneId: "URL_VIDEO" }
    },

    // --- GLOBAL SETTINGS ---
    settings: {
        pollinationsKey: "",    // API Key Pollinations (Optional)
        imgbbKey: ""            // API Key ImgBB (Wajib buat Tab 2)
    }
};

// 2. INISIALISASI STATE (APP_STATE)
// Cek apakah ada data tersimpan di LocalStorage?
// Kalau ada, pakai itu. Kalau tidak, pakai DEFAULT_STATE.
let savedData = localStorage.getItem('MrG_Project_Data');
let AppState = savedData ? JSON.parse(savedData) : JSON.parse(JSON.stringify(DEFAULT_STATE));

console.log("State Loaded:", AppState);

// 3. FUNGSI SAVE (PERSISTENCE)
// Panggil fungsi ini setiap kali ada update data penting.
function saveProject() {
    try {
        // Kita stringify AppState dan simpan ke LocalStorage browser
        localStorage.setItem('MrG_Project_Data', JSON.stringify(AppState));
        console.log("✅ Project Auto-Saved");
        
        // Update visual indikator (opsional, kalau ada elemennya)
        const statusInd = document.getElementById('status-indicator');
        if(statusInd) {
            const originalText = statusInd.innerHTML;
            statusInd.innerHTML = `<div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div><span>Saving...</span>`;
            setTimeout(() => {
                statusInd.innerHTML = `<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span>Saved</span>`;
            }, 800);
        }
    } catch (e) {
        console.error("Gagal menyimpan project:", e);
        alert("Memory Penuh! Gagal melakukan Auto-Save.");
    }
}

// 4. FUNGSI RESET (HAPUS DATA)
// Mengembalikan aplikasi ke kondisi awal (kosong).
function resetProject() {
    if (confirm("Yakin mau hapus semua data project? Tindakan ini tidak bisa dibatalkan.")) {
        // 1. Hapus dari storage
        localStorage.removeItem('MrG_Project_Data');
        
        // 2. Reset variable global ke default
        AppState = JSON.parse(JSON.stringify(DEFAULT_STATE));
        
        // 3. Reload halaman biar bersih total
        location.reload();
    }
}

// 5. HELPER: UPDATE SETTINGS
// Khusus buat nyimpen API Key dari modal settings
function updateSettings(polliKey, imgKey) {
    AppState.settings.pollinationsKey = polliKey.trim();
    AppState.settings.imgbbKey = imgKey.trim();
    saveProject(); // Langsung save
}

// 6. HELPER: GET MODEL CONFIG
// Buat ngambil config width/height berdasarkan ratio yang dipilih
function getDimensions(ratio) {
    if (ratio === "1:1") return { w: 1024, h: 1024 };
    if (ratio === "16:9") return { w: 1280, h: 720 };
    if (ratio === "9:16") return { w: 720, h: 1280 };
    return { w: 1024, h: 1024 }; // Fallback
}
