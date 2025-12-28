let state = {
    pKey: localStorage.getItem('pKey') || '',
    iKey: localStorage.getItem('iKey') || '',
    story: '',
    characters: [],
    scenes: [],
    masterStyleDesc: '3D animation style, Pixar style, cinematic lighting, highly detailed',
    sessionSeed: Math.floor(Math.random() * 999999)
};

// Load Keys
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
    alert("MrG Settings Saved!");
    toggleSettings();
}

// --- CORE API CALL ---
async function callAI(model, prompt) {
    const res = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.pKey}` },
        body: JSON.stringify({ model: model, messages: [{ role: 'user', content: prompt }] })
    });
    const data = await res.json();
    if (!data.choices) throw new Error("AI Error: No choices returned");
    return data.choices[0].message.content;
}

// --- TAB 1: STORY ---
async function processStory() {
    const idea = document.getElementById('storyIdea').value;
    const dialogOn = document.getElementById('useDialog').checked;
    const status = document.getElementById('status1');
    if (!idea) return alert("Isi ide dulu, Bro!");

    status.innerText = "⏳ MrG is calling Claude for the script...";
    try {
        state.story = await callAI('claude', `Tulis cerita pendek profesional: ${idea}. Mode: ${dialogOn ? 'Dialog' : 'Narasi Visual'}. Bahasa Indonesia.`);
        document.getElementById('storyDisplay').innerText = state.story;
        
        status.innerText = "⏳ GPT-4o is detecting characters...";
        const charRes = await callAI('openai', `List tokoh utama dari cerita ini. Output JSON array SAJA: [{"name": "Nama", "base_desc": "Deskripsi fisik"}] \n\nCerita: ${state.story}`);
        state.characters = JSON.parse(charRes.replace(/```json|```/g, "").trim());
        
        renderCharCards();
        status.innerText = "✅ Story & Characters Ready!";
        showTab(2);
    } catch (e) { status.innerText = "❌ Error: " + e.message; }
}

// --- TAB 2: STYLE & CHARS ---
async function handleStyle(type) {
    const status = document.getElementById('styleStatus');
    let url = "";

    if (type === 'url') {
        url = document.getElementById('styleUrl').value;
    } else {
        const file = document.getElementById('styleUpload').files[0];
        if (!file) return;
        status.innerText = "⏳ Uploading to ImgBB...";
        const formData = new FormData();
        formData.append("image", file);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${state.iKey}`, { method: "POST", body: formData });
        const data = await res.json();
        url = data.data.url;
    }

    status.innerText = "👁️ AI Analyzing Art Style...";
    try {
        const res = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.pKey}` },
            body: JSON.stringify({
                model: "openai",
                messages: [{ role: "user", content: [{ type: "text", text: "Describe the art style, lighting, and rendering of this image for an AI prompt. Concise only." }, { type: "image_url", image_url: { url: url } }] }]
            })
        });
        const data = await res.json();
        state.masterStyleDesc = data.choices[0].message.content;
        status.innerText = "✅ Art Style Locked!";
    } catch (e) { status.innerText = "❌ Style Analysis Failed"; }
}

function renderCharCards() {
    const grid = document.getElementById('charGrid');
    grid.innerHTML = "";
    state.characters.forEach((char, i) => {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.innerHTML = `
            <img id="charImg-${i}" class="char-img" src="https://via.placeholder.com/150?text=No+Ref">
            <label style="font-size:0.7rem; color:var(--primary);">${char.name}</label>
            <button class="btn-neon" style="font-size:0.6rem; padding:5px; margin-top:5px;" onclick="genCharRef(${i})">Gen Ref</button>
        `;
        grid.appendChild(card);
    });
}

async function genCharRef(i) {
    const char = state.characters[i];
    const isPro = document.getElementById('imgQuality').checked;
    const model = isPro ? 'seedream-pro' : 'seedream';
    const imgTag = document.getElementById(`charImg-${i}`);
    
    const prompt = `${state.masterStyleDesc}. Full body character sheet of ${char.name}, ${char.base_desc}, standing straight, front view, neutral expression, white background, 3d render.`;
    imgTag.style.opacity = "0.3";
    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=${model}&seed=${state.sessionSeed}&width=1024&height=1024&nologo=true`;
    
    imgTag.src = url;
    imgTag.onload = () => { imgTag.style.opacity = "1"; state.characters[i].imgUrl = url; };
}

// --- TAB 3: SCENES & SFX ---
async function processScenes() {
    const list = document.getElementById('scenesList');
    list.innerHTML = "<div class='status-msg'>⏳ GPT-4o is directing 8 scenes + SFX...</div>";
    showTab(3);

    try {
        const res = await callAI('openai', `Pecah cerita jadi 8 scene visual. Untuk setiap scene berikan: 1. Narasi, 2. Visual prompt detail, 3. Motion prompt video, 4. Rekomendasi SFX (array). Output JSON array SAJA: [{"scene": 1, "text": "Narasi", "visual": "Prompt aksi", "motion": "Gerakan kamera", "sfx": ["suara1", "suara2"]}] \n\nCerita: ${state.story}`);
        state.scenes = JSON.parse(res.replace(/```json|```/g, "").trim());
        
        list.innerHTML = "";
        state.scenes.forEach((s, i) => {
            const div = document.createElement('div');
            div.className = 'card neon-border';
            div.innerHTML = `
                <label>SCENE ${s.scene}</label>
                <p style="font-size:0.8rem; color:#ccc;">${s.text}</p>
                <div class="sfx-container">${s.sfx.map(x => `<span class="sfx-tag">🔊 ${x}</span>`).join('')}</div>
                <button class="btn-neon" onclick="renderScene(${i})">Render Scene 🎬</button>
                <div id="sceneContainer-${i}"></div>
            `;
            list.appendChild(div);
        });
    } catch (e) { list.innerHTML = "❌ Error: " + e.message; }
}

// --- TAB 4: RENDER & PROMPTS ---
async function renderScene(i) {
    const s = state.scenes[i];
    const container = document.getElementById(`sceneContainer-${i}`);
    const isPro = document.getElementById('imgQuality').checked;
    const model = isPro ? 'seedream-pro' : 'seedream';

    container.innerHTML = "<div class='status-msg'>⏳ Rendering 4K...</div>";
    const charContext = state.characters.map(c => `${c.name} is ${c.base_desc}`).join(". ");
    const prompt = `${state.masterStyleDesc}. ${charContext}. Scene: ${s.visual}. Cinematic.`;
    
    const mainCharImg = state.characters[0]?.imgUrl || ""; 
    let url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=${model}&seed=${state.sessionSeed}&width=1280&height=720&nologo=true`;
    if(mainCharImg) url += `&image=${encodeURIComponent(mainCharImg)}`;

    container.innerHTML = `
        <img src="${url}" style="width:100%; border-radius:8px; margin-top:10px; border:1px solid #333;">
        <div class="prompt-area">
            <strong>Video Prompt:</strong><br>${s.motion}
            <br><button class="btn-copy" style="margin-top:5px;" onclick="copyTxt('${s.motion}')">Copy Text</button>
            <button class="btn-copy" onclick="copyTxt('${JSON.stringify(s)}')">Copy JSON</button>
        </div>
    `;
    updateFinalTab();
}

function updateFinalTab() {
    const prod = document.getElementById('finalProduction');
    prod.innerHTML = "<h2 style='text-align:center; color:var(--primary);'>PRODUCTION SUMMARY</h2>";
    state.scenes.forEach(s => {
        prod.innerHTML += `<div class='card'><label>SCENE ${s.scene}</label><p style='font-size:0.7rem;'>${s.motion}</p></div>`;
    });
}

function copyTxt(t) { navigator.clipboard.writeText(t); alert("Copied to MrG Clipboard!"); }

function downloadProjectJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "MrG_Project.json");
    dlAnchor.click();
        }
