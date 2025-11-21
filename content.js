(function () {
    if (window.__title_picker_active__) return;
    window.__title_picker_active__ = true;

    // CSS
    const style = document.createElement("style");
    style.innerHTML = `
        .__title_picker_highlight__ {
            outline: 2px solid #4CAF50 !important;
            cursor: pointer !important;
        }
    `;
    document.head.appendChild(style);

    let lastEl = null;

    function activatePicker() {
        document.addEventListener("mouseover", onHover);
        document.addEventListener("click", onClick, true);
        document.addEventListener("keydown", onKeydown, true);
    }

    function deactivatePicker() {
        document.removeEventListener("mouseover", onHover);
        document.removeEventListener("click", onClick, true);
        document.removeEventListener("keydown", onKeydown, true);
        if (lastEl) lastEl.classList.remove("__title_picker_highlight__");
        window.__title_picker_active__ = false;
    }

    function onHover(e) {
        if (lastEl) lastEl.classList.remove("__title_picker_highlight__");
        lastEl = e.target;
        lastEl.classList.add("__title_picker_highlight__");
    }

    function onClick(e) {
        e.preventDefault();
        e.stopPropagation();

        const text = e.target.innerText.trim();
        if (text) {
            chrome.storage.local.set({ [location.href]: text });
            document.title = text;
        }

        deactivatePicker();
    }

    function onKeydown(e) {
        if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            deactivatePicker();
        }
    }

    // restore last title
    chrome.storage.local.get(location.href, (res) => {
        if (res[location.href]) {
            document.title = res[location.href];
        }
    });

    // start selection mode
    activatePicker();
})();