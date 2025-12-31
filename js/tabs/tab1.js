/**
 * js/tabs/tab1.js
 * Logika Tab 1: Story Generation.
 * VERSI FIX: Prompt 3D Pixar & Error Handling yang Kuat.
 */

document.addEventListener('DOMContentLoaded', () => {
    const btnToggle = document.getElementById('toggle-dialog');
    const statusText = document.getElementById('dialog-status-text');
    const storyInput = document.getElementById('story-input');
    const btnGenerate = document.getElementById('btn-generate-story');
    
    const resultArea = document.getElementById('story-result-area');
    const finalStoryText = document.getElementById('final-story-text');
    const tagsList = document.getElementById('tags-list');
    const btnCopy = document.getElementById('btn-copy-story');
    const btnNext = document.getElementById('btn-next-to-style');

    createCharacterModal();

    // Load State
    if (AppState.story.rawIdea) storyInput.value = AppState.story.rawIdea;
    updateToggleVisual(AppState.story.isDialogMode);
    if (AppState.story.masterScript) showResult(AppState.story.masterScript, AppState.story.characters);

    // Toggle Logic
    if (btnToggle) {
        btnToggle.addEventListener('click', () => {
            AppState.story.isDialogMode = !AppState.story.isDialogMode;
            updateToggleVisual(AppState.story.isDialogMode);
            saveProject();
        });
    }

    function updateToggleVisual(isActive) {
        const circle = btnToggle.querySelector('div');
        if (isActive) {
            btnToggle.classList.replace('bg-gray-600', 'bg-accent');
            circle.classList.add('translate-x-5');
            statusText.innerText = "ON";
            statusText.classList.add('text-accent');
        } else {
            btnToggle.classList.replace('bg-accent', 'bg-gray-600');
            circle.classList.remove('translate-x-5');
            statusText.innerText = "OFF";
            statusText.classList.remove('text-accent');
        }
    }

    // Generate Logic
    if (btnGenerate) {
        btnGenerate.addEventListener('click', async () => {
            const idea = storyInput.value.trim();
            if (!idea) return alert("Tulis ide ceritanya dulu!");

            setLoading(true);

            try {
                AppState.story.rawIdea = idea;
                const dialogInstruction = AppState.story.isDialogMode ? "Include dialogues." : "Focus on narration.";

                // PROMPT 3D PIXAR
                const systemPrompt = `
You are a Character Designer for a 3D Animation Movie (Pixar Style).
Task: Convert idea into Master Script & Character Details.

INSTRUCTIONS:
1. **Story:** Write in **INDONESIAN**. ${dialogInstruction}
2. **Visuals (ENGLISH):** 
   - Style: 3D Render, Disney Pixar, Cute, Expressive.
   - Keywords: "3D render", "octane render", "volumetric lighting", "fluffy" (if animal).
   - If human-animal: Use **"Anthropomorphic [Animal]"**.

OUTPUT JSON ONLY:
{
  "title": "Judul",
  "story_text": "Cerita...",
  "characters": [
    {
      "name": "Nama",
      "visual_desc": "Anthropomorphic cat, 3D Disney Pixar style, fluffy white fur, chef apron, big eyes, soft lighting, 4k"
    }
  ]
}`;

                const messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Idea: ${idea}` }
                ];

                const resultJSON = await generateTextAI(messages, true);
                
                console.log("AI Result:", resultJSON);

                AppState.story.masterScript = resultJSON.story_text;
                AppState.story.characters = resultJSON.characters;
                AppState.story.lastGenerated = new Date().toISOString();
                
                saveProject();
                showResult(resultJSON.story_text, resultJSON.characters);

            } catch (error) {
                console.error(error);
                alert("Gagal generate: " + error.message);
            } finally {
                setLoading(false);
            }
        });
    }

    function showResult(text, chars) {
        resultArea.classList.remove('hidden');
        finalStoryText.innerText = text;
        tagsList.innerHTML = '';
        
        if (chars && chars.length > 0) {
            chars.forEach(char => {
                const tag = document.createElement('div');
                tag.className = 'w-full md:w-[48%] p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent/50 transition-all cursor-pointer group';
                tag.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-white text-lg">${char.name}</span>
                        <i class="ph ph-eye text-gray-400 group-hover:text-accent text-xl"></i>
                    </div>
                    <div class="text-xs text-gray-500 mt-2">Klik untuk lihat prompt...</div>
                `;
                tag.addEventListener('click', () => openCharacterModal(char));
                tagsList.appendChild(tag);
            });
        }
        btnNext.classList.remove('hidden');
    }

    function setLoading(isLoading) {
        if (isLoading) {
            btnGenerate.disabled = true;
            btnGenerate.innerHTML = '<i class="ph ph-spinner animate-spin"></i> Menulis...';
        } else {
            btnGenerate.disabled = false;
            btnGenerate.innerHTML = '<i class="ph ph-magic-wand"></i> Generate Story';
        }
    }

    // Modal Logic
    function createCharacterModal() {
        if (document.getElementById('char-detail-modal')) return;
        const html = `<div id="char-detail-modal" class="fixed inset-0 z-[110] hidden"><div class="absolute inset-0 bg-black/90 backdrop-blur-sm" id="char-modal-backdrop"></div><div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg glass-panel rounded-2xl p-6 shadow-2xl"><h3 id="modal-char-name" class="text-xl font-bold text-white mb-2"></h3><div class="bg-black/40 p-4 rounded-xl border border-white/5 mb-4"><p id="modal-char-desc" class="text-sm text-gray-300 font-mono"></p></div><div class="flex justify-end"><button id="btn-close-char-modal" class="px-4 py-2 rounded-lg bg-accent text-white font-bold text-xs">Tutup</button></div></div></div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        
        const close = () => document.getElementById('char-detail-modal').classList.add('hidden');
        document.getElementById('char-modal-backdrop').onclick = close;
        document.getElementById('btn-close-char-modal').onclick = close;
    }

    function openCharacterModal(char) {
        document.getElementById('modal-char-name').innerText = char.name;
        document.getElementById('modal-char-desc').innerText = char.visual_desc;
        document.getElementById('char-detail-modal').classList.remove('hidden');
    }

    if (btnCopy) btnCopy.onclick = () => navigator.clipboard.writeText(finalStoryText.innerText);
    if (btnNext) btnNext.onclick = () => window.switchTab(2);
});
