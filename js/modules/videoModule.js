// js/modules/videoModule.js

window.generateVideoPrompts = () => {
    const scenes = window.appState.project.scenes;
    
    const videoData = scenes.map(scene => {
        return {
            scene_id: scene.id,
            // Prompt Video biasanya lebih simpel dari Image
            video_prompt: `Cinematic shot, ${scene.text}, slow motion, 4k`, 
            // Rekomendasi SFX berdasarkan teks scene
            sfx: generateSFXRecommendation(scene.text) 
        };
    });

    // Render UI List
    const container = document.getElementById('video-list');
    container.innerHTML = videoData.map(item => `
        <div class="glass-panel p-4 mb-4 rounded-xl border-l-4 border-accent">
            <div class="flex justify-between mb-2">
                <h4 class="font-bold text-white">Scene ${item.scene_id}</h4>
                <button onclick="copyText('${item.video_prompt}')" class="text-xs bg-white/10 px-2 py-1 rounded hover:bg-white/20">Copy Prompt</button>
            </div>
            <p class="text-gray-300 text-sm mb-3 font-mono bg-black/30 p-2 rounded">${item.video_prompt}</p>
            
            <div class="flex items-center gap-2 text-xs text-yellow-400">
                <i class="ph ph-speaker-high"></i>
                <span class="font-bold">SFX Rec:</span> ${item.sfx}
            </div>
        </div>
    `).join('');
};

// Helper simpel buat SFX (Bisa diganti AI kalau mau lebih canggih)
function generateSFXRecommendation(text) {
    text = text.toLowerCase();
    if (text.includes("ledakan") || text.includes("fight")) return "Heavy Impact, Explosion, Debris Falling";
    if (text.includes("hujan")) return "Rain, Thunder, Water Splashing";
    if (text.includes("jalan") || text.includes("lari")) return "Footsteps on concrete, Heavy breathing";
    if (text.includes("makan")) return "Utensils clinking, Chewing";
    return "Ambient Room Noise, Cinematic Drone Hum";
          }
