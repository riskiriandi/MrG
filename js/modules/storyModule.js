// js/modules/storyModule.js

window.initStoryModule = () => {
    const story = window.appState.project.story;
    
    // 1. RE-POPULATE DATA (Biar gak hilang pas balik tab)
    const inputField = document.getElementById('story-input');
    if(inputField) {
        inputField.value = story.rawIdea || "";
        
        // AUTO-SAVE SAAT NGETIK (PENTING!)
        inputField.addEventListener('input', (e) => {
            window.appState.project.story.rawIdea = e.target.value;
        });
    }

    updateDialogUI(story.useDialog);
    
    // Render ulang hasil kalau sudah ada
    if(story.synopsis) {
        document.getElementById('story-result').classList.remove('hidden');
        document.getElementById('final-story-text').innerHTML = `
            <h3 class="text-xl font-bold text-accent mb-4">${story.title}</h3>
            <div class="whitespace-pre-wrap">${story.synopsis}</div>
        `;
        renderExtractedChars();
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

window.generateStory = async () => {
    const input = document.getElementById('story-input').value;
    if(!input) return showToast("Isi dulu ide ceritanya bro!", "error");

    const btn = document.querySelector('button[onclick="generateStory()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Meracik Cerita...`;
    btn.disabled = true;

    try {
        const useDialog = window.appState.project.story.useDialog;
        
        // === PROMPT CANGGIH (INDO STORY + ENGLISH VISUAL) ===
        const prompt = `
            ROLE: Expert Screenwriter & Character Designer.
            INPUT: "${input}"
            
            TASK:
            1. Write a Title (Indonesian).
            2. Write a Synopsis (Indonesian, 2 paragraphs).
            3. Extract Characters with VISUAL DESCRIPTIONS IN ENGLISH.
            4. Create 6 Scenes (Indonesian).

            CRITICAL RULES FOR CHARACTERS:
            - **LANGUAGE**: Description ('desc') MUST be in ENGLISH (for Image Generator compatibility).
            - **NON-HUMAN LOGIC**: If input says "Humanoid [Animal]", describe as "Anthropomorphic [Animal], standing on two legs, human-like proportions".
            - **DETAIL**: Focus on physical traits (clothing, fur color, body type, face). NO abstract personality traits like "mata cekatan". Use literal descriptions like "sharp eyes, athletic build".
            - **NAMING**: If generic (e.g. "3 kucing"), INVENT unique names.

            OUTPUT FORMAT (JSON ONLY):
            {
                "title": "Judul Indonesia",
                "synopsis": "Sinopsis Indonesia...",
                "characters": [
                    { "name": "Name", "desc": "Anthropomorphic cat, orange fur, wearing leather jacket, full body standing pose..." }
                ],
                "scenes": ["Scene 1...", "Scene 2..."]
            }
        `;

        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a JSON generator. Output strictly JSON.' },
                    { role: 'user', content: prompt }
                ],
                model: 'openai', // OpenAI paling nurut soal instruksi bahasa campuran
                json: true,
                seed: Math.floor(Math.random() * 10000)
            })
        });

        if (!response.ok) throw new Error("API Error");
        const text = await response.text();
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanText);

        // SIMPAN KE STATE
        window.appState.project.story.rawIdea = input;
        window.appState.project.story.title = data.title;
        window.appState.project.story.synopsis = data.synopsis;
        
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

        // RENDER
        document.getElementById('story-result').classList.remove('hidden');
        document.getElementById('final-story-text').innerHTML = `
            <h3 class="text-xl font-bold text-accent mb-4">${data.title}</h3>
            <div class="whitespace-pre-wrap">${data.synopsis}</div>
        `;
        renderExtractedChars();
        showToast("Naskah & Karakter Siap!", "success");

    } catch (error) {
        console.error(error);
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
            <!-- Tampilkan Deskripsi Inggris biar user bisa cek -->
            <p class="text-[10px] text-gray-400 line-clamp-3 mt-1 italic">"${c.desc}"</p>
        </div>
    `).join('');
            }
