(function(){
  const lang = (navigator.language||"").toLowerCase();
  const isZh = lang.startsWith("zh");
  const t = {
    title: isZh? "标题选择器" : "Title Picker",
    label: isZh? "为当前链接启用自动恢复" : "Auto Restore This URL",
    hintOn: isZh? "已加入白名单：后续访问将恢复已保存标题" : "Whitelisted: future visits restore the saved title",
    hintOff: isZh? "未加入白名单：默认不自动恢复" : "Not whitelisted: no auto-restore by default",
  };

  const $ = (id) => document.getElementById(id);
  $("title").textContent = t.title;
  $("hint").textContent = t.hintOff;
  $("label-text").textContent = t.label;

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
  load();
})();
