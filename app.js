let state = {
    pKey: localStorage.getItem('pKey') || '',
    iKey: localStorage.getItem('iKey') || '',
    story: '',
    chars: [],
    scenes: [],
    styleDesc: '3D Pixar style, cinematic neon lighting',
    seed: Math.floor(Math.random() * 999999)
};

function showTab(n) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById('tab' + n).style.display = 'block';
    document.querySelectorAll('.nav-item')[n-1].classList.add('active');
}

async function generateStory() {
    const idea = document.getElementById('storyIdea').value;
    const dialog = document.getElementById('useDialog').checked;
    if(!state.pKey) return alert("Set API Key first!");

    document.getElementById('storyResult').style.display = 'block';
    document.getElementById('storyText').innerText = "Claude is writing...";

    const prompt = `Write a professional short story: ${idea}. Mode: ${dialog ? 'With Dialogs' : 'Visual Narrative'}. Bahasa Indonesia.`;
    
    try {
        const res = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${state.pKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'claude', messages: [{role: 'user', content: prompt}] })
        });
        const data = await res.json();
        state.story = data.choices[0].message.content;
        document.getElementById('storyText').innerText = state.story;
        
        // Auto detect chars
        detectChars();
    } catch (e) { alert(e.message); }
}

async function detectChars() {
    const prompt = `List main characters from this story. Output JSON array only: [{"name": "Name", "desc": "Physical description"}] \n\nStory: ${state.story}`;
    const res = await fetch('https://gen.pollinations.ai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${state.pKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai', messages: [{role: 'user', content: prompt}] })
    });
    const data = await res.json();
    state.chars = JSON.parse(data.choices[0].message.content.replace(/```json|```/g, ''));
    renderChars();
}

function renderChars() {
    const grid = document.getElementById('charGrid');
    grid.innerHTML = '';
    state.chars.forEach((c, i) => {
        grid.innerHTML += `
            <div class="card" style="margin:5px; padding:10px; text-align:center;">
                <img id="charImg${i}" src="https://via.placeholder.com/150" class="img-container">
                <p style="font-size:0.7rem;">${c.name}</p>
                <button class="btn-copy" onclick="genCharRef(${i})">Generate Ref</button>
            </div>
        `;
    });
}

async function genCharRef(i) {
    const c = state.chars[i];
    const prompt = `${state.styleDesc}. Full body shot, standing straight, ${c.desc}, white background.`;
    const url = `https://gen.pollinations.ai/image/${encodeURIComponent(prompt)}?model=seedream&seed=${state.seed}&width=1024&height=1024&nologo=true`;
    document.getElementById(`charImg${i}`).src = url;
    state.chars[i].refUrl = url;
}

async function processScenes() {
    // Logic pecah scene dengan SFX
    const prompt = `Break story into 8 scenes. For each scene provide: 
    1. Visual prompt
    2. Motion prompt
    3. SFX recommendations (array)
    Output JSON array only: [{"scene":1, "text":"...", "visual":"...", "motion":"...", "sfx":["..."]}] \n\nStory: ${state.story}`;
    
    // ... (Fetch logic similar to generateStory)
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
}

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
