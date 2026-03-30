// SoupyLab Harvester — Background Service Worker

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "soupylab-harvest-image",
    title: "Harvest image for SoupyLab",
    contexts: ["image"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "soupylab-harvest-image") {
    const capture = {
      id: crypto.randomUUID(),
      imageUrl: info.srcUrl,
      altText: "",
      context: "",
      pageTitle: tab.title || "",
      pageUrl: tab.url || "",
      timestamp: new Date().toISOString()
    };

    // Ask content script for alt text and surrounding context
    chrome.tabs.sendMessage(tab.id, {
      type: "GET_IMAGE_INFO",
      imageUrl: info.srcUrl
    }, (response) => {
      if (response) {
        capture.altText = response.altText || "";
        capture.context = response.context || "";
      }
      saveCapture(capture);
    });
  }
});

// Listen for captures from content script (click-to-capture mode)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_CAPTURE") {
    saveCapture(message.capture);
    sendResponse({ success: true });
  }
  if (message.type === "GET_CAPTURE_COUNT") {
    chrome.storage.local.get({ captures: [] }, (data) => {
      sendResponse({ count: data.captures.length });
    });
    return true; // async response
  }
});

function saveCapture(capture) {
  chrome.storage.local.get({ captures: [] }, (data) => {
    const captures = data.captures;
    // Deduplicate by image URL
    if (!captures.some(c => c.imageUrl === capture.imageUrl)) {
      captures.push(capture);
      chrome.storage.local.set({ captures }, () => {
        updateBadge(captures.length);
      });
    }
  });
}

function updateBadge(count) {
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
  chrome.action.setBadgeBackgroundColor({ color: "#00D4BE" });
}

// Update badge on startup
chrome.storage.local.get({ captures: [] }, (data) => {
  updateBadge(data.captures.length);
});
