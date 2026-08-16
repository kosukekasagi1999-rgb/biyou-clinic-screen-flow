(function () {
  "use strict";

  const config = window.SCREEN_FLOW_CONFIG;
  const sceneTabs = document.getElementById("scene-tabs");
  const flowTitle = document.getElementById("flow-title");
  const flowchartImage = document.getElementById("flowchart-image");
  const mermaidChart = document.getElementById("flowchart-mermaid");
  const flowchartCanvas = document.querySelector(".flowchart-canvas");
  const flowchartStage = document.getElementById("flowchart-stage");
  const flowchartEmpty = document.getElementById("flowchart-empty");
  const hotspotLayer = document.getElementById("hotspot-layer");
  const previewTitle = document.getElementById("preview-title");
  const previewContent = document.getElementById("preview-content");
  const screenNumber = document.getElementById("screen-number");
  const debugToggle = document.getElementById("debug-toggle");
  const zoomOutButton = document.getElementById("zoom-out");
  const zoomResetButton = document.getElementById("zoom-reset");
  const zoomInButton = document.getElementById("zoom-in");
  let activeFlowId = "";
  let mermaidPromise;
  let renderSequence = 0;
  let zoomLevel = 1;
  const zoomMin = 0.5;
  const zoomMax = 2;
  const zoomStep = 0.25;

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

  zoomOutButton.addEventListener("click", function () { setZoom(zoomLevel - zoomStep); });
  zoomResetButton.addEventListener("click", function () { setZoom(1); });
  zoomInButton.addEventListener("click", function () { setZoom(zoomLevel + zoomStep); });

  flowchartStage.addEventListener("keydown", function (event) {
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      setZoom(zoomLevel + zoomStep);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      setZoom(zoomLevel - zoomStep);
    } else if (event.key === "0") {
      event.preventDefault();
      setZoom(1);
    }
  });

  flowchartStage.addEventListener("wheel", function (event) {
    if (!event.ctrlKey) return;
    event.preventDefault();
    setZoom(zoomLevel + (event.deltaY < 0 ? zoomStep : -zoomStep));
  }, { passive: false });

  setZoom(1);
  showFlow(config.flows[0], sceneTabs.firstElementChild);

  function setZoom(value) {
    zoomLevel = Math.min(zoomMax, Math.max(zoomMin, Math.round(value / zoomStep) * zoomStep));
    flowchartCanvas.style.setProperty("--flow-zoom", zoomLevel);
    zoomResetButton.textContent = Math.round(zoomLevel * 100) + "%";
    zoomResetButton.setAttribute("aria-label", "現在" + Math.round(zoomLevel * 100) + "%、100%に戻す");
    zoomOutButton.disabled = zoomLevel <= zoomMin;
    zoomInButton.disabled = zoomLevel >= zoomMax;
  }

  function showFlow(flow, tab) {
    activeFlowId = flow.id;
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

    if (flow.type === "mermaid") renderMermaidFlow(flow);
    else renderImageFlow(flow);
  }

  function renderImageFlow(flow) {
    flowchartCanvas.classList.remove("is-mermaid");
    mermaidChart.hidden = true;
    mermaidChart.replaceChildren();
    flowchartImage.hidden = false;
    flowchartImage.alt = flow.alt || flow.name + "の画面遷移図";
    flowchartImage.onload = function () { createRasterHotspots(flow); };
    flowchartImage.onerror = function () { showMissingFlow(flow); };
    flowchartImage.src = flow.image;
  }

  async function renderMermaidFlow(flow) {
    flowchartCanvas.classList.add("is-mermaid");
    flowchartImage.hidden = true;
    mermaidChart.hidden = false;
    mermaidChart.innerHTML = '<div class="diagram-loading">画面遷移図を読み込んでいます…</div>';
    const sequence = ++renderSequence;
    try {
      const mermaid = await getMermaid();
      const result = await mermaid.render("screen-flow-" + flow.id + "-" + sequence, flow.source);
      if (activeFlowId !== flow.id || sequence !== renderSequence) return;
      mermaidChart.innerHTML = result.svg;
      const svg = mermaidChart.querySelector("svg");
      if (svg) {
        svg.setAttribute("role", "img");
        svg.setAttribute("aria-label", flow.alt || flow.name + "の画面遷移図");
      }
      requestAnimationFrame(function () { createMermaidHotspots(flow); });
    } catch (error) {
      if (activeFlowId === flow.id) {
        showFlowError("画面遷移図を表示できませんでした。ネットワーク接続を確認してください。");
      }
    }
  }

  function getMermaid() {
    if (!mermaidPromise) {
      mermaidPromise = import("https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs").then(function (module) {
        module.default.initialize({ startOnLoad: false, securityLevel: "strict" });
        return module.default;
      });
    }
    return mermaidPromise;
  }

  function createMermaidHotspots(flow) {
    hotspotLayer.replaceChildren();
    const canvasRect = flowchartCanvas.getBoundingClientRect();
    if (!canvasRect.width || !canvasRect.height) return;

    (flow.screens || []).forEach(function (screen) {
      const marker = "-flowchart-" + screen.nodeId + "-";
      const node = Array.from(mermaidChart.querySelectorAll("g.node")).find(function (item) {
        return item.id.indexOf(marker) !== -1 || item.getAttribute("data-id") === screen.nodeId;
      });
      if (!node) return;
      const rect = node.getBoundingClientRect();
      addHotspot(screen, {
        x: ((rect.left - canvasRect.left) / canvasRect.width) * 100,
        y: ((rect.top - canvasRect.top) / canvasRect.height) * 100,
        width: (rect.width / canvasRect.width) * 100,
        height: (rect.height / canvasRect.height) * 100
      });
    });
  }

  function createRasterHotspots(flow) {
    hotspotLayer.replaceChildren();
    (flow.screens || []).forEach(function (screen) {
      if ([screen.x, screen.y, screen.width, screen.height].every(Number.isFinite)) addHotspot(screen, screen);
    });
  }

  function addHotspot(screen, position) {
    const hotspot = document.createElement("button");
    hotspot.type = "button";
    hotspot.className = "hotspot";
    hotspot.dataset.screenId = screen.id;
    hotspot.setAttribute("aria-label", screen.name + "をプレビュー");
    hotspot.title = screen.name;
    hotspot.style.left = position.x + "%";
    hotspot.style.top = position.y + "%";
    hotspot.style.width = position.width + "%";
    hotspot.style.height = position.height + "%";
    hotspot.addEventListener("click", function () { showScreen(screen, hotspot); });
    hotspotLayer.appendChild(hotspot);
  }

  function showMissingFlow(flow) {
    flowchartCanvas.hidden = true;
    flowchartEmpty.hidden = false;
    flowchartEmpty.innerHTML = '<span class="empty-icon" aria-hidden="true">＋</span><p>この画面シーンの遷移図はまだ登録されていません。</p><code>登録予定：' + escapeHtml(String(flow.image || "画像パス未設定").replace(/^\.\//, "")) + "</code>";
  }

  function showFlowError(message) {
    flowchartCanvas.hidden = true;
    flowchartEmpty.hidden = false;
    flowchartEmpty.innerHTML = '<span class="empty-icon" aria-hidden="true">!</span><p>' + escapeHtml(message) + "</p>";
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
        button.addEventListener("click", function () { showScreenImage(screen, images, imageIndex, stack); });
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
    image.addEventListener("error", function () { showMissingImage(screen, images[index], imageStage); }, { once: true });
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
    if (target) target.replaceChildren(wrapper);
    else previewContent.replaceChildren(wrapper);
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

