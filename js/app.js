(function () {
  "use strict";

  const config = window.SCREEN_FLOW_CONFIG;
  const sceneTabs = document.getElementById("scene-tabs");
  const flowTitle = document.getElementById("flow-title");
  const flowchartImage = document.getElementById("flowchart-image");
  const flowchartCanvas = document.querySelector(".flowchart-canvas");
  const flowchartEmpty = document.getElementById("flowchart-empty");
  const hotspotLayer = document.getElementById("hotspot-layer");
  const previewTitle = document.getElementById("preview-title");
  const previewContent = document.getElementById("preview-content");
  const screenNumber = document.getElementById("screen-number");
  const debugToggle = document.getElementById("debug-toggle");

  if (!config || !Array.isArray(config.flows) || config.flows.length === 0) {
    previewContent.textContent = "設定ファイルを読み込めませんでした。";
    return;
  }

  config.flows.forEach(function (flow, index) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scene-tab";
    button.dataset.flowId = flow.id;
    button.innerHTML = '<span class="scene-tab-number">' + escapeHtml(flow.number || String(index + 1).padStart(2, "0")) + '</span><span>' + escapeHtml(flow.name) + '</span>';
    button.addEventListener("click", function () { showFlow(flow, button); });
    sceneTabs.appendChild(button);
  });

  debugToggle.addEventListener("change", function () {
    hotspotLayer.classList.toggle("show-hotspots", debugToggle.checked);
  });

  showFlow(config.flows[0], sceneTabs.firstElementChild);

  function showFlow(flow, tab) {
    document.querySelectorAll(".scene-tab").forEach(function (item) {
      const isActive = item === tab;
      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-current", isActive ? "true" : "false");
    });

    flowTitle.textContent = flow.name;
    hotspotLayer.replaceChildren();
    resetPreview();

    flowchartCanvas.hidden = false;
    flowchartEmpty.hidden = true;
    flowchartImage.alt = flow.alt || flow.name + "の画面遷移図";
    flowchartImage.onerror = function () { showMissingFlow(flow); };
    flowchartImage.src = flow.image;

    (flow.screens || []).forEach(function (screen) {
      const hotspot = document.createElement("button");
      hotspot.type = "button";
      hotspot.className = "hotspot";
      hotspot.dataset.screenId = screen.id;
      hotspot.setAttribute("aria-label", screen.name + "をプレビュー");
      hotspot.title = screen.name;
      hotspot.style.left = screen.x + "%";
      hotspot.style.top = screen.y + "%";
      hotspot.style.width = screen.width + "%";
      hotspot.style.height = screen.height + "%";
      hotspot.addEventListener("click", function () { showScreen(screen, hotspot); });
      hotspotLayer.appendChild(hotspot);
    });
  }

  function showMissingFlow(flow) {
    flowchartCanvas.hidden = true;
    flowchartEmpty.hidden = false;
    flowchartEmpty.innerHTML = '<span class="empty-icon" aria-hidden="true">＋</span><p>この画面シーンの遷移図はまだ登録されていません。</p><code>登録予定：' + escapeHtml(flow.image.replace(/^\.\//, "")) + "</code>";
  }

  function showScreen(screen, hotspot) {
    document.querySelectorAll(".hotspot").forEach(function (item) {
      item.classList.toggle("is-active", item === hotspot);
    });

    previewTitle.textContent = screen.name;
    screenNumber.textContent = screen.number || "—";
    previewContent.replaceChildren();
    previewContent.classList.add("has-screen");

    const images = normalizeImages(screen);
    if (images.length === 0) {
      showMissingImage(screen, { path: "画像パス未設定" });
      return;
    }

    const stack = document.createElement("div");
    stack.className = "screen-preview-stack";
    previewContent.appendChild(stack);
    showScreenImage(screen, images, 0, stack);
  }

  function showScreenImage(screen, images, index, stack) {
    stack.replaceChildren();

    if (images.length > 1) {
      const switcher = document.createElement("div");
      switcher.className = "image-switcher";
      switcher.setAttribute("aria-label", screen.name + "の画像切り替え");

      images.forEach(function (imageConfig, imageIndex) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "image-tab";
        button.classList.toggle("is-active", imageIndex === index);
        button.setAttribute("aria-pressed", imageIndex === index ? "true" : "false");
        button.textContent = imageConfig.label || "画像 " + (imageIndex + 1);
        button.addEventListener("click", function () {
          showScreenImage(screen, images, imageIndex, stack);
        });
        switcher.appendChild(button);
      });

      const count = document.createElement("span");
      count.className = "image-count";
      count.textContent = (index + 1) + " / " + images.length;
      switcher.appendChild(count);
      stack.appendChild(switcher);
    }

    const imageStage = document.createElement("div");
    imageStage.className = "screen-image-stage";
    const image = document.createElement("img");
    image.className = "screen-image";
    image.alt = screen.name + "「" + (images[index].label || "画像 " + (index + 1)) + "」";
    image.src = images[index].path;
    image.addEventListener("error", function () {
      showMissingImage(screen, images[index], imageStage);
    }, { once: true });
    imageStage.appendChild(image);
    stack.appendChild(imageStage);
    previewContent.scrollTop = 0;
  }

  function showMissingImage(screen, imageConfig, target) {
    const wrapper = document.createElement("div");
    wrapper.className = "missing-state";

    const message = document.createElement("p");
    message.textContent = "この画面のデザイン画像はまだ登録されていません。";

    const path = document.createElement("code");
    path.textContent = "登録予定：" + String(imageConfig.path || "画像パス未設定").replace(/^\.\//, "");

    wrapper.append(message, path);
    if (target) {
      target.replaceChildren(wrapper);
    } else {
      previewContent.replaceChildren(wrapper);
    }
  }

  function normalizeImages(screen) {
    if (Array.isArray(screen.images)) {
      return screen.images.map(function (item, index) {
        return typeof item === "string" ? { label: "画像 " + (index + 1), path: item } : item;
      }).filter(function (item) { return item && item.path; });
    }
    return screen.image ? [{ label: "デザイン 1", path: screen.image }] : [];
  }

  function resetPreview() {
    previewTitle.textContent = "画面プレビュー";
    screenNumber.textContent = "—";
    previewContent.classList.remove("has-screen");
    previewContent.innerHTML = '<div class="empty-state"><span class="empty-icon" aria-hidden="true">＋</span><p>画面遷移図から確認したいページをクリックしてください。</p></div>';
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character];
    });
  }
})();

