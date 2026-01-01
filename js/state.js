// js/state.js

const initialState = {
    // Tab 1: Story
    story: {
        rawIdea: "",
        title: "",
        synopsis: "",
        scripts: [], // Array of scenes text
    },
    
    // Tab 2: Style
    style: {
        mode: "preset", // 'preset' or 'upload'
        selectedRatio: "16:9",
        masterPrompt: "Cinematic lighting, 8k resolution, unreal engine 5 render, hyperrealistic",
        referenceImage: null
    },

    // Tab 3: Characters
    characters: [], // Array of objects { name, desc, imgUrl }

    // Tab 4: Scenes
    scenes: [], // Array of objects { id, prompt, imgUrl }

    // System
    config: {
        apiKey: localStorage.getItem('mrg_api_key') || '',
        isPremium: false
    }
};

// Handler biar kita tau kapan state berubah (Debugging enak)
const handler = {
    set(target, property, value) {
        console.log(`[STATE UPDATE] ${property} changed to:`, value);
        target[property] = value;
        return true;
    }
};

// Export Global State
window.appState = new Proxy(initialState, handler);

// Fungsi Helper buat Simpan/Load
window.saveProject = () => {
    localStorage.setItem('mrg_project_backup', JSON.stringify(window.appState));
    showToast("Project saved locally!", "success");
};

window.loadProject = () => {
    const data = localStorage.getItem('mrg_project_backup');
    if (data) {
        Object.assign(window.appState, JSON.parse(data));
        showToast("Project loaded!", "success");
    }
};
