document.addEventListener('DOMContentLoaded', () => {
    // Load saved notes
    chrome.storage.local.get(['researchNotes'], function (result) {
        if (result.researchNotes) {
            document.getElementById('notes').value = result.researchNotes;
        }
    });

    // Action buttons (except translate)
    document.querySelectorAll('.actions button[data-op]').forEach(button => {
        button.addEventListener('click', () => {
            const operation = button.dataset.op;
            processSelection(operation);
        });
    });

    // Translate button with language selection
    document.getElementById('translateBtn').addEventListener('click', () => {
        const lang = document.getElementById('translateLanguage').value;
        processSelection('translate-' + lang);  // e.g., translate-tamil
    });

    // Save notes
    document.getElementById('saveNotesBtn').addEventListener('click', saveNotes);
});


// Handle processing the selected text
async function processSelection(operation) {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => window.getSelection().toString()
        });

        if (!result) {
            showResult('⚠️ Please select some text first.');
            return;
        }

        const response = await fetch('http://localhost:8080/api/research/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: result, operation })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const text = await response.text();
        showResult(text.replace(/\n/g, '<br>'));

    } catch (error) {
        showResult('❌ Error: ' + error.message);
    }
}


// Save user notes to local storage

document.getElementById('saveNotesBtn').addEventListener('click', () => {
    const notes = document.getElementById('notes').value;
    chrome.storage.local.set({ 'researchNotes': notes }, function () {
        alert('Notes saved successfully.');
    });
});

document.getElementById('exportBtn').addEventListener('click', () => {
    const text = document.getElementById('notes').value;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'research_notes.txt';
    a.click();
    URL.revokeObjectURL(url);
});
document.getElementById('exportBtn').addEventListener('click', () => {
    const text = document.getElementById('notes').value;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'research_notes.txt';
    a.click();
    URL.revokeObjectURL(url);
});



// Display result and add copy button
function showResult(content) {
    const resultsEl = document.getElementById('results');
    resultsEl.innerHTML = `
        <div class="result-item">
            <div class="result-content" id="resultText">${content}</div>
            <button id="copyBtn">Copy</button>
        </div>
    `;

    document.getElementById('copyBtn').addEventListener('click', () => {
        const text = document.getElementById('resultText').innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert('✅ Copied to clipboard!');
        });
    });
}
