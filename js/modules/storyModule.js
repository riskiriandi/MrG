// js/modules/storyModule.js

window.initStoryModule = () => {
    const story = window.appState.project.story;
    if(document.getElementById('story-input')) {
        document.getElementById('story-input').value = story.rawIdea;
        updateDialogUI(story.useDialog);
        
        // Render ulang kalau data ada
        if(story.synopsis) {
            document.getElementById('story-result').classList.remove('hidden');
            document.getElementById('final-story-text').innerText = story.synopsis;
            renderExtractedChars();
        }
    }
};

window.toggleDialogMode = () => {
    const current = window.appState.project.story.useDialog;
    window.appState.project.story.useDialog = !current;
    updateDialogUI(!current);
};

function updateDialogUI(isOn) {
    const btn = document.getElementById('toggle-dialog');
    const circle = document.getElementById('toggle-circle');
    const status = document.getElementById('dialog-status');
    
    if(isOn) {
        btn.classList.replace('bg-gray-600', 'bg-accent');
        circle.classList.replace('left-0.5', 'translate-x-5');
        status.innerText = "ON";
        status.classList.add('text-accent');
    } else {
        btn.classList.replace('bg-accent', 'bg-gray-600');
        circle.classList.remove('translate-x-5');
        circle.classList.add('left-0.5');
        status.innerText = "OFF";
        status.classList.remove('text-accent');
    }
}

// === LOGIC GENERATE YANG SESUAI DOKUMENTASI ===
window.generateStory = async () => {
    const input = document.getElementById('story-input').value;
    if(!input) return showToast("Isi dulu ide ceritanya bro!", "error");

    const btn = document.querySelector('button[onclick="generateStory()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Generating...`;
    btn.disabled = true;

    try {
        const useDialog = window.appState.project.story.useDialog;
        
        // 1. PROMPT SEDERHANA TAPI TEGAS
        // Kita minta JSON murni. Gak usah pake persona aneh-aneh.
        const prompt = `
            Task: Create a story based on: "${input}".
            
            Requirements:
            1. Create a Title.
            2. Write a Synopsis (2 paragraphs).
            3. Extract Characters: If the user says "3 cats", YOU MUST INVENT 3 NAMES (e.g., Tom, Jerry, Felix) and describe their visual appearance (fur color, clothes) in 'desc'.
            4. Create 6 Scenes.
            
            Output Format (JSON ONLY):
            {
                "title": "...",
                "synopsis": "...",
                "characters": [
                    {"name": "...", "desc": "..."}
                ],
                "scenes": ["Scene 1...", "Scene 2..."]
            }
        `;

        // 2. PANGGIL API (Sesuai Docs: POST /v1/chat/completions atau root text endpoint)
        // Kita pake endpoint text default Pollinations yang support JSON flag
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a helpful assistant that outputs strictly JSON.' },
                    { role: 'user', content: prompt }
                ],
                model: 'openai', // Model paling stabil buat JSON
                json: true,      // Flag wajib dari Pollinations biar output JSON
                seed: Math.floor(Math.random() * 1000)
            })
        });

        if (!response.ok) throw new Error("Gagal koneksi ke API Pollinations");

        const text = await response.text();
        console.log("Raw Output:", text); // Cek console buat debug

        // 3. PARSING (Pembersihan Markdown)
        // AI sering nambahin ```json di awal, kita hapus manual biar JSON.parse gak error
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let data;
        try {
            data = JSON.parse(cleanText);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            // Fallback darurat kalau JSON rusak: Tampilkan teks mentah di sinopsis
            data = {
                title: "Generated Story",
                synopsis: cleanText,
                characters: [],
                scenes: []
            };
            showToast("Format JSON rusak, tapi teks berhasil diambil.", "warning");
        }

        // 4. SIMPAN KE STATE
        window.appState.project.story.rawIdea = input;
        window.appState.project.story.title = data.title || "Untitled";
        window.appState.project.story.synopsis = data.synopsis || "";
        
        // Map Scenes
        if (data.scenes && Array.isArray(data.scenes)) {
            window.appState.project.story.scripts = data.scenes.map((txt, i) => ({
                id: i+1, text: txt, img: null
            }));
        }

        // Map Characters (Penting!)
        if (data.characters && Array.isArray(data.characters)) {
            window.appState.project.characters = data.characters.map(c => ({
                name: c.name || "Unknown",
                desc: c.desc || "No description",
                img: null,
                seed: null
            }));
        }

        // 5. RENDER UI
        document.getElementById('story-result').classList.remove('hidden');
        
        // Render Teks
        const finalDiv = document.getElementById('final-story-text');
        finalDiv.innerHTML = `
            <h3 class="text-xl font-bold text-accent mb-4">${data.title}</h3>
            <div class="whitespace-pre-wrap">${data.synopsis}</div>
        `;

        // Render Karakter
        renderExtractedChars();

        if(data.characters.length > 0) {
            showToast(`Berhasil! ${data.characters.length} Karakter dibuat.`, "success");
        } else {
            showToast("Cerita jadi, tapi karakter tidak terdeteksi otomatis.", "warning");
        }

    } catch (error) {
        console.error(error);
        showToast("Error: " + error.message, "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// Render List Karakter (Kotak-kotak kecil di bawah cerita)
function renderExtractedChars() {
    const list = document.getElementById('extracted-chars-list');
    const chars = window.appState.project.characters;
    
    if(!list) return;

    if (chars.length === 0) {
        list.innerHTML = `<span class="text-xs text-gray-500 italic">Tidak ada karakter spesifik.</span>`;
        return;
    }

    list.innerHTML = chars.map(c => `
        <div class="bg-white/5 border border-white/10 rounded-lg p-3 w-full md:w-48">
            <div class="flex items-center gap-2 mb-1">
                <div class="w-2 h-2 rounded-full bg-accent"></div>
                <span class="font-bold text-white text-sm truncate">${c.name}</span>
            </div>
            <p class="text-[10px] text-gray-400 line-clamp-3 leading-relaxed border-t border-white/5 pt-1 mt-1">
                ${c.desc}
            </p>
        </div>
    `).join('');
                                 }
