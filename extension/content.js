console.log("Content script loaded");

// Check if elements already exist
if (!document.getElementById('simply-floating-button')) {
    console.log("Content script initializing");

    // Create the floating button
    const floatingButton = document.createElement("div");
    floatingButton.id = "simply-floating-button";
    floatingButton.innerHTML = `<img src="${chrome.runtime.getURL("images/icon.png")}" width="24" height="24">`;
    floatingButton.style.display = "none";
    document.body.appendChild(floatingButton);

    // Create the side panel
    const sidePanel = document.createElement("div");
    sidePanel.id = "simply-side-panel";
    sidePanel.style.display = "none";
    sidePanel.innerHTML = `
        <div id="simply-panel-header">
            <button id="close-panel">×</button>
            <h3>Simply</h3>
        </div>
        <iframe src="${chrome.runtime.getURL("popup/popup.html")}" frameborder="0"></iframe>
    `;
    document.body.appendChild(sidePanel);

    // Event Listeners for Floating Button and Panel
    floatingButton.addEventListener("click", () => {
        console.log("Floating button clicked");
        sidePanel.style.display = "block";
        floatingButton.style.display = "none"; // Hide floating button when panel opens
    });

    sidePanel.querySelector("#close-panel").addEventListener("click", () => {
        console.log("Close panel clicked");
        sidePanel.style.display = "none";
        floatingButton.style.display = "block"; // Show floating button when panel closes
    });
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Message received:", request);

    if (request.action === "setSelectedText") {
        const iframe = document.querySelector('#simply-side-panel iframe');
        if (iframe) {
            // Wait for iframe to load
            iframe.addEventListener('load', () => {
                iframe.contentWindow.postMessage({
                    type: 'setSelectedText',
                    text: request.text
                }, '*');
            });

            // Also try immediately in case iframe is already loaded
            iframe.contentWindow.postMessage({
                type: 'setSelectedText',
                text: request.text
            }, '*');
        }
    }

    if (request.action === "toggleFloatingButton") {
        console.log("Toggling floating button");
        const floatingButton = document.getElementById('simply-floating-button');
        const sidePanel = document.getElementById('simply-side-panel');
        if (floatingButton && sidePanel) {
            if (sidePanel.style.display === "block") {
                sidePanel.style.display = "none";
                floatingButton.style.display = "block";
            } else {
                floatingButton.style.display = floatingButton.style.display === "none" ? "block" : "none";
            }
        }
    }
});
