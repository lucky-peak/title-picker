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
        .executeScript({ target: { tabId: tab.id }, files: ["content.js"] })
        .catch((err) => console.warn("ExecuteScript failed", err));
});

chrome.commands.onCommand.addListener((cmd) => {
    console.log(cmd);
    if (cmd === "activate-selector") {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            const t = tabs && tabs[0];
            if (!t || !t.id || !t.url || !canInject(t.url)) return;
            chrome.scripting
                .executeScript({ target: { tabId: t.id }, files: ["content.js"] })
                .catch((err) => console.warn("ExecuteScript failed", err));
        });
    } else if (cmd === "set-title-input") {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            const t = tabs && tabs[0];
            if (!t || !t.id || !t.url || !canInject(t.url)) return;
            chrome.scripting
                .executeScript({ target: { tabId: t.id }, files: ["input.js"] })
                .catch((err) => console.warn("ExecuteScript failed", err));
        });
    }
});

// Initialize default settings on install/update
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(["autoRestore", "autoRestoreBlacklistExact", "autoRestoreBlacklistDomains"], (res) => {
        const init = {};
        if (res.autoRestore === undefined) init.autoRestore = false;
        if (!Array.isArray(res.autoRestoreBlacklistExact)) init.autoRestoreBlacklistExact = [];
        if (!Array.isArray(res.autoRestoreBlacklistDomains)) init.autoRestoreBlacklistDomains = [];
        if (Object.keys(init).length) chrome.storage.local.set(init);

        const checked = !!res.autoRestore;
        const lang = (navigator.language || "").toLowerCase();
        const isZh = lang.startsWith("zh");
        const title = isZh ? "自动恢复标题" : "Auto Restore Title";
        if (chrome.contextMenus && chrome.contextMenus.removeAll) {
            chrome.contextMenus.removeAll(() => {
                if (!chrome.contextMenus || !chrome.contextMenus.create) return;
                chrome.contextMenus.create({
                    id: "toggle-auto-restore",
                    title,
                    type: "checkbox",
                    checked,
                    contexts: ["action"],
                });
                chrome.contextMenus.create({
                    id: "toggle-exclude-url",
                    title: isZh ? "排除当前链接" : "Exclude This URL",
                    type: "checkbox",
                    checked: false,
                    contexts: ["action"],
                });
                chrome.contextMenus.create({
                    id: "toggle-exclude-domain",
                    title: isZh ? "排除当前域名" : "Exclude This Domain",
                    type: "checkbox",
                    checked: false,
                    contexts: ["action"],
                });
            });
        }
    });
});

chrome.runtime.onStartup.addListener(() => {
    chrome.storage.local.get("autoRestore", (res) => {
        const checked = !!res.autoRestore;
        const lang = (navigator.language || "").toLowerCase();
        const isZh = lang.startsWith("zh");
        const title = isZh ? "自动恢复标题" : "Auto Restore Title";
        if (chrome.contextMenus && chrome.contextMenus.removeAll) {
            chrome.contextMenus.removeAll(() => {
                if (!chrome.contextMenus || !chrome.contextMenus.create) return;
                chrome.contextMenus.create({
                    id: "toggle-auto-restore",
                    title,
                    type: "checkbox",
                    checked,
                    contexts: ["action"],
                });
                chrome.contextMenus.create({
                    id: "toggle-exclude-url",
                    title: isZh ? "排除当前链接" : "Exclude This URL",
                    type: "checkbox",
                    checked: false,
                    contexts: ["action"],
                });
                chrome.contextMenus.create({
                    id: "toggle-exclude-domain",
                    title: isZh ? "排除当前域名" : "Exclude This Domain",
                    type: "checkbox",
                    checked: false,
                    contexts: ["action"],
                });
            });
        }
    });
});

if (chrome.contextMenus && chrome.contextMenus.onClicked) chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "toggle-auto-restore") {
        chrome.storage.local.set({ autoRestore: !!info.checked });
        return;
    }
    if (info.menuItemId === "toggle-exclude-url") {
        const href = (tab && tab.url) ? tab.url : null;
        if (!href) {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
                const t = tabs && tabs[0];
                const u = t && t.url;
                if (!u) return;
                chrome.storage.local.get("autoRestoreBlacklistExact", (res) => {
                    const list = Array.isArray(res.autoRestoreBlacklistExact) ? res.autoRestoreBlacklistExact : [];
                    const next = new Set(list);
                    if (info.checked) next.add(u); else next.delete(u);
                    chrome.storage.local.set({ autoRestoreBlacklistExact: Array.from(next) });
                });
            });
        } else {
            chrome.storage.local.get("autoRestoreBlacklistExact", (res) => {
                const list = Array.isArray(res.autoRestoreBlacklistExact) ? res.autoRestoreBlacklistExact : [];
                const next = new Set(list);
                if (info.checked) next.add(href); else next.delete(href);
                chrome.storage.local.set({ autoRestoreBlacklistExact: Array.from(next) });
            });
        }
        return;
    }
    if (info.menuItemId === "toggle-exclude-domain") {
        const host = (tab && new URL(tab.url).hostname) ? new URL(tab.url).hostname : null;
        const apply = (h) => {
            chrome.storage.local.get("autoRestoreBlacklistDomains", (res) => {
                const list = Array.isArray(res.autoRestoreBlacklistDomains) ? res.autoRestoreBlacklistDomains : [];
                const next = new Set(list);
                if (info.checked) next.add(h); else next.delete(h);
                chrome.storage.local.set({ autoRestoreBlacklistDomains: Array.from(next) });
            });
        };
        if (host) {
            apply(host);
        } else {
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
                const t = tabs && tabs[0];
                if (!t || !t.url) return;
                try { apply(new URL(t.url).hostname); } catch (_) {}
            });
        }
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.autoRestore) {
        if (chrome.contextMenus && chrome.contextMenus.update) {
            chrome.contextMenus.update("toggle-auto-restore", { checked: !!changes.autoRestore.newValue });
        }
    }
});

// Update blacklist checkbox states when the menu is shown on the action icon
if (chrome.contextMenus && chrome.contextMenus.onShown) chrome.contextMenus.onShown.addListener((info, tab) => {
    if (!tab || !tab.url) return;
    chrome.storage.local.get(["autoRestoreBlacklistExact", "autoRestoreBlacklistDomains"], (res) => {
        const exact = Array.isArray(res.autoRestoreBlacklistExact) ? res.autoRestoreBlacklistExact : [];
        const domains = Array.isArray(res.autoRestoreBlacklistDomains) ? res.autoRestoreBlacklistDomains : [];
        const isExact = exact.includes(tab.url);
        let host = null;
        try { host = new URL(tab.url).hostname; } catch (_) {}
        const isDomain = host ? domains.includes(host) : false;
        if (chrome.contextMenus && chrome.contextMenus.update) {
            chrome.contextMenus.update("toggle-exclude-url", { checked: isExact });
            chrome.contextMenus.update("toggle-exclude-domain", { checked: isDomain });
            if (chrome.contextMenus.refresh) chrome.contextMenus.refresh();
        }
    });
});