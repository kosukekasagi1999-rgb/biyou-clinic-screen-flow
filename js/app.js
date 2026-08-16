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
  const imageOverrides = {};
  const temporaryImageUrls = new Map();
  const editorMessages = new Map();
  let repositoryDirectory = null;

  if (!config || !Array.isArray(config.flows) || config.flows.length === 0) {
    previewContent.textContent = "設定ファイルを読み込めませんでした。";
    return;
  }

  initialize();

  async function initialize() {
    await loadImageOverrides();

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
  }

  async function loadImageOverrides() {
    try {
      const response = await fetch("./config/image-overrides.json", { cache: "no-store" });
      if (!response.ok) return;
      const data = await response.json();
      const screens = data && data.screens ? data.screens : data;
      if (screens && typeof screens === "object" && !Array.isArray(screens)) Object.assign(imageOverrides, screens);
    } catch (error) {
      // The default screen configuration remains usable when no override file exists.
    }
  }

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
    const stack = document.createElement("div");
    stack.className = "screen-preview-stack";
    previewContent.appendChild(stack);
    if (images.length === 0) {
      showMissingImage(screen, { path: "画像パス未設定" }, stack);
      stack.appendChild(createImageEditor(screen, images, 0, stack));
      return;
    }
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
    image.src = temporaryImageUrls.get(images[index].path) || images[index].path;
    image.addEventListener("error", function () { showMissingImage(screen, images[index], imageStage); }, { once: true });
    imageStage.appendChild(image);
    stack.appendChild(imageStage);
    stack.appendChild(createImageEditor(screen, images, index, stack));
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

  function createImageEditor(screen, images, index, stack) {
    const editor = document.createElement("section");
    editor.className = "image-editor";
    editor.dataset.screenId = screen.id;

    const heading = document.createElement("div");
    heading.className = "image-editor-heading";
    const headingText = document.createElement("div");
    const eyebrow = document.createElement("p");
    eyebrow.className = "image-editor-eyebrow";
    eyebrow.textContent = "IMAGE EDITOR";
    const title = document.createElement("h3");
    title.textContent = "画像の追加・差し替え";
    headingText.append(eyebrow, title);

    const connectButton = document.createElement("button");
    connectButton.type = "button";
    connectButton.className = "repository-connect-button";
    connectButton.textContent = repositoryDirectory ? "保存先を接続済み" : "画像保存先を接続";
    connectButton.addEventListener("click", async function () {
      const connected = await connectRepository(screen.id);
      if (connected) refreshRepositoryConnectionState();
    });
    heading.append(headingText, connectButton);

    const dropZone = document.createElement("div");
    dropZone.className = "image-drop-zone";
    dropZone.tabIndex = 0;
    dropZone.setAttribute("role", "button");
    dropZone.setAttribute("aria-label", screen.name + "へ画像を追加");
    dropZone.innerHTML = '<span class="drop-zone-icon" aria-hidden="true">＋</span><strong>画像をドラッグ＆ドロップ</strong><span>またはクリックして画像を選択</span>';

    const fileInput = document.createElement("input");
    fileInput.className = "image-file-input";
    fileInput.type = "file";
    fileInput.accept = "image/png,image/jpeg,image/webp,image/gif";
    fileInput.multiple = true;
    fileInput.tabIndex = -1;

    function chooseFiles() {
      if (!repositoryDirectory) {
        setEditorMessage(screen.id, "先に「画像保存先を接続」を押して、Cloneしたフォルダを選択してください。", true);
        connectButton.focus();
        return;
      }
      fileInput.click();
    }

    dropZone.addEventListener("click", chooseFiles);
    dropZone.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        chooseFiles();
      }
    });
    ["dragenter", "dragover"].forEach(function (eventName) {
      dropZone.addEventListener(eventName, function (event) {
        event.preventDefault();
        dropZone.classList.add("is-dragging");
      });
    });
    ["dragleave", "drop"].forEach(function (eventName) {
      dropZone.addEventListener(eventName, function () { dropZone.classList.remove("is-dragging"); });
    });
    dropZone.addEventListener("drop", function (event) {
      event.preventDefault();
      if (!repositoryDirectory) {
        setEditorMessage(screen.id, "先に画像保存先を接続してください。", true);
        return;
      }
      addScreenImages(screen, Array.from(event.dataTransfer.files), stack);
    });
    fileInput.addEventListener("change", function () {
      addScreenImages(screen, Array.from(fileInput.files), stack);
      fileInput.value = "";
    });

    editor.append(heading, dropZone, fileInput);

    if (images.length > 0 && images[index]) {
      const deleteRow = document.createElement("div");
      deleteRow.className = "image-delete-row";
      const deleteText = document.createElement("span");
      deleteText.textContent = "表示中：「" + (images[index].label || "画像 " + (index + 1)) + "」";
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "image-delete-button";
      deleteButton.textContent = "表示中の画像を削除";
      deleteButton.addEventListener("click", function () { deleteScreenImage(screen, images, index, stack); });
      deleteRow.append(deleteText, deleteButton);
      editor.appendChild(deleteRow);
    }

    const status = document.createElement("p");
    status.className = "image-editor-status";
    status.dataset.editorStatus = screen.id;
    status.textContent = editorMessages.get(screen.id) || (repositoryDirectory
      ? "保存先に接続済みです。追加・削除後に「更新を反映.cmd」を実行してください。"
      : "最初にGitHub DesktopでCloneしたフォルダを接続してください。");
    editor.appendChild(status);
    return editor;
  }

  async function connectRepository(screenId) {
    if (typeof window.showDirectoryPicker !== "function") {
      setEditorMessage(screenId, "この機能はChromeまたはEdgeで利用してください。", true);
      return false;
    }
    try {
      const handle = await window.showDirectoryPicker({ id: "biyou-clinic-screen-flow", mode: "readwrite" });
      if (handle.requestPermission) {
        const permission = await handle.requestPermission({ mode: "readwrite" });
        if (permission !== "granted") throw new Error("フォルダへの書き込みが許可されませんでした。");
      }
      await handle.getFileHandle("index.html");
      await handle.getDirectoryHandle("assets");
      const configDirectory = await handle.getDirectoryHandle("config");
      try {
        await configDirectory.getFileHandle("image-overrides.json");
      } catch (error) {
        throw new Error("Cloneフォルダが古いため、GitHub Desktopで「Fetch origin」または「Pull origin」を押してから再接続してください。");
      }
      repositoryDirectory = handle;
      setEditorMessage(screenId, "保存先「" + handle.name + "」に接続しました。", false);
      return true;
    } catch (error) {
      if (error && error.name === "AbortError") return false;
      setEditorMessage(screenId, error && error.message ? error.message : "フォルダへ接続できませんでした。", true);
      return false;
    }
  }

  function refreshRepositoryConnectionState() {
    document.querySelectorAll(".repository-connect-button").forEach(function (button) {
      button.textContent = "保存先を接続済み";
      button.classList.add("is-connected");
    });
  }

  async function addScreenImages(screen, files, stack) {
    const imageFiles = files.filter(function (file) {
      return file && (file.type.indexOf("image/") === 0 || /\.(png|jpe?g|webp|gif)$/i.test(file.name));
    });
    if (!repositoryDirectory) {
      setEditorMessage(screen.id, "先に画像保存先を接続してください。", true);
      return;
    }
    if (imageFiles.length === 0) {
      setEditorMessage(screen.id, "PNG・JPG・WebP・GIF画像を選択してください。", true);
      return;
    }

    const previousOverride = Object.prototype.hasOwnProperty.call(imageOverrides, screen.id)
      ? imageOverrides[screen.id]
      : undefined;
    const nextImages = normalizeImages(screen).map(function (item) { return { label: item.label, path: item.path }; });
    setEditorMessage(screen.id, "画像を保存しています…", false);
    try {
      for (let fileIndex = 0; fileIndex < imageFiles.length; fileIndex += 1) {
        const file = imageFiles[fileIndex];
        const extensionMatch = file.name.match(/\.(png|jpe?g|webp|gif)$/i);
        const extension = extensionMatch ? extensionMatch[0].toLowerCase().replace(".jpeg", ".jpg") : ".png";
        const path = "./assets/screens/" + screen.id + "-" + Date.now() + "-" + (fileIndex + 1) + extension;
        await writeRepositoryFile(path, file);
        temporaryImageUrls.set(path, URL.createObjectURL(file));
        nextImages.push({ label: file.name.replace(/\.[^.]+$/, "") || "追加画像", path: path });
      }
      imageOverrides[screen.id] = nextImages;
      await persistImageOverrides();
      setEditorMessage(screen.id, imageFiles.length + "枚の画像を追加しました。「更新を反映.cmd」でGitHubへ反映できます。", false);
      renderScreenStack(screen, nextImages, nextImages.length - imageFiles.length, stack);
    } catch (error) {
      if (previousOverride === undefined) delete imageOverrides[screen.id];
      else imageOverrides[screen.id] = previousOverride;
      setEditorMessage(screen.id, "画像を保存できませんでした。フォルダの接続をやり直してください。", true);
    }
  }

  async function deleteScreenImage(screen, images, index, stack) {
    const imageConfig = images[index];
    if (!repositoryDirectory) {
      setEditorMessage(screen.id, "削除する前に画像保存先を接続してください。", true);
      return;
    }
    if (!imageConfig || !window.confirm("この画像を削除しますか？\n" + (imageConfig.label || imageConfig.path))) return;

    const previousOverride = Object.prototype.hasOwnProperty.call(imageOverrides, screen.id)
      ? imageOverrides[screen.id]
      : undefined;
    const nextImages = images.filter(function (_, imageIndex) { return imageIndex !== index; });
    try {
      imageOverrides[screen.id] = nextImages;
      await persistImageOverrides();
      await removeRepositoryImage(imageConfig.path);
      const temporaryUrl = temporaryImageUrls.get(imageConfig.path);
      if (temporaryUrl) URL.revokeObjectURL(temporaryUrl);
      temporaryImageUrls.delete(imageConfig.path);
      setEditorMessage(screen.id, "画像を削除しました。「更新を反映.cmd」でGitHubへ反映できます。", false);
      renderScreenStack(screen, nextImages, Math.max(0, index - 1), stack);
    } catch (error) {
      if (previousOverride === undefined) delete imageOverrides[screen.id];
      else imageOverrides[screen.id] = previousOverride;
      setEditorMessage(screen.id, "画像を削除できませんでした。フォルダの接続を確認してください。", true);
    }
  }

  function renderScreenStack(screen, images, index, stack) {
    if (images.length > 0) {
      showScreenImage(screen, images, Math.min(index, images.length - 1), stack);
      return;
    }
    showMissingImage(screen, { path: "画像パス未設定" }, stack);
    stack.appendChild(createImageEditor(screen, images, 0, stack));
  }

  async function persistImageOverrides() {
    const data = JSON.stringify({ version: 1, screens: imageOverrides }, null, 2) + "\n";
    await writeRepositoryFile("./config/image-overrides.json", new Blob([data], { type: "application/json" }));
  }

  async function writeRepositoryFile(path, contents) {
    const parts = repositoryPathParts(path);
    let directory = repositoryDirectory;
    for (let index = 0; index < parts.length - 1; index += 1) {
      directory = await directory.getDirectoryHandle(parts[index], { create: true });
    }
    const fileHandle = await directory.getFileHandle(parts[parts.length - 1], { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(contents);
    await writable.close();
  }

  async function removeRepositoryImage(path) {
    const parts = repositoryPathParts(path);
    if (parts[0] !== "assets" || parts[1] !== "screens") return;
    let directory = repositoryDirectory;
    try {
      for (let index = 0; index < parts.length - 1; index += 1) {
        directory = await directory.getDirectoryHandle(parts[index]);
      }
      await directory.removeEntry(parts[parts.length - 1]);
    } catch (error) {
      if (!error || error.name !== "NotFoundError") throw error;
    }
  }

  function repositoryPathParts(path) {
    const parts = String(path).replace(/^\.\//, "").split("/").filter(Boolean);
    if (parts.length === 0 || parts.some(function (part) { return part === "." || part === ".."; })) {
      throw new Error("保存先のパスが正しくありません。");
    }
    return parts;
  }

  function setEditorMessage(screenId, message, isError) {
    editorMessages.set(screenId, message);
    const status = document.querySelector('[data-editor-status="' + screenId + '"]');
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("is-error", Boolean(isError));
  }

  function normalizeImages(screen) {
    const source = Object.prototype.hasOwnProperty.call(imageOverrides, screen.id)
      ? imageOverrides[screen.id]
      : (Array.isArray(screen.images) ? screen.images : (screen.image ? [{ label: "デザイン 1", path: screen.image }] : []));
    if (!Array.isArray(source)) return [];
    return source.map(function (item, index) {
      return typeof item === "string" ? { label: "画像 " + (index + 1), path: item } : item;
    }).filter(function (item) { return item && item.path; });
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

