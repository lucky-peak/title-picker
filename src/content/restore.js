(() => {
  let enabled = false;
  let expected = null;
  let setting = false;
  const setTitle = (txt) => {
    setting = true;
    document.title = txt;
    Promise.resolve().then(() => { setting = false; });
  };
  const apply = () => {
    try {
      const href = location.href;
      chrome.storage.local.get(["autoRestoreUrls","autoRestorePrefixes","autoRestorePrefixDisabledUrls", href], (res) => {
        const ul = Array.isArray(res.autoRestoreUrls) ? res.autoRestoreUrls : [];
        const pl = Array.isArray(res.autoRestorePrefixes) ? res.autoRestorePrefixes : [];
        const dl = Array.isArray(res.autoRestorePrefixDisabledUrls) ? res.autoRestorePrefixDisabledUrls : [];
        const exactOn = ul.includes(href);
        const exactSaved = res[href];
        if (exactOn && typeof exactSaved === "string" && exactSaved.trim()) {
          enabled = true;
          expected = exactSaved;
          setTitle(exactSaved);
          return;
        }
        if (dl.includes(href)) { enabled = false; expected = null; return; }
        const matches = pl.filter(p => typeof p === "string" && href.startsWith(p));
        matches.sort((a,b)=> b.length - a.length);
        const longest = matches[0];
        if (!longest) { enabled = false; expected = null; return; }
        chrome.storage.local.get(longest, (r2) => {
          const prefixSaved = r2[longest];
          if (typeof prefixSaved === "string" && prefixSaved.trim()) {
            enabled = true;
            expected = prefixSaved;
            setTitle(prefixSaved);
          } else {
            enabled = false;
            expected = null;
          }
        });
      });
    } catch (_) {}
  };
  const obs = new MutationObserver(() => {
    if (!enabled || setting) return;
    const current = document.title || "";
    if (expected && current !== expected) setTitle(expected);
  });
  const startObserver = () => {
    try {
      const titleEl = document.head && document.head.querySelector("title");
      if (titleEl) obs.observe(titleEl, { characterData: true, childList: true, subtree: true });
      obs.observe(document.head || document.documentElement, { childList: true, subtree: true });
    } catch (_) {}
  };
  const hookHistory = () => {
    try {
      const ps = history.pushState;
      const rs = history.replaceState;
      history.pushState = function() { const r = ps.apply(this, arguments); apply(); return r; };
      history.replaceState = function() { const r = rs.apply(this, arguments); apply(); return r; };
      window.addEventListener("popstate", apply);
    } catch (_) {}
  };
  apply();
  startObserver();
  hookHistory();
})();
