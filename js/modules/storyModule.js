// ============================================================
// MODULE TAB 1: STORY WRITER (VIP ENDPOINT & MULTI-MODEL)
// ============================================================

window.initStoryModule = () => {
    const story = window.appState.project.story;
    
    if(document.getElementById('story-input')) {
        document.getElementById('story-input').value = story.rawIdea || "";
        
        document.getElementById('story-input').addEventListener('input', (e) => {
            window.appState.project.story.rawIdea = e.target.value;
        });

        updateDialogUI(story.useDialog);
        
        if(story.synopsis) {
            document.getElementById('story-result').classList.remove('hidden');
            renderStoryResult(story.title, story.synopsis, story.scripts);
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

// === GENERATE STORY (NEW API LOGIC) ===
window.generateStory = async () => {
    const input = document.getElementById('story-input').value;
    const modelSelect = document.getElementById('story-model-select');
    const selectedModel = modelSelect ? modelSelect.value : 'openai'; // Default OpenAI

    if(!input) return showToast("Isi ide ceritanya dulu bro!", "error");

    // Cek API Key (Wajib buat endpoint ini)
    const apiKey = window.appState.config.pollinationsKey;
    if(!apiKey) {
        return showToast("Wajib isi API Key di Settings buat pake model ini!", "error");
    }

    const btn = document.querySelector('button[onclick="generateStory()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Menulis (${selectedModel})...`;
    btn.disabled = true;

    try {
        const useDialog = window.appState.project.story.useDialog;
        
        // === A. INSTRUKSI MODE ===
        let modeInstruction = "";
        if (useDialog) {
            modeInstruction = `
                - FORMAT: Naskah Film (Script).
                - Gunakan format: NAMA KARAKTER: "Dialog..."
                - Sertakan deskripsi aksi di antara dialog.
                - Buat percakapan yang hidup, lucu, atau emosional.
            `;
        } else {
            modeInstruction = `
                - FORMAT: Cerita Novel (Narasi).
                - JANGAN gunakan format script.
                - Gunakan paragraf deskriptif yang indah dan mengalir.
                - Fokus pada suasana, perasaan, dan detail visual.
            `;
        }

        // === B. PROMPT UTAMA ===
        const prompt = `
            ROLE: World-Class Animation Storyteller (Pixar/Ghibli Style).
            GOAL: Turn the user's idea into a Masterpiece Story and Character Design.
            
            INPUT IDEA: "${input}"
            
            INSTRUCTIONS:
            
            1. STORYTELLING (INDONESIAN):
               ${modeInstruction}
               - LANGUAGE: Bahasa Indonesia yang luwes, tidak kaku, dan enak dibaca.
               - LENGTH: Create exactly ${input.toLowerCase().includes('scene') ? 'requested number of' : '3'} scenes. Min 150 words per scene.
            
            2. CHARACTER DESIGN (ENGLISH VISUALS):
               - STYLE KEYWORDS: 3D Render, Disney Pixar style, Octane Render, 8k, Cute, Expressive, Soft Lighting.
               - LOGIC:
                 * If input implies HUMAN -> Create a Stylized 3D Human (Pixar style).
                 * If input implies ANIMAL -> Create an Anthropomorphic Animal (standing, clothes) but keep it CUTE/COOL.
                 * If input implies ROBOT/ALIEN -> Create a Stylized 3D version.
               - **IMPORTANT:** Do NOT force "Cat" if the user asks for something else. Follow the input!
               - DETAIL: Describe clothing, fur/skin color, accessories, and body type uniquely for each character.

            OUTPUT JSON ONLY:
            {
                "title": "Judul Kreatif (Indo)",
                "synopsis": "Sinopsis Menarik (Indo)",
                "characters": [
                    { "name": "Name", "desc": "Full visual prompt in English..." }
                ],
                "scenes": [
                    "Scene 1 text...",
                    "Scene 2 text..."
                ]
            }
        `;

        // === C. API CALL (ENDPOINT BARU) ===
        // Endpoint: https://gen.pollinations.ai/v1/chat/completions
        const response = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}` // Header Wajib
            },
            body: JSON.stringify({
                model: selectedModel, // openai, claude, atau gemini
                messages: [
                    { role: 'system', content: 'You are a creative JSON generator. Output strictly JSON.' },
                    { role: 'user', content: prompt }
                ]
                // Note: Endpoint ini gak butuh 'json: true' di body, tapi di prompt udah kita tegasin.
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`API Error ${response.status}: ${errText}`);
        }

        const result = await response.json();
        
        // === D. PARSING RESPONSE (FORMAT BARU) ===
        // Datanya ada di result.choices[0].message.content
        const rawContent = result.choices[0].message.content;
        console.log("Raw AI Output:", rawContent);

        const cleanText = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanText);

        // === E. SIMPAN STATE ===
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

        // === F. RENDER UI ===
        document.getElementById('story-result').classList.remove('hidden');
        renderStoryResult(data.title, data.synopsis, window.appState.project.story.scripts);
        renderExtractedChars();
        
        showToast(`Naskah Berhasil (${selectedModel})!`, "success");

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
