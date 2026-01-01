// js/modules/storyModule.js

window.initStoryModule = () => {
    const story = window.appState.project.story;
    if(document.getElementById('story-input')) {
        document.getElementById('story-input').value = story.rawIdea;
        updateDialogUI(story.useDialog);
        
        // Kalau data sudah ada, render ulang
        if(story.synopsis) {
            document.getElementById('story-result').classList.remove('hidden');
            document.getElementById('final-story-text').innerText = story.synopsis;
            renderExtractedChars();
        }
    }
};

// Toggle Dialog UI
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

// === LOGIC UTAMA YANG DIPERBAIKI ===
window.generateStory = async () => {
    const input = document.getElementById('story-input').value;
    if(!input) return showToast("Isi ide ceritanya dulu!", "error");

    const btn = document.querySelector('button[onclick="generateStory()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Membedah Cerita...`;
    btn.disabled = true;

    try {
        const useDialog = window.appState.project.story.useDialog;
        
        // PROMPT "GALAK" (FORCE JSON & DETAIL)
        const systemPrompt = `
            ROLE: Creative Director & Character Designer.
            TASK: Expand the user's rough idea into a structured movie script.
            
            CRITICAL INSTRUCTIONS:
            1. **INVENT NAMES**: If user says "3 cats", you MUST create 3 unique names (e.g., Zorg, Kiki, Rax). Do NOT use generic names like "Cat 1".
            2. **VISUAL DETAILS**: For every character, describe their face, fur/skin color, clothing, and accessories in 'desc'.
            3. **OUTPUT FORMAT**: You must output ONLY valid JSON. Do not write introduction text.
            
            JSON STRUCTURE REQUIRED:
            {
                "title": "Creative Title",
                "synopsis": "A detailed summary of the plot (2 paragraphs).",
                "characters": [
                    { 
                        "name": "Name (e.g., Zorg)", 
                        "desc": "Detailed visual prompt: Anthropomorphic cat, orange tabby fur, cybernetic left eye, wearing leather biker jacket, scar on nose." 
                    }
                ],
                "scenes": [
                    "Scene 1: [Location] - Action description...",
                    "Scene 2: [Location] - Action description..."
                ]
            }

            MODE: ${useDialog ? "Script with Dialogues" : "Descriptive Narrative"}
        `;

        // Request ke Pollinations
        const res = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Ide Kasar: ${input}` }
                ],
                model: 'openai', // OpenAI paling nurut soal JSON
                json: true,
                seed: Math.floor(Math.random() * 1000) // Biar gak bosenin
            })
        });

        const textResult = await res.text();
        console.log("Raw AI Response:", textResult); // Cek console kalau error lagi

        // PEMBERSIH JSON (Kadang AI ngasih markdown ```json ... ```)
        let cleanJson = textResult.replace(/```json/g, '').replace(/```/g, '').trim();
        
        let data;
        try {
            data = JSON.parse(cleanJson);
        } catch (e) {
            console.error("JSON Parse Error. Raw text:", cleanJson);
            throw new Error("AI gagal membuat struktur data. Coba lagi.");
        }

        // VALIDASI DATA (Pastikan ada characters)
        if (!data.characters || data.characters.length === 0) {
            throw new Error("AI tidak mendeteksi karakter. Coba perjelas input.");
        }

        // SIMPAN KE STATE
        window.appState.project.story.rawIdea = input;
        window.appState.project.story.title = data.title;
        window.appState.project.story.synopsis = data.synopsis;
        
        // Map Scenes
        window.appState.project.story.scripts = data.scenes.map((text, i) => ({
            id: i+1, text: text, img: null
        }));
        
        // Map Characters (Hanya update, jangan reset gambar yg udah ada kalau namanya sama)
        const newChars = data.characters.map(c => ({
            name: c.name,
            desc: c.desc,
            img: null, 
            seed: null
        }));
        window.appState.project.characters = newChars;

        // UPDATE UI
        document.getElementById('story-result').classList.remove('hidden');
        
        // Tampilkan Sinopsis
        document.getElementById('final-story-text').innerHTML = `
            <h3 class="text-xl font-bold text-accent mb-2">${data.title}</h3>
            <p>${data.synopsis}</p>
        `;
        
        // Tampilkan Badge Karakter
        renderExtractedChars();
        
        showToast(`Berhasil! Ditemukan ${data.characters.length} Karakter.`, "success");

    } catch (e) {
        console.error(e);
        showToast(e.message, "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
};

// Render List Karakter di Tab 1 (Biar lu tau AI dapet siapa aja)
function renderExtractedChars() {
    const list = document.getElementById('extracted-chars-list');
    const chars = window.appState.project.characters;
    
    if(!list) return;

    list.innerHTML = chars.map(c => `
        <div class="flex flex-col bg-white/5 border border-white/10 rounded-lg p-3 max-w-[150px]">
            <span class="font-bold text-accent text-xs truncate">${c.name}</span>
            <span class="text-[10px] text-gray-400 line-clamp-3 leading-tight mt-1">${c.desc}</span>
        </div>
    `).join('');
        }
