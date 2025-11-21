(() => {
  // Restore title only if autoRestore is enabled and current URL/domain is not blacklisted
  try {
    chrome.storage.local.get([
      "autoRestore",
      "autoRestoreBlacklistExact",
      "autoRestoreBlacklistDomains",
      location.href,
    ], (res) => {
      if (!res.autoRestore) return;

      const exactList = Array.isArray(res.autoRestoreBlacklistExact) ? res.autoRestoreBlacklistExact : [];
      const domainList = Array.isArray(res.autoRestoreBlacklistDomains) ? res.autoRestoreBlacklistDomains : [];

      const href = location.href;
      const host = location.hostname || "";

      const isExactBlocked = exactList.includes(href);
      const isDomainBlocked = domainList.includes(host);
      if (isExactBlocked || isDomainBlocked) return;

      const saved = res[href];
      if (typeof saved === "string" && saved.trim()) {
        document.title = saved;
      }
    });
  } catch (_) {
    // Fail silently if storage API is not available for some reason
  }
})();