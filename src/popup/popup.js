(function(){
  const lang = (navigator.language||"").toLowerCase();
  const isZh = lang.startsWith("zh");
  const t = {
    title: isZh? "标题选择器" : "Title Picker",
    label: isZh? "为当前链接启用自动恢复" : "Auto Restore This URL",
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
      chrome.storage.local.get(["autoRestoreUrls"], (res)=>{
        const list = Array.isArray(res.autoRestoreUrls) ? res.autoRestoreUrls : [];
        updateUI(list.includes(href));
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

  // prefix config removed

  $("toggle").addEventListener("change", toggleChange);
  $("btn-pick").addEventListener("click", onPick);
  load();
})();
