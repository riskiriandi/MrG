/**
 * js/tabs/tab1.js
 * Logika Tab 1: Story Generation & Character Extraction.
 * UPDATE: Fix English Prompts & Anthropomorphic Terminology.
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

    // 4. LOGIC GENERATE STORY (UPDATED PROMPT)
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

                // SYSTEM PROMPT BARU (LEBIH PINTER)
                const systemPrompt = `
You are a professional Screenwriter and Character Designer.
Your task is to convert the user's rough idea into a Master Script and extract character details.

INSTRUCTIONS:
1. **Story Language:** Write the story in **INDONESIAN** (Bahasa Indonesia). ${dialogInstruction}
2. **Character Prompts (CRITICAL):**
   - Identify main characters.
   - **Visual Description MUST be in ENGLISH.** This is for an AI Image Generator.
   - Use high-quality keywords: "cinematic lighting", "detailed texture", "4k", "masterpiece".
   - **IMPORTANT:** If the character is a human-animal hybrid (like a cat-human), use the term **"Anthropomorphic [Animal Name]"** or **"Furry"**. Do NOT just say "humanoid". Ensure you describe "fur texture" if applicable.

OUTPUT FORMAT (JSON ONLY):
{
  "title": "Judul Cerita",
  "story_text": "Teks cerita lengkap dalam Bahasa Indonesia...",
  "characters": [
    {
      "name": "Nama Karakter",
      "visual_desc": "Anthropomorphic cat runner, soft fur texture, athletic body, wearing sportswear, cinematic lighting, detailed face, 8k resolution, running on track, sunny day"
    }
  ]
}
`;

                const messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Ide Cerita: ${idea}` }
                ];

                // Panggil API
                const resultJSON = await generateTextAI(messages, true);

                console.log("AI Result:", resultJSON);

                // Simpan State
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

    // 5. HELPER FUNCTIONS (UI FIX)
    function showResult(text, chars) {
        resultArea.classList.remove('hidden');
        finalStoryText.innerText = text;

        // Render Tags Karakter (FIX UI KEPOTONG)
        tagsList.innerHTML = '';
        if (chars && chars.length > 0) {
            chars.forEach(char => {
                const tag = document.createElement('div');
                // Ubah style biar gak kepotong (w-full di mobile, auto di desktop)
                tag.className = 'w-full md:w-[48%] p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 flex flex-col gap-1 hover:bg-white/10 transition-colors';
                tag.innerHTML = `
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-accent text-base">${char.name}</span>
                        <span class="text-[10px] bg-accent/20 px-2 py-0.5 rounded text-accent border border-accent/20">Prompt Ready</span>
                    </div>
                    <div class="text-xs text-gray-400 italic mt-1 border-t border-white/5 pt-2">
                        "${char.visual_desc}"
                    </div>
                `;
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
});
