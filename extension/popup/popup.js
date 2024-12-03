console.log("This is an extension")

// Add at the beginning of the file, before DOMContentLoaded
window.addEventListener('message', function (event) {
    console.log("Popup received message:", event.data);
    if (event.data.type === 'setSelectedText') {
        const inputText = document.getElementById('input-text');
        if (inputText) {
            inputText.value = event.data.text;
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const inputText = document.getElementById("input-text");
    const outputDiv = document.getElementById("output");

    // Add this at the beginning of your DOMContentLoaded event listener
    window.addEventListener('message', function (event) {
        if (event.data.type === 'setSelectedText') {
            console.log(event.data.text);
            document.getElementById('input-text').value = event.data.text;
        }
    });

    // Load selected text from storage when popup opens
    chrome.storage.local.get('selectedText', function (data) {
        if (data.selectedText) {
            document.getElementById('input-text').value = data.selectedText;
            // Clear the storage after using it
            chrome.storage.local.remove('selectedText');
        }
    });

    // Summarize Button
    document.getElementById("summarize-btn").addEventListener("click", async () => {
        const text = inputText.value;
        const options = {
            sharedContext: "General audience",
            type: "key-points",
            format: "plain-text",
            length: "medium",
        };
        if ('ai' in self && 'summarizer' in self.ai) {
            try {
                const summarizer = await ai.summarizer.create(options);
                const summary = await summarizer.summarize(text);
                outputDiv.textContent = summary || "No summary generated.";
            } catch (error) {
                console.error("Summarizer API error:", error);
                outputDiv.textContent = "Failed to summarize.";
            }
        } else {
            outputDiv.textContent = "Summarizer API not supported in this browser.";
        }
    });


    // Translate Button
    document.getElementById("translate-btn").addEventListener("click", async () => {
        const text = inputText.value;
        const translation = await callAIAPI("translate", text, { targetLanguage: "es" }); // Example: Spanish
        outputDiv.textContent = translation || "No translation available.";
    });

    // Rewrite Button
    document.getElementById("rewrite-btn").addEventListener("click", async () => {
        const text = inputText.value;
        const rewritten = await callAIAPI("rewrite", text, { tone: "formal" });
        outputDiv.textContent = rewritten || "No rewritten text generated.";
    });

    // Clear Button
    document.getElementById("clear-btn").addEventListener("click", () => {
        inputText.value = ""; // Clear the text
        outputDiv.textContent = ""; // Clear the output
    });
    // API Call Function
    async function callAIAPI(type, text, options = {}) {
        try {
            const apiUrl = `chrome-ai-api/${type}`; // Example API endpoint
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, ...options }),
            });
            const data = await response.json();
            return data.result;
        } catch (error) {
            console.error("API error:", error);
            return null;
        }
    }
});
