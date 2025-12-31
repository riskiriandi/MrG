function updateSettings(polliKey, imgKey) {
    AppState.settings.pollinationsKey = polliKey.trim();
    AppState.settings.imgbbKey = imgKey.trim();
    saveProject();
    
    // Trigger re-check status UI
    const statusInd = document.getElementById('status-indicator');
    if(statusInd && AppState.settings.imgbbKey) {
        statusInd.innerHTML = `<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span>System Ready</span>`;
        const btnGear = document.getElementById('btn-open-settings');
        if(btnGear) btnGear
