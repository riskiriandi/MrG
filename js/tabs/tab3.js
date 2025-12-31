/**
 * js/tabs/tab3.js
 * Logika Tab 3: Character Casting.
 * Menggabungkan Data Karakter (Tab 1) + Style (Tab 2) menjadi Gambar Visual.
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. AMBIL ELEMENT DOM
    const charGrid = document.getElementById('char-grid');
    const btnGenAll = document.getElementById('btn-generate-all-chars'); // Pastikan ID di HTML sesuai (btn-gen-all-chars atau btn-generate-all-chars)
    // Cek ID tombol di HTML lu, kalau beda sesuaikan. Di index.html yg gw kasih ID-nya: btn-generate-all-chars
    
    const btnNext = document.getElementById('btn-next-to-scenes');

    // Listener khusus saat Tab 3 dibuka (biar data selalu fresh)
    // Kita pakai MutationObserver atau event listener di tombol tab, 
    // tapi cara paling gampang: Pasang interval cek atau expose fungsi refresh.
    // Disini kita pakai cara simple: Tiap kali user klik tab 3, fungsi ini dipanggil via main.js (kalau ada hook),
    // tapi karena kita gak pake hook kompleks, kita pasang listener di tombol tab navigasi aja.
    
    const tab3Btn = document.querySelector('button[data-tab="3"]');
    if (tab3Btn) {
        tab3Btn.addEventListener('click', loadCharacters);
    }

    // Load juga saat pertama kali file ini jalan (kalau user refresh di tab 3)
    loadCharacters();

    // =================================================================
    // A. FUNGSI UTAMA: LOAD KARAKTER
    // =================================================================
    function loadCharacters() {
        const chars = AppState.story.characters;
        
        // 1. Cek apakah ada karakter?
        if (!chars || chars.length === 0) {
            charGrid.innerHTML = `
                <div class="col-span-full text-center py-20 text-gray-500 border border-dashed border-white/10 rounded-xl">
                    <i class="ph ph-users text-4xl mb-2 opacity-50"></i>
                    <p>Belum ada data karakter.</p>
                    <button onclick="window.switchTab(1)" class="text-accent hover:underline mt-2">
                        Buat cerita dulu di Tab 1
                    </button>
                </div>
            `;
            if(btnGenAll) btnGenAll.classList.add('hidden');
            return;
        }

        if(btnGenAll) btnGenAll.classList.remove('hidden');

        // 2. Render Kartu
        charGrid.innerHTML = ''; // Bersihkan grid
        
        chars.forEach((char, index) => {
            // Cek apakah sudah ada gambar tersimpan di state?
            const savedImage = AppState.characters.generatedImages[char.name];
            
            const card = document.createElement('div');
            card.className = 'glass-panel rounded-xl overflow-hidden flex flex-col relative group animate-fade-in';
            // Delay animasi biar muncul satu-satu cantik
            card.style.animationDelay = `${index * 100}ms`;

            card.innerHTML = `
                <!-- HEADER -->
                <div class="p-3 border-b border-white/10 flex justify-between items-center bg-black/20">
                    <h3 class="font-bold text-white text-sm truncate">${char.name}</h3>
                    <span class="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                        ${AppState.style.selectedModel || 'seedream'}
                    </span>
                </div>

                <!-- IMAGE AREA -->
                <div class="relative aspect-[2/3] bg-black/50 flex items-center justify-center overflow-hidden">
                    ${savedImage 
                        ? `<img src="${savedImage}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" id="img-${index}">`
                        : `<div id="placeholder-${index}" class="text-center p-4">
                                <i class="ph ph-user text-4xl text-gray-600 mb-2"></i>
                                <p class="text-[10px] text-gray-500">Belum digenerate</p>
                           </div>
                           <img id="img-${index}" class="hidden w-full h-full object-cover transition-transform duration-500 group-hover:scale-105">`
                    }
                    
                    <!-- Loading Overlay -->
                    <div id="loader-${index}" class="absolute inset-0 bg-black/80 flex flex-col items-center justify-center hidden z-20">
                        <i class="ph ph-spinner animate-spin text-accent text-2xl mb-2"></i>
                        <span class="text-[10px] text-gray-300">Generating...</span>
                    </div>
                </div>

                <!-- FOOTER ACTIONS -->
                <div class="p-3 border-t border-white/10 mt-auto">
                    <button id="btn-gen-${index}" class="w-full py-2 rounded-lg text-xs font-bold transition-all ${savedImage ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'btn-neon'}">
                        ${savedImage ? '<i class="ph ph-arrows-clockwise"></i> Regenerate' : '<i class="ph ph-lightning"></i> Generate'}
                    </button>
                </div>
            `;

            charGrid.appendChild(card);

            // Event Listener per Kartu
            document.getElementById(`btn-gen-${index}`).addEventListener('click', () => {
                generateSingleChar(char, index);
            });
        });
    }

    // =================================================================
    // B. LOGIC GENERATE (SINGLE)
    // =================================================================
    async function generateSingleChar(char, index) {
        const imgEl = document.getElementById(`img-${index}`);
        const placeholderEl = document.getElementById(`placeholder-${index}`);
        const loaderEl = document.getElementById(`loader-${index}`);
        const btnEl = document.getElementById(`btn-gen-${index}`);

        // 1. UI Loading State
        if(loaderEl) loaderEl.classList.remove('hidden');
        if(btnEl) btnEl.disabled = true;

        // 2. Siapkan Prompt (INJECTION LOGIC)
        // Gabungan: [Style Master] + [Deskripsi Karakter] + [Pose Fix]
        const stylePrompt = AppState.style.masterPrompt || "cinematic, detailed";
        const charPrompt = char.visual_desc; // Ini udah bahasa Inggris dari Tab 1
        
        // INI REQUEST LU: "berdiri tegak kek biasa tanpa pose aneh aneh"
        const poseInjection = "full body shot, standing straight, neutral pose, front view, character sheet design, plain neutral background, masterpiece, 8k";

        const finalPrompt = `${stylePrompt}, ${charPrompt}, ${poseInjection}`;

        // 3. Config Gambar
        const options = {
            width: 768,  // Portrait ratio buat karakter (biasanya lebih bagus 2:3)
            height: 1024,
            model: AppState.style.selectedModel || 'seedream',
            seed: Math.floor(Math.random() * 1000000) // Random seed tiap klik regenerate
        };

        console.log(`🎨 Generating ${char.name}...`, options);

        // 4. Generate URL (Instant)
        // Kita pake timestamp biar browser gak nge-cache gambar lama pas regenerate
        const imageUrl = generateImageURL(finalPrompt, options) + `&t=${Date.now()}`;

        // 5. Load Image
        imgEl.onload = () => {
            // Pas gambar udah keload
            if(loaderEl) loaderEl.classList.add('hidden');
            if(placeholderEl) placeholderEl.classList.add('hidden');
            imgEl.classList.remove('hidden');
            
            if(btnEl) {
                btnEl.disabled = false;
                btnEl.innerHTML = '<i class="ph ph-arrows-clockwise"></i> Regenerate';
                btnEl.classList.remove('btn-neon');
                btnEl.classList.add('bg-white/5', 'hover:bg-white/10', 'text-gray-300');
            }

            // SIMPAN URL KE STATE (PENTING BUAT TAB 4)
            AppState.characters.generatedImages[char.name] = imageUrl;
            saveProject();
        };

        imgEl.onerror = () => {
            if(loaderEl) loaderEl.classList.add('hidden');
            alert("Gagal memuat gambar. Coba ganti model atau cek koneksi.");
            if(btnEl) btnEl.disabled = false;
        };

        // Trigger Load
        imgEl.src = imageUrl;
    }

    // =================================================================
    // C. LOGIC GENERATE ALL
    // =================================================================
    if (btnGenAll) {
        btnGenAll.addEventListener('click', () => {
            const chars = AppState.story.characters;
            if (!chars || chars.length === 0) return;

            if(!confirm(`Generate ${chars.length} karakter sekaligus?`)) return;

            // Loop semua karakter dan trigger generate
            chars.forEach((char, index) => {
                // Kasih delay dikit biar gak nembak API barengan banget (opsional, tapi lebih aman)
                setTimeout(() => {
                    generateSingleChar(char, index);
                }, index * 500);
            });
        });
    }

    // =================================================================
    // D. NAVIGASI
    // =================================================================
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            // Validasi: Minimal 1 karakter udah digenerate
            const generatedCount = Object.keys(AppState.characters.generatedImages).length;
            if (generatedCount === 0) {
                alert("Generate minimal satu karakter dulu bro sebelum lanjut ke Scene!");
                return;
            }
            window.switchTab(4);
        });
    }
});
