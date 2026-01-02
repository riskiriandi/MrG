window.toggleDialogMode = () => {
    const current = window.appState.project.story.useDialog;
    window.appState.project.story.useDialog = !current;
    updateDialogUI(!current);
};

function updateDialogUI(isOn) {
    const btn = document.getElementById('toggle-dialog');
    const circle = document.getElementById('toggle-circle');
    const status = document.getElementById('dialog-status');
    
    if(btn && circle && status) {
        if(isOn) {
            btn.classList.replace('bg-gray-600', 'bg-accent');
            circle.classList.replace('left-0.5', 'translate-x-5');
            status.innerText = "ON";
            status.classList.add('text-accent');
        } else {
            btn.classList.replace('bg-accent', 'bg-gray-600');
            circle.classList.remove('translate-x-5');
            circle.classList.add('left-0.5');
            status.innerText = "OFF";
            status.classList.remove('text-accent');
        }
    }
}

// 3. GENERATE STORY (LOGIC TERPISAH)
window.generateStory = async () => {
    const input = document.getElementById('story-input').value;
    if(!input) return showToast("Isi ide ceritanya dulu bro!", "error");

    const btn = document.querySelector('button[onclick="generateStory()"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = `<i class="ph ph-spinner animate-spin"></i> Menulis Naskah...`;
    btn.disabled = true;

    try {
        const useDialog = window.appState.project.story.useDialog;
        
        // === A. RACIK INSTRUKSI BERDASARKAN MODE ===
        
