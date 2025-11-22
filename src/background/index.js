// Helper: only inject on allowed URL schemes (avoid chrome://, edge://, about:, etc.)
function canInject(url) {
    try {
        return /^https?:\/\//.test(url);
    } catch (_) {
        return false;
    }
}

chrome.action.onClicked.addListener((tab) => {
    if (!tab || !tab.id || !tab.url || !canInject(tab.url)) {
        console.warn("Skip injection: unsupported URL", tab && tab.url);
        return;
    }
    chrome.scripting
        .executeScript({ target: { tabId: tab.id }, files: ["src/content/selector.js"] })
        .catch((err) => console.warn("ExecuteScript failed", err));
});

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

chrome.runtime.onInstalled.addListener(() => {
    const lang = (navigator.language || "").toLowerCase();
    const isZh = lang.startsWith("zh");
    const title = isZh ? "自动恢复当前链接" : "Auto Restore This URL";
    if (chrome.contextMenus && chrome.contextMenus.removeAll) {
        chrome.contextMenus.removeAll(() => {
            if (!chrome.contextMenus || !chrome.contextMenus.create) return;
            chrome.contextMenus.create({
                id: "toggle-auto-restore-url",
                title,
                type: "checkbox",
                checked: false,
                contexts: ["action"],
            });
        });
    }
});

chrome.runtime.onStartup.addListener(() => {
    const lang = (navigator.language || "").toLowerCase();
    const isZh = lang.startsWith("zh");
    const title = isZh ? "自动恢复当前链接" : "Auto Restore This URL";
    if (chrome.contextMenus && chrome.contextMenus.removeAll) {
        chrome.contextMenus.removeAll(() => {
            if (!chrome.contextMenus || !chrome.contextMenus.create) return;
            chrome.contextMenus.create({
                id: "toggle-auto-restore-url",
                title,
                type: "checkbox",
                checked: false,
                contexts: ["action"],
            });
        });
    }
});

if (chrome.contextMenus && chrome.contextMenus.onClicked) chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "toggle-auto-restore-url") {
        const href = tab && tab.url ? tab.url : null;
        const apply = (u) => {
            chrome.storage.local.get("autoRestoreUrls", (res) => {
                const list = Array.isArray(res.autoRestoreUrls) ? res.autoRestoreUrls : [];
                const next = new Set(list);
                if (info.checked) next.add(u); else next.delete(u);
                chrome.storage.local.set({ autoRestoreUrls: Array.from(next) });
            });
        };
        if (href) {
            apply(href);
        } else {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
                const t = tabs && tabs[0];
                const u = t && t.url;
                if (!u) return;
                apply(u);
            });
        }
    }
});

if (chrome.contextMenus && chrome.contextMenus.onShown) chrome.contextMenus.onShown.addListener((info, tab) => {
    if (!tab || !tab.url) return;
    chrome.storage.local.get("autoRestoreUrls", (res) => {
        const list = Array.isArray(res.autoRestoreUrls) ? res.autoRestoreUrls : [];
        const isChecked = list.includes(tab.url);
        if (chrome.contextMenus && chrome.contextMenus.update) {
            chrome.contextMenus.update("toggle-auto-restore-url", { checked: isChecked });
            if (chrome.contextMenus.refresh) chrome.contextMenus.refresh();
        }
    });
});
