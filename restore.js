(() => {
  try {
    chrome.storage.local.get(["autoRestoreUrls", location.href], (res) => {
      const list = Array.isArray(res.autoRestoreUrls) ? res.autoRestoreUrls : [];
      if (!list.includes(location.href)) return;
      const saved = res[location.href];
      if (typeof saved === "string" && saved.trim()) {
        document.title = saved;
      }
    });
  } catch (_) {}
})();
