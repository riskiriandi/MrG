let state = {
    pKey: localStorage.getItem('pKey') || '',
    iKey: localStorage.getItem('iKey') || '',
    story: '',
    chars: [],
    scenes: [],
    styleDesc: '3D Pixar style, cinematic lighting, high quality',
    seed: Math.floor(Math.random() * 999999)
};

// Load Keys on Start
document.getElementById('pKey').value = state.pKey;
document.getElementById('iKey').value = state.iKey;

function showTab(n) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById('tab' + n).style.display = 'block';
    document.getElementById('nav' + n).classList.add('active');
    window.scrollTo(0,0);
}

function toggleSettings() {
    const m = document.getElementById('settingsModal');
    m.style.display = m.style.display === 'none' ? 'block' : 'none';
}

function saveKeys() {
    state.pKey = document.getElementById('pKey').value.trim();
    state.iKey = document.getElementById('iKey').value.trim();
    localStorage.setItem('pKey', state.pKey);
    localStorage.setItem('iKey', state.iKey);
    alert("Settings Saved!");
    toggleSettings();
}

async function callAI(model, prompt) {
    const res = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${state.pKey}`, 
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ model: model, messages: [{role: 'user', content: prompt}] })
    });
    if (!res.ok) throw new Error(`API Error: ${res.status}`);
    const data = await res.json();
    if (!data.choices || data.choices.length === 0) throw new Error("No response from AI");
    return data.choices[0].message.content;
}

async function generateStory() {
    const idea = document.getElementById('storyIdea').value;
    const dialog = document.getElementById('useDialog').checked;
    const storyText = document.getElementById('storyText');
    const status = document.getElementById('status1');

    if(!state.pKey) return alert("Set API Key first!");
    if(!idea) return alert("Isi ide dulu!");

    document.getElementById('storyResult').style.display = 'block';
    status.innerText = "⏳ MrG is calling Claude...";
    storyText.innerText = "Writing story...";

    try {
        const prompt = `Tulis cerita pendek profesional: ${idea}. Mode: ${dialog ? 'Dengan Dialog' : 'Narasi Visual'}. Bahasa Indonesia. Paragraf saja.`;
        state.story = await callAI('claude', prompt);
        storyText.innerText = state.story;
        status.innerText = "✅ Story Complete!";
        
        detectChars();
    } catch (e) {
        status.innerText = "❌ Error: " + e.message;
    }
}

async function detectChars() {
    const grid = document.getElementById('charGrid');
    grid.innerHTML = "<p style='color:var(--primary); font-size:0.7rem;'>🔍 Detecting characters...</p>";

    try {
        const prompt = `List main characters from this story. Output JSON array only: [{"name": "Name", "desc": "Physical description"}] \n\nStory: ${state.story}`;
        const res = await callAI('openai', prompt);
        const cleanJson = res.replace(/```json|```/g, '').trim();
        state.chars = JSON.parse(cleanJson);
        
        grid.innerHTML = '';
        state.chars.forEach((c, i) => {
            grid.innerHTML += `
                <div class="card" style="margin:5px; padding:10px; text-align:center; background:#000;">
                    <img id="charImg${i}" src="https://via.placeholder.com/150?text=No+Ref" class="img-container">
                    <p style="font-size:0.7rem; margin:5px 0;">${c.name}</p>
                    <button class="btn-copy" onclick="genCharRef(${i})">Gen Ref</button>
                </div>
            `;
        });
    } catch (e) {
        grid.innerHTML = "<p style='color:red;'>Failed to detect characters.</p>";
    }
}

async function genCharRef(i) {
    const c = state.chars[i];
    const isPro = document.getElementById('imgQuality').checked;
    const model = isPro ? 'seedream-pro' : 'seedream';
    const img = document.getElementById(`charImg${i}`);
    
    img.style.opacity = "0.3";
    const prompt = `${state.styleDesc}. Full body shot, standing straight, ${c.desc}, white background, 3d render.`;
    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=${model}&seed=${state.seed}&width=1024&height=1024&nologo=true`;
    
    img.src = url;
    img.onload = () => { 
        img.style.opacity = "1";
        state.chars[i].refUrl = url;
    };
}

async function uploadStyle() {
    const file = document.getElementById('styleFile').files[0];
    const status = document.getElementById('styleStatus');
    if(!file || !state.iKey) return alert("Pilih file & Set ImgBB Key!");

    status.innerText = "⏳ Uploading style...";
    const formData = new FormData();
    formData.append("image", file);

    try {
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${state.iKey}`, { method: 'POST', body: formData });
        const data = await res.json();
        const url = data.data.url;

        status.innerText = "👁️ Analyzing style...";
        const visionPrompt = "Describe the art style, lighting, and rendering of this image for an AI prompt. Concise only.";
        
        const vRes = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.pKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "openai",
                messages: [{ role: "user", content: [{ type: "text", text: visionPrompt }, { type: "image_url", image_url: { url: url } }] }]
            })
        });
        const vData = await vRes.json();
        state.styleDesc = vData.choices[0].message.content;
        status.innerText = "✅ Style Locked!";
    } catch (e) {
        status.innerText = "❌ Style Upload Failed";
    }
}

async function processScenes() {
    showTab(3);
    const container = document.getElementById('scenesContainer');
    const status = document.getElementById('sceneStatus');
    container.innerHTML = "";
    status.innerText = "⏳ GPT-4o is breaking down scenes...";

    try {
        const prompt = `Break story into 8 scenes. For each scene provide: 1. Visual prompt, 2. Motion prompt, 3. SFX recommendations (array). Output JSON array only: [{"scene":1, "text":"...", "visual":"...", "motion":"...", "sfx":["..."]}] \n\nStory: ${state.story}`;
        const res = await callAI('openai', prompt);
        const cleanJson = res.replace(/```json|```/g, '').trim();
        state.scenes = JSON.parse(cleanJson);
        
        status.innerText = "";
        state.scenes.forEach((s, i) => {
            container.innerHTML += `
                <div class="card">
                    <label>SCENE ${s.scene}</label>
                    <p style="font-size:0.8rem; color:#ccc;">${s.text}</p>
                    <div id="sfx-${i}">${s.sfx.map(x => `<span class="sfx-tag">${x}</span>`).join('')}</div>
                    <button class="btn-neon" onclick="renderScene(${i})">Render Scene</button>
                    <div id="res-${i}"></div>
                </div>
            `;
        });
    } catch (e) {
        status.innerText = "❌ Failed to break scenes.";
    }
}

async function renderScene(i) {
    const s = state.scenes[i];
    const resDiv = document.getElementById(`res-${i}`);
    const isPro = document.getElementById('imgQuality').checked;
    const model = isPro ? 'seedream-pro' : 'seedream';

    resDiv.innerHTML = "<p class='status-msg'>⏳ Rendering 4K...</p>";
    
    const charContext = state.chars.map(c => `${c.name} is ${c.desc}`).join(". ");
    const prompt = `${state.styleDesc}. ${charContext}. Scene: ${s.visual}. Cinematic.`;
    
    const mainRef = state.chars[0]?.refUrl || "";
    let url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=${model}&seed=${state.seed}&width=1280&height=720&nologo=true`;
    if(mainRef) url += `&image=${encodeURIComponent(mainRef)}`;

    resDiv.innerHTML = `
        <img src="${url}" class="img-container">
        <div class="motion-prompt">🎬 Motion: ${s.motion}</div>
        <button class="btn-copy" onclick="copyText('${s.motion}')">Copy Motion</button>
    `;
    
    // Update Tab 4
    updateRenderTab();
}

function updateRenderTab() {
    const container = document.getElementById('renderContainer');
    container.innerHTML = "<h2 style='text-align:center; color:var(--primary);'>FINAL PRODUCTION</h2>";
    state.scenes.forEach((s, i) => {
        container.innerHTML += `
            <div class="card">
                <label>SCENE ${s.scene} DATA</label>
                <p style="font-size:0.7rem;"><strong>Visual:</strong> ${s.visual}</p>
                <p style="font-size:0.7rem;"><strong>Motion:</strong> ${s.motion}</p>
                <p style="font-size:0.7rem;"><strong>SFX:</strong> ${s.sfx.join(', ')}</p>
            </div>
        `;
    });
}

function copyText(txt) {
    navigator.clipboard.writeText(txt);
    alert("Copied!");
}

function downloadJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "MrG_Project.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
                                                         }
