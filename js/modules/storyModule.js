// js/modules/storyModule.js

window.initStoryModule = () => {
    // Load data lama
    const story = window.appState.project.story;
    if(document.getElementById('story-input')) {
        document.getElementById('story-input').value = story.rawIdea;
        updateDialogUI(story.useDialog);
        
        // Kalau udah ada hasil, tampilin
        if(story.synopsis) {
            document.getElementById('story-result').classList.remove('hidden');
            document.getElementById('final-story-text').innerText = story.synopsis;
            renderExtractedChars();
        }
    }
};

// 1. Toggle Dialog
window.toggleDialogMode = () => {
    const current = window.appState.project.story.useDialog;
    const newState = !current;
    window.appState.project.story.useDialog = newState;
    updateDialogUI(newState);
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

// 2. Generate Story (JSON Strict)
window.generateStory = async () => {
    const input = document.getElementById('story-input').value;
    if(!input) return showToast("Isi ide ceritanya dulu!", "error");

    const btn = document.querySelector('button[onclick="generateStory()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Thinking...`;
    btn.disabled = true;

    try {
        const useDialog = window.appState.project.story.useDialog;
        
        // Prompt Jahat (Strict JSON)
        const systemPrompt = `
            You are a Professional Screenwriter.
            Convert the user's idea into a structured JSON format.
            
            RULES:
            1. Output MUST be valid JSON. No markdown, no explanation.
            2. Extract ONLY named characters.
            3. For non-human characters (e.g., aliens, robots, animals), provide EXTREME visual detail in 'desc'.
            4. Create exactly 6 key scenes.
            
            JSON FORMAT:
            {
                "title": "String",
                "synopsis": "String (Long paragraph)",
                "characters": [
                    { "name": "Name", "desc": "Visual description (Face, Clothes, Body type)" }
                ],
                "scenes": [
                    "Scene 1 text...", "Scene 2 text..."
                ]
            }

            MODE: ${useDialog ? "Include Dialogues" : "Descriptive Narration Only"}
        `;

        // Panggil API Chat (Pollinations)
        const res = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: input }
                ],
                model: 'openai',
                json: true // Force JSON mode
            })
        });

        const textResult = await res.text();
        
        // Parsing JSON (Kadang AI ngasih markdown ```json, jadi kita bersihin)
        const cleanJson = textResult.replace(/```json|```/g, '').trim();
        const data = JSON.parse(cleanJson);

        // Simpan ke State
        window.appState.project.story.rawIdea = input;
        window.appState.project.story.title = data.title;
        window.appState.project.story.synopsis = data.synopsis;
        window.appState.project.story.scripts = data.scenes.map((text, i) => ({
            id: i+1, text: text, img: null
        }));
        
        // Update Characters (Hanya timpa kalau kosong, biar gak ngereset gambar yg udah digenerate)
        if(window.appState.project.characters.length === 0) {
            window.appState.project.characters = data.characters.map(c => ({
                ...c, img: null, seed: null
            }));
        }

        // Update UI
        document.getElementById('story-result').classList.remove('hidden');
        document.getElementById('final-story-text').innerText = data.synopsis;
        renderExtractedChars();
        
        showToast("Naskah berhasil dibuat!", "success");

    } catch (e) {
        console.error(e);
        showToast("Gagal generate cerita. Coba lagi.", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

function renderExtractedChars() {
    const list = document.getElementById('extracted-chars-list');
    const chars = window.appState.project.characters;
    
    list.innerHTML = chars.map(c => `
        <span class="px-3 py-1 rounded-full bg-accent/20 border border-accent/30 text-xs text-white">
            ${c.name}
        </span>
    `).join('');
        }
