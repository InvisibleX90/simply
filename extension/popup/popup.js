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
    const settingsContainer = document.getElementById("settings-container");

    // Action buttons
    const actionButtons = document.querySelectorAll('.action-btn');
    actionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all buttons
            actionButtons.forEach(b => b.classList.remove('active'));
            // Add active class to clicked button
            btn.classList.add('active');

            // Show settings only for summarize action
            if (btn.dataset.action === 'summarize') {
                settingsContainer.style.display = 'block';
            } else {
                settingsContainer.style.display = 'none';
            }
        });
    });

    // Go button and call the model
    document.getElementById("go-btn").addEventListener("click", async () => {
        const activeAction = document.querySelector('.action-btn.active');
        if (activeAction && activeAction.dataset.action === 'summarize') {
            const text = inputText.value;
            const summaryType = document.getElementById("summary-type").value;
            const format = document.getElementById("summary-format").value;
            const lengthSlider = document.getElementById("summary-length");
            const lengthValues = ["short", "medium", "long"];
            const length = lengthValues[lengthSlider.value];
            const context = document.getElementById("context-input").value;

            // loading message
            outputDiv.textContent = "Generating summary...";

            try {
                if ('ai' in self && 'summarizer' in self.ai) {
                    const summarizer = await ai.summarizer.create({
                        sharedContext: context || "General audience",
                        type: summaryType,
                        format: format,
                        length: length,
                    });
                    const summary = await summarizer.summarize(text);
                    outputDiv.textContent = summary || "No summary generated.";
                } else {
                    outputDiv.textContent = "Summarizer API not supported in this browser.";
                }
            } catch (error) {
                console.error("Summarizer API error:", error);
                outputDiv.textContent = "Failed to summarize.";
            }
        }
    });

    // Clear button
    document.getElementById("clear-btn").addEventListener("click", () => {
        inputText.value = "";
        outputDiv.textContent = "";
    });

    // Load selected text from storage when popup opens
    chrome.storage.local.get('selectedText', function (data) {
        if (data.selectedText) {
            document.getElementById('input-text').value = data.selectedText;
            // Clear the storage after using it
            chrome.storage.local.remove('selectedText');
        }
    });

    // // Add this at the beginning of your DOMContentLoaded event listener
    // window.addEventListener('message', function (event) {
    //     if (event.data.type === 'setSelectedText') {
    //         console.log(event.data.text);
    //         document.getElementById('input-text').value = event.data.text;
    //     }
    // });

    // To handle the length slider label updates
    document.getElementById("summary-length").addEventListener("input", (e) => {
        const labels = document.querySelectorAll('.length-label');
        labels.forEach((label, index) => {
            if (index === parseInt(e.target.value)) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        });
    });

    // // Add this to set initial active state
    // document.addEventListener('DOMContentLoaded', () => {
    //     const labels = document.querySelectorAll('.length-label');
    //     labels[1].classList.add('active'); // Medium is selected by default
    // });

    // Set initial active state for the slider
    document.querySelectorAll('.length-label')[1].classList.add('active'); // Medium is selected by default

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

    document.getElementById('copy-btn').addEventListener('click', async () => {
        const output = document.getElementById('output');
        const textToCopy = output.textContent;  // Get the text to copy

        try {
            // Try Clipboard API first
            await navigator.clipboard.writeText(textToCopy);
            const originalText = output.textContent;
            output.textContent = 'Copied!';  // Display 'Copied!' message
            setTimeout(() => {
                output.textContent = originalText;  // Restore original text after 1 second
            }, 1000);
        } catch (err) {
            // If Clipboard API fails, fall back to document.execCommand
            try {
                const textarea = document.createElement('textarea');
                textarea.value = textToCopy;
                textarea.style.position = 'fixed';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');  // Use execCommand to copy text

                const originalText = textToCopy;
                output.textContent = 'Copied!';
                setTimeout(() => {
                    output.textContent = originalText;
                }, 1000);

                document.body.removeChild(textarea);  // Clean up temporary textarea element
            } catch (err) {
                console.error('Failed to copy text:', err);
            }
        }
    });

});
