/**
 * js/state.js
 * Bertugas menangani State Management & LocalStorage Persistence.
 * File ini adalah "Otak Memori" aplikasi.
 * 
 * UPDATE TERBARU:
 * - Fix Logic Reset Project (API Key dijamin aman 100%).
 * - Struktur Data Lengkap.
 */

// =================================================================
// 1. DEFINISI STATE DEFAULT (KOSONG)
// =================================================================
// Ini adalah template data kosong. Dipakai saat pertama kali buka
// atau saat user melakukan Reset Project.
const DEFAULT_STATE = {
    // --- TAB 1: STORY (Cerita) ---
    story: {
        rawIdea: "",            // Input ide kasar user
        isDialogMode: false,    // Toggle Dialog Mode (On/Off)
        masterScript: "",       // Hasil generate cerita (Teks/JSON)
        characters: [],         // List karakter hasil ekstraksi (Array of Objects)
        lastGenerated: null     // Timestamp terakhir generate
    },

    // --- TAB 2: STYLE (Visual) ---
    style: {
        referenceImageUrl: "",  // URL gambar dari ImgBB (String)
        referenceImageFile: null, // File object (Runtime only, tidak disave ke storage)
        masterPrompt: "",       // Prompt gaya visual hasil analisa AI
        aspectRatio: "16:9",    // Default ratio
        width: 1280,            // Default width (16:9)
        height: 720,            // Default height (16:9)
        selectedModel: "seedream" // Pilihan: seedream, seedream-pro, nanobanana
    },

    // --- TAB 3: CHARACTERS (Casting) ---
    characters: {
        // Menyimpan URL hasil generate per karakter
        // Format key-value: { "Nama Karakter": "URL_GAMBAR_POLLINATIONS" }
        generatedImages: {} 
    },

    // --- TAB 4: SCENES (Storyboard) ---
    scenes: {
        count: 6,               // Target jumlah scene
        data: []                // Array of Objects: { id, description, visualPrompt, lighting, imageUrl }
    },

    // --- TAB 5: VIDEO (Production) ---
    video: {
        generatedVideos: {}     // Format: { sceneId: "URL_VIDEO" }
    },

    // --- GLOBAL SETTINGS (Konfigurasi) ---
    settings: {
        pollinationsKey: "",    // API Key Pollinations (Optional)
        imgbbKey: ""            // API Key ImgBB (Wajib buat Tab 2)
    }
};

// =================================================================
// 2. INISIALISASI STATE (LOAD DATA)
// =================================================================
// Cek apakah ada data tersimpan di LocalStorage browser?
let savedData = localStorage.getItem('MrG_Project_Data');

// Kalau ada, pakai data itu (JSON.parse).
// Kalau tidak ada, pakai DEFAULT_STATE (JSON.parse(JSON.stringify) biar deep copy).
let AppState = savedData ? JSON.parse(savedData) : JSON.parse(JSON.stringify(DEFAULT_STATE));

console.log("✅ State Loaded:", AppState);

// =================================================================
// 3. FUNGSI SAVE (PERSISTENCE)
// =================================================================
// Panggil fungsi ini setiap kali ada update data penting.
function saveProject() {
    try {
        // Kita stringify AppState dan simpan ke LocalStorage browser
        localStorage.setItem('MrG_Project_Data', JSON.stringify(AppState));
        console.log("💾 Project Auto-Saved");
        
        // Update visual indikator di Header (jika elemennya ada)
        const statusInd = document.getElementById('status-indicator');
        if(statusInd) {
            // Cek kelengkapan API Key
            if (!AppState.settings.imgbbKey) {
                statusInd.innerHTML = `<div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div><span class="text-red-400">Setup Required</span>`;
            } else {
                // Efek visual "Saving..." lalu balik ke "Ready"
                statusInd.innerHTML = `<div class="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div><span>Saving...</span>`;
                setTimeout(() => {
                    statusInd.innerHTML = `<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span>System Ready</span>`;
                }, 800);
            }
        }
    } catch (e) {
        console.error("❌ Gagal menyimpan project:", e);
        alert("Peringatan: Memory Browser Penuh! Data mungkin tidak tersimpan.");
    }
}

// =================================================================
// 4. FUNGSI RESET (HAPUS DATA - AMAN)
// =================================================================
// Mengembalikan aplikasi ke kondisi awal TAPI mempertahankan API Key.
function resetProject() {
    if (confirm("⚠️ PERINGATAN: Yakin mau hapus semua data cerita & gambar?\n\n(Tenang, API Key tidak akan dihapus)")) {
        
        console.log("🔄 Resetting Project...");

        // A. AMANKAN API KEY DULU KE VARIABEL SEMENTARA
        // Kita ambil value string-nya langsung biar gak kena reference link
        const savedPolliKey = AppState.settings.pollinationsKey;
        const savedImgbbKey = AppState.settings.imgbbKey;
        
        // B. TIMPA APPSTATE DENGAN DEFAULT STATE YANG BERSIH
        // Kita clone ulang DEFAULT_STATE biar bener-bener fresh
        AppState = JSON.parse(JSON.stringify(DEFAULT_STATE));
        
        // C. KEMBALIKAN API KEY KE STATE BARU
        AppState.settings.pollinationsKey = savedPolliKey;
        AppState.settings.imgbbKey = savedImgbbKey;
        
        // D. PAKSA SIMPAN KE LOCALSTORAGE SEKARANG JUGA
        // Ini langkah krusial biar pas reload, browser baca data yang ini
        localStorage.setItem('MrG_Project_Data', JSON.stringify(AppState));
        
        console.log("✅ Reset Complete. Reloading...");

        // E. RELOAD HALAMAN
        location.reload();
    }
}

// =================================================================
// 5. HELPER FUNCTIONS
// =================================================================

// Update Settings dari Modal
function updateSettings(polliKey, imgKey) {
    AppState.settings.pollinationsKey = polliKey.trim();
    AppState.settings.imgbbKey = imgKey.trim();
    saveProject(); // Langsung save
    
    // Trigger re-check status UI
    const statusInd = document.getElementById('status-indicator');
    if(statusInd && AppState.settings.imgbbKey) {
        statusInd.innerHTML = `<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span>System Ready</span>`;
        const btnGear = document.getElementById('btn-open-settings');
        if(btnGear) btnGear.classList.remove('border-red-500', 'text-red-400');
    }
}

// Get Model Dimensions (Helper buat Tab 2 & 4)
function getDimensions(ratio) {
    if (ratio === "1:1") return { w: 1024, h: 1024 };
    if (ratio === "16:9") return { w: 1280, h: 720 };
    if (ratio === "9:16") return { w: 720, h: 1280 };
    // Fallback default
    return { w: 1024, h: 1024 };
}
