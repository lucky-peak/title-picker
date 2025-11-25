// Helper: only inject on allowed URL schemes (avoid chrome://, edge://, about:, etc.)
function canInject(url) {
    try {
        return /^https?:\/\//.test(url);
    } catch (_) {
        return false;
    }
}

// clicking the action opens popup via manifest; no injection here

chrome.commands.onCommand.addListener((cmd) => {
    console.log(cmd);
    if (cmd === "activate-selector") {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            const t = tabs && tabs[0];
            if (!t || !t.id || !t.url || !canInject(t.url)) return;
            chrome.scripting
                .executeScript({ target: { tabId: t.id }, files: ["src/content/selector.js"] })
                .catch((err) => console.warn("ExecuteScript failed", err));
        });
    } else if (cmd === "set-title-input") {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            const t = tabs && tabs[0];
            if (!t || !t.id || !t.url || !canInject(t.url)) return;
            chrome.scripting
                .executeScript({ target: { tabId: t.id }, files: ["src/content/ui.js"] })
                .catch((err) => console.warn("ExecuteScript failed", err));
        });
    }
});

// no context menus; per-URL restore managed in popup
