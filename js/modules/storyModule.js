// ============================================================
// MODULE TAB 1: STORY WRITER (BASE STYLE + UNIQUE DETAILS)
// ============================================================

window.initStoryModule = () => {
    const story = window.appState.project.story;
    
    // 1. Restore Input & Auto-save
    if(document.getElementById('story-input')) {
        document.getElementById('story-input').value = story.rawIdea || "";
        
        document.getElementById('story-input').addEventListener('input', (e) => {
            window.appState.project.story.rawIdea = e.target.value;
        });

        updateDialogUI(story.useDialog);
        
        // Render ulang kalau data sudah ada
        if(story.synopsis) {
            document.getElementById('story-result').classList.remove('hidden');
            renderStoryResult(story.title, story.synopsis, story.scripts);
            renderExtractedChars();
        }
    }
};

// 2. Toggle UI Logic
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

// 3. GENERATE STORY (CORE LOGIC)
window.generateStory = async () => {
    const input = document.getElementById('story-input').value;
    if(!input) return showToast("Isi ide ceritanya dulu bro!", "error");

    const btn = document.querySelector('button[onclick="generateStory()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Meracik Karakter & Cerita...`;
    btn.disabled = true;

    try {
        const useDialog = window.appState.project.story.useDialog;
        
        // === A. INSTRUKSI MODE (Script vs Novel) ===
        let modeInstruction = "";
        let sceneFormat = "";

        if (useDialog) {
            modeInstruction = `
                MODE: SCRIPT / SCREENPLAY FORMAT.
                - Use standard script format (CHARACTER NAME: "Dialogue").
                - Include action lines.
            `;
            sceneFormat = `Scene 1: [Location]\n(Action)\nJONO: "Dialog..."`;
        } else {
            modeInstruction = `
                MODE: NOVEL / NARRATIVE FORMAT.
                - DO NOT USE SCRIPT FORMAT.
                - Write in full descriptive paragraphs.
            `;
            sceneFormat = `Scene 1: [Location]\nJono menatap langit dengan cemas...`;
        }

        // === B. PROMPT UTAMA (BASE STYLE + UNIQUE DETAILS) ===
        const prompt = `
            ROLE: Creative Director & Character Designer.
            INPUT IDEA: "${input}"
            ${modeInstruction}
            
            TASK:
            1. Title (Indonesian).
            2. Synopsis (Indonesian, 1 paragraph).
            
            3. CHARACTERS (CRITICAL STEP):
               - Extract names. If generic, INVENT UNIQUE NAMES.
               - **VISUAL DESCRIPTION (English):**
                 - **MANDATORY BASE STYLE:** "Cute anthropomorphic cat, soft fur, big expressive eyes, wearing human clothes, standing upright, friendly appearance, Pixar style 3D render."
                 - **INSTRUCTION:** You MUST start with the Base Style above, BUT you must ADD unique physical details for each character so they look different.
                 - **Example Logic:**
                   * Char 1: "[Base Style], orange tabby fur, wearing a denim hiker jacket and backpack."
                   * Char 2: "[Base Style], black and white tuxedo fur, wearing a red scarf."
                   * Char 3: "[Base Style], calico fur, wearing a green hoodie."
            
            4. Scenes (Indonesian).
               - Create exactly ${input.toLowerCase().includes('scene') ? 'requested number of' : '3'} scenes.
               - Min. 150 words per scene.

            OUTPUT JSON ONLY:
            {
                "title": "...",
                "synopsis": "...",
                "characters": [
                    { "name": "Name", "desc": "Full visual prompt..." }
                ],
                "scenes": [
                    "${sceneFormat}"
                ]
            }
        `;

        // === C. API CALL ===
        const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a JSON generator. Output strictly JSON.' },
                    { role: 'user', content: prompt }
                ],
                model: 'openai', 
                json: true,
                seed: Math.floor(Math.random() * 10000)
            })
        });

        if (!response.ok) throw new Error("API Error");
        const text = await response.text();
        const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanText);

        // === D. SIMPAN STATE ===
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

        // === E. RENDER UI ===
        document.getElementById('story-result').classList.remove('hidden');
        renderStoryResult(data.title, data.synopsis, window.appState.project.story.scripts);
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

// Helper Render
function renderStoryResult(title, synopsis, scenes) {
    const container = document.getElementById('final-story-text');
    
    let scenesHtml = scenes.map(s => `
        <div class="mt-4 p-4 bg-white/5 rounded-xl border-l-2 border-accent/50">
            <strong class="text-accent text-xs uppercase tracking-wider block mb-2">Scene ${s.id}</strong>
            <div class="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed font-serif">${s.text}</div>
        </div>
    `).join('');

    container.innerHTML = `
        <h3 class="text-2xl font-bold text-white mb-3">${title}</h3>
        <div class="bg-black/20 p-4 rounded-xl mb-6 border border-white/5">
            <p class="text-gray-400 italic text-sm">${synopsis}</p>
        </div>
        <div class="space-y-4">
            ${scenesHtml}
        </div>
    `;
}

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
            <p class="text-[10px] text-gray-400 line-clamp-4 mt-1 italic leading-tight">"${c.desc}"</p>
        </div>
    `).join('');
                }
