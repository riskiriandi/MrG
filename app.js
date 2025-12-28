let state = {
    pKey: localStorage.getItem('pKey') || '',
    iKey: localStorage.getItem('iKey') || '',
    story: '',
    characters: [],
    scenes: [],
    masterStyleDesc: '3D animation style, Pixar style, cinematic lighting, highly detailed',
    sessionSeed: Math.floor(Math.random() * 999999)
};

// Load Keys (if elements exist)
if (document.getElementById('pKey')) document.getElementById('pKey').value = state.pKey;
if (document.getElementById('iKey')) document.getElementById('iKey').value = state.iKey;

function showTab(n) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    const tab = document.getElementById('tab' + n);
    const nav = document.getElementById('nav' + n);
    if (tab) tab.style.display = 'block';
    if (nav) nav.classList.add('active');
    window.scrollTo(0,0);
}

function toggleSettings() {
    const m = document.getElementById('settingsModal');
    if (!m) return;
    m.style.display = m.style.display === 'none' ? 'block' : 'none';
}

function saveKeys() {
    const pEl = document.getElementById('pKey');
    const iEl = document.getElementById('iKey');
    if (!pEl || !iEl) return alert("Elements not found");
    state.pKey = pEl.value.trim();
    state.iKey = iEl.value.trim();
    localStorage.setItem('pKey', state.pKey);
    localStorage.setItem('iKey', state.iKey);
    alert("MrG Settings Saved!");
    toggleSettings();
}

// --- CORE API CALL ---
async function callAI(model, prompt) {
    const url = 'https://gen.pollinations.ai/v1/chat/completions';
    try {
        console.log('callAI', { model, prompt });
        const res = await fetch(url, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': `Bearer ${state.pKey}` 
            },
            body: JSON.stringify({ model: model, messages: [{ role: 'user', content: prompt }] })
        });
        const text = await res.text();
        if (!res.ok) {
            console.error('AI HTTP error', res.status, text);
            throw new Error(`HTTP ${res.status}: ${text}`);
        }
        let data;
        try { data = JSON.parse(text); } catch (e) { data = text; }
        console.log('AI raw response', data);
        if (data && data.choices && data.choices.length > 0) {
            const choice = data.choices[0];
            if (choice.message && choice.message.content) return choice.message.content;
            if (choice.text) return choice.text;
        }
        if (typeof data === 'string') return data;
        if (data && data.error) throw new Error(data.error.message || JSON.stringify(data.error));
        throw new Error("AI Error: No choices returned");
    } catch (err) {
        console.error("callAI error:", err);
        throw err;
    }
}

// Wrapper used by the button in index.html
async function generateStory() {
    const genBtn = document.querySelector('#tab1 .btn-neon');
    if (genBtn) genBtn.disabled = true;
    try {
        await processStory();
    } finally {
        if (genBtn) genBtn.disabled = false;
    }
}

// --- TAB 1: STORY ---
async function processStory() {
    const ideaEl = document.getElementById('storyIdea');
    const dialogOnEl = document.getElementById('useDialog');
    const status = document.getElementById('status1');
    const storyResult = document.getElementById('storyResult');
    const storyText = document.getElementById('storyText');
    if (!ideaEl) return alert("Text area not found");
    const idea = ideaEl.value;
    const dialogOn = dialogOnEl ? dialogOnEl.checked : false;
    if (!idea) return alert("Isi ide dulu, Bro!");

    status.innerText = "⏳ MrG is calling AI for the script...";
    try {
        state.story = await callAI('claude', `Tulis cerita pendek profesional: ${idea}. Mode: ${dialogOn ? 'Dialog' : 'Narasi Visual'}. Bahasa Indonesia.`);
        if (storyText) storyText.innerText = state.story || '';
        if (storyResult) storyResult.style.display = 'block';

        status.innerText = "⏳ AI is detecting characters...";
        const charPrompt = `List tokoh utama dari cerita ini. Output hanya sebuah JSON array. Setiap item berbentuk:{\"name\":\"Nama\",\"base_desc\":\"Deskripsi fisik singkat\"}. Jangan tambahan penjelasan. Cerita:\n${state.story}`;
        const charRes = await callAI('openai', charPrompt);

        const cleaned = (charRes || "").replace(/```json|```/g, "").trim();
        let parsed = [];
        try {
            parsed = JSON.parse(cleaned);
            if (!Array.isArray(parsed)) throw new Error('Parsed not array');
        } catch (e) {
            console.warn('Character parse failed, trying substring parse', e);
            const m = cleaned.match(/\[([\s\S]*?)\]/);
            if (m) {
                try { parsed = JSON.parse(m[0]); } catch (ee) { console.error('Second parse failed', ee); parsed = []; }
            }
        }

        if (!parsed.length) {
            status.innerText = "⚠️ AI returned no characters (fallback). Please edit story or add characters manually.";
            state.characters = [];
        } else {
            state.characters = parsed;
            renderCharCards();
            status.innerText = "✅ Story & Characters Ready!";
            // auto show tab2 but wait a bit so user sees status
            setTimeout(() => showTab(2), 700);
        }
    } catch (e) {
        console.error(e);
        status.innerText = "❌ Error: " + (e.message || e);
        alert("Error saat membuat story/karakter: " + (e.message || e));
    }
}

// --- TAB 2: STYLE & CHARS ---
function handleStyleSource(type) {
    // map inputs from index.html (styleFile/styleUrl) to handler
    if (type === 'file') return handleStyle('file');
    if (type === 'url') return handleStyle('url');
}

async function handleStyle(type) {
    const status = document.getElementById('styleStatus');
    if (!status) return;
    let url = "";

    if (type === 'url') {
        const el = document.getElementById('styleUrl');
        if (!el) return alert('styleUrl element not found');
        url = el.value.trim();
        if (!url) return alert('Masukkan URL gambar');
    } else {
        const fileInput = document.getElementById('styleFile');
        if (!fileInput) return alert('styleFile element not found');
        const file = fileInput.files[0];
        if (!file) return alert('Pilih file dulu');
        status.innerText = "⏳ Uploading to ImgBB...";
        try {
            const formData = new FormData();
            formData.append('image', file);
            const res = await fetch(`https://api.imgbb.com/1/upload?key=${state.iKey}`, { method: 'POST', body: formData });
            const data = await res.json();
            if (!data || !data.data || !data.data.url) throw new Error('ImgBB upload failed');
            url = data.data.url;
        } catch (e) {
            console.error('ImgBB error:', e);
            status.innerText = '❌ Upload failed: ' + (e.message || e);
            return;
        }
    }

    status.innerText = '👁️ AI Analyzing Art Style...';
    try {
        const prompt = `Describe the art style, lighting, and rendering of this image in one concise sentence suitable for image-generation prompts. Respond only with a short descriptive sentence (no extra text).\nImage URL: ${url}`;
        const resText = await callAI('openai', prompt);
        const cleaned = (resText || '').replace(/```/g, '').trim();
        if (cleaned) {
            state.masterStyleDesc = cleaned;
            status.innerText = '✅ Art Style Locked!';
        } else {
            status.innerText = '⚠️ Style analysis returned empty.';
        }
    } catch (e) {
        console.error(e);
        status.innerText = '❌ Style Analysis Failed: ' + (e.message || e);
    }
}

function renderCharCards() {
    const grid = document.getElementById('charGrid');
    if (!grid) return;
    grid.innerHTML = '';
    state.characters.forEach((char, i) => {
        const card = document.createElement('div');
        card.className = 'char-card';
        const imgId = `charImg-${i}`;
        card.innerHTML = `
            <img id="${imgId}" class="char-img" src="${char.imgUrl || 'https://via.placeholder.com/150?text=No+Ref'}">
            <label style="font-size:0.7rem; color:var(--primary);">${char.name}</label>
            <button class="btn-neon" style="font-size:0.6rem; padding:5px; margin-top:5px;" onclick="genCharRef(${i})">Gen Ref</button>
        `;
        grid.appendChild(card);
    });
}

async function genCharRef(i) {
    const char = state.characters[i];
    if (!char) return alert('Character not found');
    const isPro = document.getElementById('imgQuality') ? document.getElementById('imgQuality').checked : false;
    const model = isPro ? 'seedream-pro' : 'seedream';
    const imgTag = document.getElementById(`charImg-${i}`);
    if (!imgTag) return alert('Image element not found');

    const prompt = `${state.masterStyleDesc}. Full body character sheet of ${char.name}, ${char.base_desc || ''}, standing straight, front view, neutral expression, white background, 3d render.`;
    imgTag.style.opacity = '0.3';
    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=${model}&seed=${state.sessionSeed}&width=1024&height=1024&nologo=true`;
    imgTag.src = url;
    imgTag.onload = () => { imgTag.style.opacity = '1'; state.characters[i].imgUrl = url; };
    imgTag.onerror = () => { imgTag.style.opacity = '1'; alert('Image generation failed or blocked (CORS). Check console.'); console.error('Image URL failed:', url); };
}

// --- TAB 3: SCENES & SFX ---
async function processScenes() {
    const list = document.getElementById('scenesList');
    if (!list) return alert('scenesList element not found');
    list.innerHTML = "<div class='status-msg'>⏳ AI is directing 8 scenes + SFX...</div>";
    showTab(3);

    try {
        const prompt = `Pecah cerita berikut menjadi 8 scene visual. Untuk setiap scene berikan objek JSON dengan properti: \"scene\" (nomor), \"text\" (narasi singkat), \"visual\" (prompt deskriptif untuk gambar), \"motion\" (prompt untuk video/motion), \"sfx\" (array string rekomendasi efek suara). Output: hanya sebuah JSON array berisi 8 object. Cerita:\n\n${state.story}`;
        const resText = await callAI('openai', prompt);

        const cleaned = (resText || '').replace(/```json|```/g, '').trim();
        let parsed = [];
        try {
            parsed = JSON.parse(cleaned);
            if (!Array.isArray(parsed)) throw new Error('Parsed not array');
        } catch (e) {
            console.warn('Failed to parse scenes JSON automatically, trying to find JSON substring...', e);
            const m = cleaned.match(/\[([\s\S]*?)\]/);
            if (m) {
                try { parsed = JSON.parse(m[0]); } catch (ee) { console.error('Second parse failed', ee); parsed = []; }
            } else parsed = [];
        }

        if (!parsed.length) {
            list.innerHTML = "<div class='status-msg'>❌ AI returned no scenes. Check story or API response (see console).</div>";
            console.error('Scenes parse failed; raw response:', resText);
            return;
        }

        state.scenes = parsed;
        list.innerHTML = '';
        state.scenes.forEach((s, i) => {
            const div = document.createElement('div');
            div.className = 'card neon-border';
            div.innerHTML = `
                <label>SCENE ${s.scene || (i+1)}</label>
                <p style="font-size:0.8rem; color:#ccc;">${s.text || ''}</p>
                <div class="sfx-container">${(s.sfx || []).map(x => `<span class="sfx-tag">🔊 ${x}</span>`).join('')}</div>
                <button class="btn-neon" onclick="renderScene(${i})">Render Scene 🎬</button>
                <div id="sceneContainer-${i}"></div>
            `;
            list.appendChild(div);
        });
    } catch (e) {
        console.error(e);
        list.innerHTML = "❌ Error: " + (e.message || e);
    }
}

// --- TAB 4: RENDER & PROMPTS ---
async function renderScene(i) {
    const s = state.scenes[i];
    const container = document.getElementById(`sceneContainer-${i}`);
    if (!s || !container) return alert('Scene or container not found');
    const isPro = document.getElementById('imgQuality') ? document.getElementById('imgQuality').checked : false;
    const model = isPro ? 'seedream-pro' : 'seedream';

    container.innerHTML = "<div class='status-msg'>⏳ Rendering...</div>";
    const charContext = (state.characters || []).map(c => `${c.name} is ${c.base_desc || ''}`).join('. ');
    const prompt = `${state.masterStyleDesc}. ${charContext}. Scene: ${s.visual || s.text}. Cinematic.`;

    const mainCharImg = state.characters[0]?.imgUrl || ""; 
    let url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=${model}&seed=${state.sessionSeed}&width=1280&height=720&nologo=true`;
    if (mainCharImg) url += `&image=${encodeURIComponent(mainCharImg)}`;

    container.innerHTML = `
        <img src="${url}" style="width:100%; border-radius:8px; margin-top:10px; border:1px solid #333;" onerror="this.style.opacity=0.6; console.error('Image render failed (maybe CORS)');">
        <div class="prompt-area">
            <strong>Video Prompt:</strong><br>${(s.motion || '')}
            <br><button class="btn-copy" style="margin-top:5px;" onclick="copyTxt('${escapeForJS(s.motion || '')}')">Copy Text</button>
            <button class="btn-copy" onclick="copyTxt('${escapeForJS(JSON.stringify(s))}')">Copy JSON</button>
        </div>
    `;
    updateFinalTab();
}

function escapeForJS(str) {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
}

function updateFinalTab() {
    const prod = document.getElementById('finalProduction');
    if (!prod) return;
    prod.innerHTML = "<h2 style='text-align:center; color:var(--primary);'>PRODUCTION SUMMARY</h2>";
    (state.scenes || []).forEach(s => {
        prod.innerHTML += `<div class='card'><label>SCENE ${s.scene || ''}</label><p style='font-size:0.7rem;'>${s.motion || ''}</p></div>`;
    });
}

function copyTxt(t) { 
    navigator.clipboard.writeText(t).then(() => alert('Copied to MrG Clipboard!')).catch(e => { alert('Copy failed'); console.error(e); });
}

function downloadProjectJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', 'MrG_Project.json');
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}
