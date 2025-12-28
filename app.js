let state = {
    pKey: localStorage.getItem('pKey') || '',
    iKey: localStorage.getItem('iKey') || '',
    story: '',
    chars: [],
    scenes: [],
    styleDesc: '3D Pixar style, cinematic lighting, high quality',
    seed: Math.floor(Math.random() * 999999)
};

// Init Keys
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

// --- ROBUST FETCH WRAPPER ---
async function safeFetch(url, options) {
    try {
        const res = await fetch(url, options);
        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`HTTP ${res.status}: ${errText}`);
        }
        return await res.json();
    } catch (e) {
        console.error("Fetch Error:", e);
        throw e;
    }
}

async function generateStory() {
    const idea = document.getElementById('storyIdea').value;
    const dialog = document.getElementById('useDialog').checked;
    const status = document.getElementById('status1');
    const storyText = document.getElementById('storyText');

    if(!state.pKey) return alert("Set API Key first!");
    if(!idea) return alert("Isi ide dulu!");

    document.getElementById('storyResult').style.display = 'block';
    status.innerText = "⏳ MrG is calling Claude...";
    storyText.innerText = "Writing story...";

    try {
        const prompt = `Tulis cerita pendek profesional: ${idea}. Mode: ${dialog ? 'Dengan Dialog' : 'Narasi Visual'}. Bahasa Indonesia. Paragraf saja.`;
        const data = await safeFetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.pKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'claude', messages: [{role: 'user', content: prompt}] })
        });
        
        state.story = data.choices[0].message.content;
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
        const data = await safeFetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.pKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'openai', messages: [{role: 'user', content: prompt}] })
        });

        const rawContent = data.choices[0].message.content;
        // REGEX UNTUK MENCARI ARRAY JSON [ ... ]
        const jsonMatch = rawContent.match(/\[.*\]/s);
        if (!jsonMatch) throw new Error("AI did not return a valid character list.");
        
        state.chars = JSON.parse(jsonMatch[0]);
        
        grid.innerHTML = '';
        state.chars.forEach((c, i) => {
            grid.innerHTML += `
                <div class="card" style="margin:5px; padding:10px; text-align:center; background:#000; border:1px solid #222;">
                    <img id="charImg${i}" src="https://via.placeholder.com/150?text=No+Ref" style="width:100%; border-radius:8px;">
                    <p style="font-size:0.7rem; margin:5px 0; color:var(--primary);">${c.name}</p>
                    <button class="btn-copy" onclick="genCharRef(${i})">Gen Ref</button>
                </div>
            `;
        });
    } catch (e) {
        grid.innerHTML = `<p style='color:red; font-size:0.7rem;'>Failed to detect characters: ${e.message}</p>`;
    }
}

async function handleStyleSource(type) {
    const status = document.getElementById('styleStatus');
    if (type === 'url') {
        const url = document.getElementById('styleUrl').value.trim();
        if (url) analyzeStyle(url);
    } else {
        const file = document.getElementById('styleFile').files[0];
        if (!file || !state.iKey) return alert("Pilih file & Set ImgBB Key!");
        
        status.innerText = "⏳ Uploading to ImgBB...";
        const formData = new FormData();
        formData.append("image", file);
        try {
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${state.iKey}`, { method: 'POST', body: formData });
            const data = await res.json();
            analyzeStyle(data.data.url);
        } catch (e) { status.innerText = "❌ Upload Failed"; }
    }
}

async function analyzeStyle(url) {
    const status = document.getElementById('styleStatus');
    status.innerText = "👁️ Analyzing style...";
    try {
        const data = await safeFetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.pKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: "openai",
                messages: [{ role: "user", content: [{ type: "text", text: "Describe the art style, lighting, and rendering of this image for an AI prompt. Concise only." }, { type: "image_url", image_url: { url: url } }] }]
            })
        });
        state.styleDesc = data.choices[0].message.content;
        status.innerText = "✅ Style Locked!";
    } catch (e) { status.innerText = "❌ Style Analysis Failed"; }
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
    img.onload = () => { img.style.opacity = "1"; state.chars[i].refUrl = url; };
}

async function processScenes() {
    showTab(3);
    const container = document.getElementById('scenesContainer');
    const status = document.getElementById('sceneStatus');
    container.innerHTML = "";
    status.innerText = "⏳ GPT-4o is breaking down scenes...";

    try {
        const prompt = `Break story into 8 scenes. For each scene provide: 1. Visual prompt, 2. Motion prompt, 3. SFX recommendations (array). Output JSON array only: [{"scene":1, "text":"...", "visual":"...", "motion":"...", "sfx":["..."]}] \n\nStory: ${state.story}`;
        const data = await safeFetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.pKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'openai', messages: [{role: 'user', content: prompt}] })
        });
        
        const jsonMatch = data.choices[0].message.content.match(/\[.*\]/s);
        state.scenes = JSON.parse(jsonMatch[0]);
        
        status.innerText = "";
        state.scenes.forEach((s, i) => {
            container.innerHTML += `
                <div class="card">
                    <label>SCENE ${s.scene}</label>
                    <p style="font-size:0.8rem; color:#ccc;">${s.text}</p>
                    <div>${s.sfx.map(x => `<span class="sfx-tag">${x}</span>`).join('')}</div>
                    <button class="btn-neon" onclick="renderScene(${i})">Render Scene</button>
                    <div id="res-${i}"></div>
                </div>
            `;
        });
    } catch (e) { status.innerText = "❌ Failed to break scenes."; }
}

async function renderScene(i) {
    const s = state.scenes[i];
    const resDiv = document.getElementById(`res-${i}`);
    const isPro = document.getElementById('imgQuality').checked;
    const model = isPro ? 'seedream-pro' : 'seedream';

    resDiv.innerHTML = "<p class='status-msg'>⏳ Rendering...</p>";
    const charContext = state.chars.map(c => `${c.name} is ${c.desc}`).join(". ");
    const prompt = `${state.styleDesc}. ${charContext}. Scene: ${s.visual}. Cinematic.`;
    
    const mainRef = state.chars[0]?.refUrl || "";
    let url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=${model}&seed=${state.seed}&width=1280&height=720&nologo=true`;
    if(mainRef) url += `&image=${encodeURIComponent(mainRef)}`;

    resDiv.innerHTML = `
        <img src="${url}" style="width:100%; border-radius:10px; margin-top:10px; border:1px solid #333;">
        <div class="motion-prompt">🎬 Motion: ${s.motion}</div>
        <button class="btn-copy" onclick="navigator.clipboard.writeText('${s.motion}'); alert('Copied!')">Copy Motion</button>
    `;
                }
