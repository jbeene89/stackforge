// SoupyLab Harvester — Popup Script

const captureCountEl = document.getElementById("captureCount");
const siteCountEl = document.getElementById("siteCount");
const toggleBtn = document.getElementById("toggleHarvest");
const harvestLabel = document.getElementById("harvestLabel");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");
const capturesList = document.getElementById("capturesList");

let isHarvestMode = false;

// Load state
chrome.storage.local.get({ captures: [], harvestMode: false }, (data) => {
  renderCaptures(data.captures);
  isHarvestMode = data.harvestMode;
  updateHarvestButton();
});

// Toggle harvest mode
toggleBtn.addEventListener("click", () => {
  isHarvestMode = !isHarvestMode;
  chrome.storage.local.set({ harvestMode: isHarvestMode });
  updateHarvestButton();
});

function updateHarvestButton() {
  if (isHarvestMode) {
    toggleBtn.classList.add("active");
    harvestLabel.textContent = "Disable Harvest Mode";
  } else {
    toggleBtn.classList.remove("active");
    harvestLabel.textContent = "Enable Harvest Mode";
  }
}

// Export captures as JSON
exportBtn.addEventListener("click", () => {
  chrome.storage.local.get({ captures: [] }, (data) => {
    if (data.captures.length === 0) return;

    const exportData = {
      version: "1.0.0",
      source: "soupylab-harvester",
      exportedAt: new Date().toISOString(),
      captureCount: data.captures.length,
      captures: data.captures
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `soupylab-harvest-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
});

// Clear all captures
clearBtn.addEventListener("click", () => {
  if (confirm("Remove all captured images? This cannot be undone.")) {
    chrome.storage.local.set({ captures: [] }, () => {
      renderCaptures([]);
      chrome.action.setBadgeText({ text: "" });
    });
  }
});

function renderCaptures(captures) {
  captureCountEl.textContent = captures.length;
  const uniqueSites = new Set(captures.map(c => {
    try { return new URL(c.pageUrl).hostname; } catch { return "unknown"; }
  }));
  siteCountEl.textContent = uniqueSites.size;

  exportBtn.disabled = captures.length === 0;
  clearBtn.style.display = captures.length > 0 ? "flex" : "none";

  if (captures.length === 0) {
    capturesList.innerHTML = `
      <div class="empty">
        <div class="empty-icon">🎯</div>
        Right-click any image or enable<br>Harvest Mode to start capturing
      </div>
    `;
    return;
  }

  // Show most recent first
  const recent = [...captures].reverse().slice(0, 20);
  capturesList.innerHTML = recent.map(c => `
    <div class="capture-item" data-id="${c.id}">
      <img class="capture-thumb" src="${escapeHtml(c.imageUrl)}" alt="" loading="lazy" onerror="this.style.display='none'">
      <div class="capture-info">
        <div class="capture-title">${escapeHtml(c.altText || "Untitled image")}</div>
        <div class="capture-url">${escapeHtml(c.pageUrl)}</div>
      </div>
      <button class="capture-remove" title="Remove">×</button>
    </div>
  `).join("");

  // Remove individual captures
  capturesList.querySelectorAll(".capture-remove").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = e.target.closest(".capture-item").dataset.id;
      chrome.storage.local.get({ captures: [] }, (data) => {
        const filtered = data.captures.filter(c => c.id !== id);
        chrome.storage.local.set({ captures: filtered }, () => {
          renderCaptures(filtered);
          chrome.action.setBadgeText({ text: filtered.length > 0 ? String(filtered.length) : "" });
        });
      });
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}

// Listen for storage changes to update in real-time
chrome.storage.onChanged.addListener((changes) => {
  if (changes.captures) {
    renderCaptures(changes.captures.newValue || []);
  }
});
