(() => {
  if (window.__title_picker_input_active__) return;
  window.__title_picker_input_active__ = true;

  // i18n messages for UI labels (English/Chinese)
  const lang = (navigator.language || "").toLowerCase();
  const isZh = lang.startsWith("zh");
  const MESSAGES = {
    en: {
      title: "Set Tab Title",
      placeholder: "Enter a title",
      confirm: "Confirm",
      cancel: "Cancel",
    },
    zh: {
      title: "设置标签页标题",
      placeholder: "请输入标题",
      confirm: "确认",
      cancel: "取消",
    },
  };
  const t = isZh ? MESSAGES.zh : MESSAGES.en;

  const overlay = document.createElement("div");
  overlay.className = "__title_picker_input_overlay__";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.background = "rgba(0,0,0,0.35)";
  overlay.style.zIndex = "2147483646";
  overlay.style.display = "block";

  const modal = document.createElement("div");
  modal.className = "__title_picker_input_modal__";
  modal.style.background = "#fff";
  modal.style.borderRadius = "8px";
  modal.style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
  modal.style.minWidth = "320px";
  modal.style.maxWidth = "80vw";
  modal.style.padding = "16px";
  modal.style.fontFamily = "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif";
  modal.style.position = "fixed";
  modal.style.top = "50vh";
  modal.style.left = "50vw";
  modal.style.transform = "translate(-50%, -50%)";

  const title = document.createElement("div");
  title.textContent = t.title;
  title.style.fontSize = "16px";
  title.style.fontWeight = "600";
  title.style.marginBottom = "10px";

  const input = document.createElement("input");
  input.type = "text";
  input.value = document.title || "";
  input.placeholder = t.placeholder;
  input.style.width = "100%";
  input.style.boxSizing = "border-box";
  input.style.padding = "8px 10px";
  input.style.fontSize = "14px";
  input.style.border = "1px solid #d0d7de";
  input.style.borderRadius = "6px";

  const actions = document.createElement("div");
  actions.style.display = "flex";
  actions.style.justifyContent = "flex-end";
  actions.style.gap = "8px";
  actions.style.marginTop = "12px";

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = t.cancel;
  cancelBtn.style.padding = "8px 12px";
  cancelBtn.style.fontSize = "14px";
  cancelBtn.style.border = "1px solid #d0d7de";
  cancelBtn.style.borderRadius = "6px";
  cancelBtn.style.background = "#fff";
  cancelBtn.style.cursor = "pointer";

  const okBtn = document.createElement("button");
  okBtn.textContent = t.confirm;
  okBtn.style.padding = "8px 12px";
  okBtn.style.fontSize = "14px";
  okBtn.style.border = "1px solid #1f883d";
  okBtn.style.borderRadius = "6px";
  okBtn.style.background = "#2da44e";
  okBtn.style.color = "#fff";
  okBtn.style.cursor = "pointer";

  actions.append(cancelBtn, okBtn);
  modal.append(title, input, actions);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Focus and select existing title by default for quick editing
  input.focus({ preventScroll: true });
  requestAnimationFrame(() => {
    try {
      input.select();
    } catch (_) {
      // In some environments select() may fail; use setSelectionRange as a fallback
      try {
        input.setSelectionRange(0, input.value.length);
      } catch (_) {}
    }
  });

  function cleanup() {
    overlay.remove();
    window.__title_picker_input_active__ = false;
    document.removeEventListener("keydown", onKeydown, true);
  }

  function confirm() {
    const text = input.value.trim();
    if (text) {
      chrome.storage.local.set({ [location.href]: text });
      document.title = text;
    }
    cleanup();
  }

  function cancel() {
    cleanup();
  }

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      cancel();
    } else if (e.key === "Enter") {
      e.preventDefault();
      confirm();
    }
  }

  okBtn.addEventListener("click", confirm);
  cancelBtn.addEventListener("click", cancel);
  document.addEventListener("keydown", onKeydown, true);
})();
