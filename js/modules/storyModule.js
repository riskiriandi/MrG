// js/modules/storyModule.js

// Init function dipanggil dari main.js pas ganti tab
window.initStoryModule = () => {
    const story = window.appState.project.story;
    if(document.getElementById('story-input')) {
        document.getElementById('story-input').value = story.rawIdea;
        updateDialogUI(story.useDialog);
        
        if(story.synopsis) {
            document.getElementById('story-result').classList.remove('hidden');
            document.getElementById('final-story-text').innerHTML = `
                <h3 class="text-xl font-bold text-accent mb-4">${story.title}</h3>
                <div class="whitespace-pre-wrap">${story.synopsis}</div>
            `;
            renderExtractedChars();
        }
    }
};

// Toggle Dialog
window.toggleDialogMode = () => {
    const current = window.appState.project.story.useDialog;
    window.appState.project.story.useDialog = !current;
    updateDialogUI(!current);
};

function updateDialogUI(isOn) {
    const btn = document.getElementById('toggle-dialog');
    const circle = document.getElementById('toggle-circle');
    const status = document.getElementById('dialog-status');
    
    if(btn && circle && status) {
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
}

// === LOGIC API ASLI (BUKAN TEMPLATE 2077) ===
window.generateStory = async () => {
    console.log("🚀 MEMULAI PROSES GENERATE STORY..."); // Cek Console Browser

    const input = document.getElementById('story-input').value;
    if(!input) return showToast("Isi dulu ide ceritanya bro!", "error");

    const btn = document.querySelector('button[onclick="generateStory()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Menghubungi AI...`;
    btn.disabled = true;

    try {
        const useDialog = window.appState.project.story.useDialog;
        
        // 1. SIAPKAN DATA YANG DIKIRIM
        const prompt = `
            Task: Create a story based on: "${input}".
            Requirements:
            1. Title.
            2. Synopsis (2 paragraphs).
            3. Characters: Extract names and visual description (desc). If generic (e.g. "3 cats"), INVENT NAMES.
            4. 6 Scenes.
            
            Output JSON ONLY:
            {
                "title": "...",
                "synopsis": "...",
                "characters": [{"name": "...", "desc": "..."}],
                "scenes": ["..."]
            }
        `;

        console.log("📡 Mengirim Request ke Pollinations...");

        // 2. PANGGIL API (FETCH ASLI)
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a JSON generator.' },
                    { role: 'user', content: prompt }
                ],
                model: 'openai',
                json: true,
                seed: Math.floor(Math.random() * 10000)
            })
        });

        console.log("✅ Response diterima:", response.status);

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const text = await response.text();
        console.log("📄 Raw Data:", text); // Liat ini di console, ini bukti bukan template

        // 3. BERSIHKAN DATA
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanText);

        // 4. SIMPAN KE STATE
        window.appState.project.story.rawIdea = input;
        window.appState.project.story.title = data.title || "Untitled";
        window.appState.project.story.synopsis = data.synopsis || "";
        
        if (data.scenes) {
            window.appState.project.story.scripts = data.scenes.map((txt, i) => ({
                id: i+1, text: txt, img: null
            }));
        }

        if (data.characters) {
            window.appState.project.characters = data.characters.map(c => ({
                name: c.name, desc: c.desc, img: null, seed: null
            }));
        }

        // 5. TAMPILKAN HASIL
        document.getElementById('story-result').classList.remove('hidden');
        document.getElementById('final-story-text').innerHTML = `
            <h3 class="text-xl font-bold text-accent mb-4">${data.title}</h3>
            <div class="whitespace-pre-wrap">${data.synopsis}</div>
        `;
        renderExtractedChars();
        
        showToast("Naskah Original Berhasil Dibuat!", "success");

    } catch (error) {
        console.error("❌ ERROR:", error);
        showToast("Gagal: " + error.message, "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

function renderExtractedChars() {
    const list = document.getElementById('extracted-chars-list');
    const chars = window.appState.project.characters;
    if(!list) return;

    list.innerHTML = chars.map(c => `
        <div class="bg-white/5 border border-white/10 rounded-lg p-3 w-full md:w-48">
            <div class="flex items-center gap-2 mb-1">
                <div class="w-2 h-2 rounded-full bg-accent"></div>
                <span class="font-bold text-white text-sm truncate">${c.name}</span>
            </div>
            <p class="text-[10px] text-gray-400 line-clamp-3 mt-1">${c.desc}</p>
        </div>
    `).join('');
                }
