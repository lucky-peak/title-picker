(function(){
  const lang = (navigator.language||"").toLowerCase();
  const isZh = lang.startsWith("zh");
  const t = {
    title: isZh? "标题选择器" : "Title Picker",
    label: isZh? "为当前链接启用自动恢复" : "Auto Restore This URL",
    labelPrefix: isZh? "前缀匹配恢复" : "Prefix Restore",
    pick: isZh? "选择页面元素作为标题" : "Pick Element as Title",
    hintOn: isZh? "已加入白名单：后续访问将恢复已保存标题" : "Whitelisted: future visits restore the saved title",
    hintOff: isZh? "未加入白名单：默认不自动恢复" : "Not whitelisted: no auto-restore by default",
    pickOk: isZh? "已开启选择模式" : "Selection mode activated",
    pickFail: isZh? "当前链接不支持" : "Not supported on this URL",
  };

  const $ = (id) => document.getElementById(id);
  $("title").textContent = t.title;
  $("hint").textContent = t.hintOff;
  $("label-text").textContent = t.label;
  const lp = document.getElementById("label-prefix-text");
  if (lp) lp.textContent = t.labelPrefix;
  $("btn-pick-text").textContent = t.pick;

  function updateUI(checked){
    $("toggle").checked = !!checked;
    $("hint").textContent = checked ? t.hintOn : t.hintOff;
  }

  function getActiveTab(cb){
    try {
      chrome.tabs.query({active:true,lastFocusedWindow:true}, (tabs)=>{
        cb(tabs && tabs[0]);
      });
    } catch(_) { cb(null); }
  }

  function canInject(u){
    try { return /^https?:\/\//.test(u); } catch(_) { return false; }
  }

  function onPick(){
    getActiveTab((tab)=>{
      const href = tab && tab.url ? tab.url : null;
      if(!href || !canInject(href)) { $("hint").textContent = t.pickFail; return; }
      try {
        const p = chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["src/content/selector.js"] });
        if (p && typeof p.then === "function") {
          p.then(() => { window.close(); }).catch(() => { $("hint").textContent = t.pickFail; });
        } else {
          window.close();
        }
      } catch(_) { $("hint").textContent = t.pickFail; }
    });
  }

  function load(){
    getActiveTab((tab)=>{
      const href = tab && tab.url ? tab.url : null;
      if(!href){ updateUI(false); return; }
      chrome.storage.local.get(["autoRestoreUrls","autoRestorePrefixes","autoRestorePrefixDisabledUrls"], (res)=>{
        const list = Array.isArray(res.autoRestoreUrls) ? res.autoRestoreUrls : [];
        updateUI(list.includes(href));
        const pList = Array.isArray(res.autoRestorePrefixes) ? res.autoRestorePrefixes : [];
        const dList = Array.isArray(res.autoRestorePrefixDisabledUrls) ? res.autoRestorePrefixDisabledUrls : [];
        const matches = pList.filter(p => typeof p === "string" && href.startsWith(p));
        matches.sort((a,b)=> b.length - a.length);
        const longest = matches[0] || "";
        const pt = document.getElementById("toggle-prefix");
        const pi = document.getElementById("prefix-input");
        const disabled = dList.includes(href);
        if (pt) pt.checked = !!longest && !disabled;
        if (pi) pi.value = longest || href;
      });
    });
  }

  function toggleChange(){
    const checked = $("toggle").checked;
    getActiveTab((tab)=>{
      const href = tab && tab.url ? tab.url : null;
      if(!href) return;
      chrome.storage.local.get("autoRestoreUrls", (res)=>{
        const list = Array.isArray(res.autoRestoreUrls) ? res.autoRestoreUrls : [];
        const next = new Set(list);
        if(checked) next.add(href); else next.delete(href);
        chrome.storage.local.set({ autoRestoreUrls: Array.from(next) }, ()=>{
          updateUI(checked);
        });
      });
    });
  }

  function togglePrefixChange(){
    const checked = document.getElementById("toggle-prefix").checked;
    const typed = (document.getElementById("prefix-input").value || "").trim();
    getActiveTab((tab)=>{
      const href = tab && tab.url ? tab.url : null;
      if(!href) return;
      chrome.storage.local.get(["autoRestorePrefixes","autoRestorePrefixDisabledUrls"], (res)=>{
        const pList = Array.isArray(res.autoRestorePrefixes) ? res.autoRestorePrefixes : [];
        const next = new Set(pList);
        const disabledList = Array.isArray(res.autoRestorePrefixDisabledUrls) ? res.autoRestorePrefixDisabledUrls : [];
        const nextDisabled = new Set(disabledList);
        if (checked) {
          if (typed) next.add(typed);
          nextDisabled.delete(href);
        } else {
          if (typed === href) {
            next.delete(typed);
          } else {
            nextDisabled.add(href);
          }
        }
        chrome.storage.local.set({ autoRestorePrefixes: Array.from(next), autoRestorePrefixDisabledUrls: Array.from(nextDisabled) }, load);
      });
    });
  }

  function onPrefixInput(){
    const typed = (document.getElementById("prefix-input").value || "").trim();
    const checked = document.getElementById("toggle-prefix").checked;
    if (!checked) return;
    getActiveTab((tab)=>{
      const href = tab && tab.url ? tab.url : null; if(!href) return;
      chrome.storage.local.get(["autoRestorePrefixes","autoRestorePrefixDisabledUrls"], (res)=>{
        const pList = Array.isArray(res.autoRestorePrefixes) ? res.autoRestorePrefixes : [];
        const next = new Set(pList);
        if (typed) next.add(typed);
        const disabledList = Array.isArray(res.autoRestorePrefixDisabledUrls) ? res.autoRestorePrefixDisabledUrls : [];
        const nextDisabled = new Set(disabledList);
        nextDisabled.delete(href);
        chrome.storage.local.set({ autoRestorePrefixes: Array.from(next), autoRestorePrefixDisabledUrls: Array.from(nextDisabled) });
      });
    });
  }

  // prefix config removed

  $("toggle").addEventListener("change", toggleChange);
  $("btn-pick").addEventListener("click", onPick);
  const tpf = document.getElementById("toggle-prefix");
  if (tpf) tpf.addEventListener("change", togglePrefixChange);
  const pin = document.getElementById("prefix-input");
  if (pin) pin.addEventListener("input", onPrefixInput);
  load();
})();
