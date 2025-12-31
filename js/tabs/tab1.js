/**
 * js/tabs/tab1.js
 * Logika Tab 1: Story Generation & Character Extraction.
 * UPDATE: 
 * 1. Force English Translation untuk Visual Prompt.
 * 2. UI Karakter menggunakan Modal Popup (biar gak kepotong di HP).
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. AMBIL ELEMENT DOM
    const btnToggle = document.getElementById('toggle-dialog');
    const statusText = document.getElementById('dialog-status-text');
    const storyInput = document.getElementById('story-input');
    const btnGenerate = document.getElementById('btn-generate-story');
    
    // Area Hasil
    const resultArea = document.getElementById('story-result-area');
    const finalStoryText = document.getElementById('final-story-text');
    const tagsList = document.getElementById('tags-list');
    const btnCopy = document.getElementById('btn-copy-story');
    const btnNext = document.getElementById('btn-next-to-style');

    // Inject Modal Karakter ke Body (Dynamic)
    createCharacterModal();

    // 2. LOAD DATA DARI STATE
    if (AppState.story.rawIdea) {
        storyInput.value = AppState.story.rawIdea;
    }
    updateToggleVisual(AppState.story.isDialogMode);

    if (AppState.story.masterScript) {
        showResult(AppState.story.masterScript, AppState.story.characters);
    }

    // 3. LOGIC TOGGLE DIALOG
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
            btnToggle.classList.remove('bg-gray-600');
            btnToggle.classList.add('bg-accent');
            circle.classList.add('translate-x-5');
            statusText.innerText = "ON";
            statusText.classList.add('text-accent');
        } else {
            btnToggle.classList.remove('bg-accent');
            btnToggle.classList.add('bg-gray-600');
            circle.classList.remove('translate-x-5');
            statusText.innerText = "OFF";
            statusText.classList.remove('text-accent');
        }
    }

    // 4. LOGIC GENERATE STORY
    if (btnGenerate) {
        btnGenerate.addEventListener('click', async () => {
            const idea = storyInput.value.trim();
            
            if (!idea) {
                alert("Tulis dulu ide ceritanya, bro!");
                return;
            }

            setLoading(true);

            try {
                AppState.story.rawIdea = idea;

                const dialogInstruction = AppState.story.isDialogMode 
                    ? "Include engaging dialogues." 
                    : "Focus on narration, minimize dialogue.";

                // GANTI BAGIAN INI DI js/tabs/tab1.js
                const systemPrompt = `
You are a professional Character Designer for a 3D Animation Movie (Pixar/Disney Style).
Task: Convert the user's idea into a Master Script and extract character details.

INSTRUCTIONS:
1. **Story:** Write in **INDONESIAN**. ${dialogInstruction}
2. **Visual Description (CRITICAL):**
   - MUST be in **ENGLISH**.
   - **STYLE:** 3D Render, Disney Pixar Style, Cute, Expressive.
   - **KEYWORDS:** "3D render", "octane render", "volumetric lighting", "fluffy fur" (if animal), "bright colors".
   - **AVOID:** "Hyperrealistic", "Dark", "Gritty", "Sketch".
   - If human-animal hybrid: Use **"Anthropomorphic [Animal]"**. Describe the fur texture clearly.

OUTPUT JSON:
{
  "title": "Judul",
  "story_text": "Cerita...",
  "characters": [
    {
      "name": "Nama",
      "visual_desc": "Anthropomorphic cat, 3D Disney Pixar style, fluffy white fur, wearing chef apron, big expressive eyes, soft studio lighting, 4k 3D render"
    }
  ]
}
`;

                const messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Ide Cerita: ${idea}` }
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
                alert("Gagal generate cerita: " + error.message);
            } finally {
                setLoading(false);
            }
        });
    }

    // 5. HELPER FUNCTIONS
    function showResult(text, chars) {
        resultArea.classList.remove('hidden');
        finalStoryText.innerText = text;

        tagsList.innerHTML = '';
        if (chars && chars.length > 0) {
            chars.forEach(char => {
                // Buat Kartu Karakter (Versi Klik)
                const tag = document.createElement('div');
                tag.className = 'w-full md:w-[48%] p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent/50 transition-all cursor-pointer group';
                tag.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-white text-lg">${char.name}</span>
                        <i class="ph ph-eye text-gray-400 group-hover:text-accent text-xl"></i>
                    </div>
                    <div class="text-xs text-gray-500 mt-2">
                        Klik untuk lihat detail prompt visual...
                    </div>
                `;
                
                // Event Klik buat Buka Modal
                tag.addEventListener('click', () => {
                    openCharacterModal(char);
                });

                tagsList.appendChild(tag);
            });
        } else {
            tagsList.innerHTML = '<span class="text-xs text-gray-500">Tidak ada karakter spesifik terdeteksi.</span>';
        }

        btnNext.classList.remove('hidden');
    }

    function setLoading(isLoading) {
        if (isLoading) {
            btnGenerate.disabled = true;
            btnGenerate.innerHTML = '<i class="ph ph-spinner animate-spin text-lg"></i> <span>Sedang Menulis...</span>';
            storyInput.disabled = true;
        } else {
            btnGenerate.disabled = false;
            btnGenerate.innerHTML = '<i class="ph ph-magic-wand text-lg"></i> <span>Generate Story & Characters</span>';
            storyInput.disabled = false;
        }
    }

    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            navigator.clipboard.writeText(finalStoryText.innerText);
            const originalIcon = btnCopy.innerHTML;
            btnCopy.innerHTML = '<i class="ph ph-check"></i> Copied';
            setTimeout(() => btnCopy.innerHTML = originalIcon, 2000);
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            window.switchTab(2);
        });
    }

    // ==========================================
    // 6. LOGIC MODAL KARAKTER (DYNAMIC)
    // ==========================================
    function createCharacterModal() {
        // Cek kalo udah ada, gak usah bikin lagi
        if (document.getElementById('char-detail-modal')) return;

        const modalHTML = `
        <div id="char-detail-modal" class="fixed inset-0 z-[110] hidden">
            <div class="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity" id="char-modal-backdrop"></div>
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-lg glass-panel rounded-2xl p-6 shadow-2xl transform transition-all scale-100">
                <div class="flex justify-between items-start mb-4 border-b border-white/10 pb-3">
                    <div>
                        <h3 id="modal-char-name" class="text-xl font-bold text-white">Nama Karakter</h3>
                        <p class="text-[10px] text-accent uppercase tracking-wider font-bold">Visual Prompt Preview</p>
                    </div>
                    <button id="btn-close-char-modal" class="text-gray-400 hover:text-white p-1">
                        <i class="ph ph-x text-2xl"></i>
                    </button>
                </div>
                
                <div class="bg-black/40 p-4 rounded-xl border border-white/5 mb-4">
                    <p id="modal-char-desc" class="text-sm text-gray-300 font-mono leading-relaxed"></p>
                </div>

                <div class="flex justify-end gap-2">
                    <button id="btn-copy-char-prompt" class="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-colors flex items-center gap-2">
                        <i class="ph ph-copy"></i> Copy Prompt
                    </button>
                    <button id="btn-close-char-modal-action" class="px-4 py-2 rounded-lg bg-accent hover:bg-accent/80 text-xs font-bold text-white transition-colors">
                        Tutup
                    </button>
                </div>
            </div>
        </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Event Listener Tutup Modal
        document.getElementById('btn-close-char-modal').onclick = closeCharacterModal;
        document.getElementById('btn-close-char-modal-action').onclick = closeCharacterModal;
        document.getElementById('char-modal-backdrop').onclick = closeCharacterModal;
        
        // Event Copy
        document.getElementById('btn-copy-char-prompt').onclick = () => {
            const text = document.getElementById('modal-char-desc').innerText;
            navigator.clipboard.writeText(text);
            alert("Prompt berhasil disalin!");
        };
    }

    function openCharacterModal(char) {
        const modal = document.getElementById('char-detail-modal');
        document.getElementById('modal-char-name').innerText = char.name;
        document.getElementById('modal-char-desc').innerText = char.visual_desc;
        modal.classList.remove('hidden');
    }

    function closeCharacterModal() {
        document.getElementById('char-detail-modal').classList.add('hidden');
    }
});
