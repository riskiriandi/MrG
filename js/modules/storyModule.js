// js/modules/storyModule.js

window.generateStoryLogic = async () => {
    const idea = window.appState.project.story.rawIdea;
    const useDialog = window.appState.project.story.useDialog; // Toggle Checkbox

    // System Prompt Khusus
    const systemPrompt = `
    Kamu adalah Penulis Naskah Film Profesional.
    Tugas: Ubah ide user menjadi struktur naskah JSON.
    
    ATURAN KARAKTER:
    1. Hanya masukkan karakter yang PUNYA NAMA. (Sapi lewat/NPC jangan dimasukkan).
    2. Jika karakter bukan manusia (misal: Humanoid Cat), deskripsikan fisiknya dengan detail ekstrim (contoh: "anthropomorphic cat, thin white fur, wearing casual hoodie, human-like standing posture").
    
    ATURAN OUTPUT (WAJIB JSON VALID):
    {
        "title": "Judul Keren",
        "synopsis": "Ringkasan padat...",
        "characters": [
            { "name": "Jono", "desc": "Cyborg, mata merah menyala, lengan besi berkarat, baju compang-camping." },
            { "name": "Mina", "desc": "Humanoid Cat, bulu tipis warna abu-abu, mata besar lucu, pakai dress bunga-bunga." }
        ],
        "scenes": [
            "Scene 1: Jono sedang memperbaiki tangannya di bengkel gelap...",
            "Scene 2: Mina masuk membawa makanan..."
        ]
    }
    
    ${useDialog ? "Gunakan format naskah dengan dialog." : "Gunakan format narasi deskriptif tanpa dialog."}
    `;

    // ... (Panggil API Chat disini, parse JSON result, simpan ke State) ...
};
