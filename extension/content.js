// SoupyLab Harvester — Content Script

// Respond to background script requests for image info
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_IMAGE_INFO") {
    const img = findImageByUrl(message.imageUrl);
    if (img) {
      sendResponse({
        altText: img.alt || img.title || "",
        context: getImageContext(img)
      });
    } else {
      sendResponse({ altText: "", context: "" });
    }
  }
});

function findImageByUrl(url) {
  const images = document.querySelectorAll("img");
  for (const img of images) {
    if (img.src === url || img.currentSrc === url) return img;
  }
  return null;
}

function getImageContext(img) {
  // Get surrounding text: parent element's text content, trimmed
  let el = img.parentElement;
  let context = "";
  let depth = 0;
  while (el && depth < 3) {
    const text = el.textContent?.trim();
    if (text && text.length > 10 && text.length < 2000) {
      context = text.substring(0, 500);
      break;
    }
    el = el.parentElement;
    depth++;
  }
  return context;
}

// Harvest overlay on hover (when harvest mode is active)
let harvestMode = false;
let overlay = null;

chrome.storage.local.get({ harvestMode: false }, (data) => {
  if (data.harvestMode) enableHarvestMode();
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.harvestMode) {
    if (changes.harvestMode.newValue) {
      enableHarvestMode();
    } else {
      disableHarvestMode();
    }
  }
});

function enableHarvestMode() {
  harvestMode = true;
  document.body.classList.add("soupylab-harvest-active");

  document.addEventListener("click", handleHarvestClick, true);
  document.addEventListener("mouseover", handleHarvestHover, true);
  document.addEventListener("mouseout", handleHarvestHoverOut, true);
}

function disableHarvestMode() {
  harvestMode = false;
  document.body.classList.remove("soupylab-harvest-active");
  removeOverlay();

  document.removeEventListener("click", handleHarvestClick, true);
  document.removeEventListener("mouseover", handleHarvestHover, true);
  document.removeEventListener("mouseout", handleHarvestHoverOut, true);
}

function handleHarvestHover(e) {
  const img = e.target.closest("img");
  if (!img) return;

  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "soupylab-harvest-overlay";
    overlay.innerHTML = '<span class="soupylab-harvest-label">⚡ Click to harvest</span>';
    document.body.appendChild(overlay);
  }

  const rect = img.getBoundingClientRect();
  overlay.style.top = (rect.top + window.scrollY) + "px";
  overlay.style.left = (rect.left + window.scrollX) + "px";
  overlay.style.width = rect.width + "px";
  overlay.style.height = rect.height + "px";
  overlay.style.display = "block";
}

function handleHarvestHoverOut(e) {
  const img = e.target.closest("img");
  if (img) removeOverlay();
}

function removeOverlay() {
  if (overlay) {
    overlay.style.display = "none";
  }
}

function handleHarvestClick(e) {
  const img = e.target.closest("img");
  if (!img) return;

  e.preventDefault();
  e.stopPropagation();

  const capture = {
    id: crypto.randomUUID(),
    imageUrl: img.src || img.currentSrc,
    altText: img.alt || img.title || "",
    context: getImageContext(img),
    pageTitle: document.title,
    pageUrl: window.location.href,
    timestamp: new Date().toISOString()
  };

  chrome.runtime.sendMessage({ type: "SAVE_CAPTURE", capture }, (response) => {
    if (response?.success) {
      showCapturedFeedback(img);
    }
  });
}

function showCapturedFeedback(img) {
  const rect = img.getBoundingClientRect();
  const feedback = document.createElement("div");
  feedback.className = "soupylab-captured-feedback";
  feedback.textContent = "✓ Harvested";
  feedback.style.top = (rect.top + window.scrollY + rect.height / 2 - 16) + "px";
  feedback.style.left = (rect.left + window.scrollX + rect.width / 2 - 50) + "px";
  document.body.appendChild(feedback);
  setTimeout(() => feedback.remove(), 1200);
}
