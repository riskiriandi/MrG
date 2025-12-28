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
if (document.getElementById('pKey')) document.getElementById('pKey').value = state.pKey;
if (document.getElementById('iKey')) document.getElementById('iKey').value = state.iKey;

function showTab(n) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById('tab' + n).style.display = 'block';
    document.getElementById('nav' + n).classList.add('active');
    window.scrollTo(0,0);
}

// --- FUNGSI CALL AI (Pake Logika Retry Lu) ---
async function callAI(model, prompt, opts = {}) {
    const url = 'https://gen.pollinations.ai/v1/chat/completions';
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
        attempt++;
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.pKey}` },
                body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }] })
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            return data.choices[0].message.content;
        } catch (err) {
            if (attempt === maxRetries) throw err;
            await new Promise(r => setTimeout(r, 1000 * attempt));
        }
    }
}

// --- TAB 1: GENERATE STORY + AUTO DETECT ---
async function generateStory() {
    const idea = document.getElementById('storyIdea').value;
    const dialogOn = document.getElementById('useDialog').checked;
    const status = document.getElementById('status1');
    if (!idea) return alert("Isi ide dulu!");

    status.innerText = "⏳ MrG is writing story & detecting characters...";
    try {
        // 1. Generate Story
        state.story = await callAI('claude', `Tulis cerita pendek profesional: ${idea}. Mode: ${dialogOn ? 'Dialog' : 'Narasi Visual'}. Bahasa Indonesia.`);
        
        // 2. Detect Characters (Langsung setelah cerita jadi)
        const charPrompt = `Identify main characters. Return ONLY JSON array: [{"name":"Name","base_desc":"Physical description"}]. Story: ${state.story}`;
        const charRes = await callAI('openai', charPrompt);
        
        const m = charRes.match(/\[([\s\S]*?)\]/);
        state.characters = m ? JSON.parse(m[0]) : [];
        
        renderCharCards();
        status.innerText = "✅ Done! Moving to Casting...";
        setTimeout(() => showTab(2), 800);
    } catch (e) { status.innerText = "❌ Error: " + e.message; }
}

// --- TAB 2: STYLE & CHARACTER PROMPTING ---
async function handleStyle(type) {
    const status = document.getElementById('styleStatus');
    let url = "";

    if (type === 'url') {
        url = document.getElementById('styleUrl').value;
    } else {
        const file = document.getElementById('styleFile').files[0];
        if (!file) return;
        status.innerText = "⏳ Uploading style...";
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`https://api.imgbb.com/1/upload?key=${state.iKey}`, { method: 'POST', body: formData });
        const data = await res.json();
        url = data.data.url;
    }

    status.innerText = "👁️ Analyzing Art Style...";
    const visionPrompt = `Describe the art style, lighting, and rendering of this image in one concise sentence. Focus on the visual style only.`;
    
    // Pake Vision API
    const res = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.pKey}` },
        body: JSON.stringify({
            model: "openai",
            messages: [{ role: "user", content: [{ type: "text", text: visionPrompt }, { type: "image_url", image_url: { url: url } }] }]
        })
    });
    const data = await res.json();
    state.masterStyleDesc = data.choices[0].message.content;
    status.innerText = "✅ Style Locked! Generating Character Prompts...";
    
    // OTOMATIS UPDATE SEMUA PROMPT KARAKTER
    state.characters.forEach((char, i) => genCharRef(i));
}

function renderCharCards() {
    const grid = document.getElementById('charGrid');
    grid.innerHTML = '';
    state.characters.forEach((char, i) => {
        grid.innerHTML += `
            <div class="char-card">
                <img id="charImg-${i}" class="char-img" src="https://via.placeholder.com/150?text=MrG">
                <div class="char-name">${char.name}</div>
                <button class="btn-neon" style="font-size:0.6rem; padding:5px;" onclick="genCharRef(${i})">Regen</button>
            </div>
        `;
    });
}

async function genCharRef(i) {
    const char = state.characters[i];
    const imgTag = document.getElementById(`charImg-${i}`);
    imgTag.style.opacity = "0.3";

    // ATURAN WAJIB: HUMANOID CAT (Kepala Kucing, Badan Manusia)
    const humanoidRule = "Humanoid cat, anthropomorphic, cat head, human body structure, standing on two legs, wearing clothes, 3d render";
    const prompt = `${state.masterStyleDesc}. ${humanoidRule}. Full body shot of ${char.name}, ${char.base_desc}, standing straight, front view, white background.`;
    
    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=seedream-pro&seed=${state.sessionSeed}&width=1024&height=1024&nologo=true`;
    imgTag.src = url;
    imgTag.onload = () => { imgTag.style.opacity = "1"; state.characters[i].imgUrl = url; };
}

// --- TAB 3: SCENES & SFX ---
async function processScenes() {
    const container = document.getElementById('scenesContainer');
    container.innerHTML = "⏳ MrG is directing scenes...";
    showTab(3);

    const prompt = `Break story into 8 scenes. For each scene provide JSON: {"scene":1, "text":"narasi", "visual":"prompt gambar", "motion":"prompt video", "sfx":["rekomendasi sfx"]}. Story: ${state.story}`;
    try {
        const res = await callAI('openai', prompt);
        const m = res.match(/\[([\s\S]*?)\]/);
        state.scenes = JSON.parse(m[0]);
        
        container.innerHTML = '';
        state.scenes.forEach((s, i) => {
            container.innerHTML += `
                <div class="card">
                    <label>SCENE ${s.scene}</label>
                    <p style="font-size:0.8rem;">${s.text}</p>
                    <div style="margin:10px 0;">${s.sfx.map(x => `<span class="sfx-tag">🔊 ${x}</span>`).join('')}</div>
                    <button class="btn-neon" onclick="renderScene(${i})">Render Scene</button>
                    <div id="res-${i}"></div>
                </div>
            `;
        });
    } catch (e) { container.innerHTML = "❌ Error: " + e.message; }
}

async function renderScene(i) {
    const s = state.scenes[i];
    const resDiv = document.getElementById(`res-${i}`);
    resDiv.innerHTML = "⏳ Rendering...";
    
    const humanoidRule = "Humanoid cat, cat head, human body structure";
    const prompt = `${state.masterStyleDesc}. ${humanoidRule}. Scene: ${s.visual}. Cinematic.`;
    
    // Pake referensi karakter utama (index 0)
    const ref = state.characters[0]?.imgUrl || "";
    let url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=seedream-pro&seed=${state.sessionSeed}&width=1280&height=720&nologo=true`;
    if(ref) url += `&image=${encodeURIComponent(ref)}`;

    resDiv.innerHTML = `
        <img src="${url}" style="width:100%; border-radius:10px; margin-top:10px;">
        <div style="background:#000; padding:10px; border-radius:8px; margin-top:10px; font-size:0.7rem;">
            <strong>Motion:</strong> ${s.motion}
            <br><button onclick="navigator.clipboard.writeText('${s.motion}')" style="margin-top:5px;">Copy</button>
        </div>
    `;
}

// --- SETTINGS & UTILS ---
function toggleSettings() {
    const m = document.getElementById('settingsModal');
    m.style.display = m.style.display === 'none' ? 'block' : 'none';
}
function saveKeys() {
    state.pKey = document.getElementById('pKey').value;
    state.iKey = document.getElementById('iKey').value;
    localStorage.setItem('pKey', state.pKey);
    localStorage.setItem('iKey', state.iKey);
    toggleSettings();
}
function downloadProjectJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "MrG_Project.json");
    dl.click();
}
