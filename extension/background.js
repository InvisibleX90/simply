chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension installed");
    chrome.contextMenus.create({
        id: "simply",
        title: "Process with Simply AI",
        contexts: ["selection"],
    });
});

chrome.action.onClicked.addListener(async (tab) => {
    console.log("Extension icon clicked");

    // Check if we can access this tab
    if (!tab.url || !tab.id) {
        console.log("Invalid tab");
        return;
    }

    if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://') && !tab.url.startsWith('about:')) {
        try {
            // To ensure content script is loaded
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    const floatingButton = document.getElementById('simply-floating-button');
                    if (floatingButton) {
                        floatingButton.style.display = floatingButton.style.display === "none" ? "block" : "none";
                    }
                }
            });
        } catch (error) {
            console.error("Error:", error);
        }
    } else {
        console.log("Cannot access this page due to browser restrictions");
    }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "simply" && info.selectionText) {
        try {
            // First inject the content script
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            });

            // Wait a moment for the content script to initialize
            await new Promise(resolve => setTimeout(resolve, 100));

            // Then send the selected text
            await chrome.tabs.sendMessage(tab.id, {
                action: "setSelectedText",
                text: info.selectionText
            });

            // Show the side panel
            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => {
                    const floatingButton = document.getElementById('simply-floating-button');
                    const sidePanel = document.getElementById('simply-side-panel');
                    if (floatingButton && sidePanel) {
                        sidePanel.style.display = "block";
                        floatingButton.style.display = "none";
                    }
                }
            });
        } catch (error) {
            console.error("Error:", error);
        }
    }
});


