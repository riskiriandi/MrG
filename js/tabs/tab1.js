/**
 * js/tabs/tab1.js
 * Logika Tab 1: Story Generation & Character Extraction.
 * Mengubah ide kasar menjadi Naskah Master + Data Karakter (JSON).
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

    // 2. LOAD DATA DARI STATE (Saat halaman direfresh)
    // Kalau sudah ada data tersimpan, tampilkan kembali.
    if (AppState.story.rawIdea) {
        storyInput.value = AppState.story.rawIdea;
    }
    
    // Set status toggle sesuai simpanan
    updateToggleVisual(AppState.story.isDialogMode);

    // Kalau sudah ada hasil generate sebelumnya, tampilkan
    if (AppState.story.masterScript) {
        showResult(AppState.story.masterScript, AppState.story.characters);
    }

    // 3. LOGIC TOGGLE DIALOG
    if (btnToggle) {
        btnToggle.addEventListener('click', () => {
            // Ubah state (true jadi false, false jadi true)
            AppState.story.isDialogMode = !AppState.story.isDialogMode;
            
            // Update visual tombol
            updateToggleVisual(AppState.story.isDialogMode);
            
            // Simpan perubahan
            saveProject();
        });
    }

    function updateToggleVisual(isActive) {
        const circle = btnToggle.querySelector('div');
        if (isActive) {
            // Mode ON
            btnToggle.classList.remove('bg-gray-600');
            btnToggle.classList.add('bg-accent');
            circle.classList.add('translate-x-5');
            statusText.innerText = "ON";
            statusText.classList.add('text-accent');
        } else {
            // Mode OFF
            btnToggle.classList.remove('bg-accent');
            btnToggle.classList.add('bg-gray-600');
            circle.classList.remove('translate-x-5');
            statusText.innerText = "OFF";
            statusText.classList.remove('text-accent');
        }
    }

    // 4. LOGIC GENERATE STORY (THE CORE)
    if (btnGenerate) {
        btnGenerate.addEventListener('click', async () => {
            const idea = storyInput.value.trim();
            
            if (!idea) {
                alert("Tulis dulu ide ceritanya, bro!");
                return;
            }

            // Update UI jadi Loading
            setLoading(true);

            try {
                // Simpan input user
                AppState.story.rawIdea = idea;

                // SIAPKAN PROMPT KHUSUS (JSON MODE)
                const dialogInstruction = AppState.story.isDialogMode 
                    ? "Include engaging dialogues between characters." 
                    : "Focus on narration and descriptive storytelling, minimize dialogue.";

                const systemPrompt = `
You are a professional Screenwriter and Character Designer.
Your task is to convert the user's rough idea into a Master Script and extract character details.

INSTRUCTIONS:
1. Story: Write a compelling story based on the idea. ${dialogInstruction}
2. Characters: Identify main characters. Create a detailed VISUAL description for each (face, body, clothes, distinct features).
   - Example: "A humanoid cat, soft fur texture not skin, wearing cyberpunk vest."

OUTPUT FORMAT:
You MUST output a valid JSON object with this exact structure:
{
  "title": "Title of the story",
  "story_text": "The full story content here...",
  "characters": [
    {
      "name": "Character Name",
      "visual_desc": "Detailed visual description for AI image generation"
    }
  ]
}
Do not output markdown code blocks. Just the raw JSON.
`;

                const messages = [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Idea: ${idea}` }
                ];

                // Panggil API (dari api.js) dengan mode JSON = true
                const resultJSON = await generateTextAI(messages, true);

                console.log("AI Result:", resultJSON);

                // Simpan ke State
                AppState.story.masterScript = resultJSON.story_text;
                AppState.story.characters = resultJSON.characters;
                AppState.story.lastGenerated = new Date().toISOString();
                
                saveProject(); // Auto-Save

                // Tampilkan Hasil
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

        // Render Tags Karakter
        tagsList.innerHTML = '';
        if (chars && chars.length > 0) {
            chars.forEach(char => {
                const tag = document.createElement('div');
                tag.className = 'px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 flex flex-col gap-1';
                tag.innerHTML = `
                    <span class="font-bold text-accent">${char.name}</span>
                    <span class="text-[10px] text-gray-500 truncate max-w-[150px]">${char.visual_desc}</span>
                `;
                tagsList.appendChild(tag);
            });
        } else {
            tagsList.innerHTML = '<span class="text-xs text-gray-500">Tidak ada karakter spesifik terdeteksi.</span>';
        }

        // Munculkan tombol lanjut
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

    // Logic Tombol Copy
    if (btnCopy) {
        btnCopy.addEventListener('click', () => {
            navigator.clipboard.writeText(finalStoryText.innerText);
            const originalIcon = btnCopy.innerHTML;
            btnCopy.innerHTML = '<i class="ph ph-check"></i> Copied';
            setTimeout(() => btnCopy.innerHTML = originalIcon, 2000);
        });
    }

    // Logic Tombol Lanjut (Pindah ke Tab 2)
    if (btnNext) {
        btnNext.addEventListener('click', () => {
            window.switchTab(2);
        });
    }
});
