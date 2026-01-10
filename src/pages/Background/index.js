chrome.action.setBadgeText({ text: 'OFF' });

// establish connection for relaying detection data
chrome.runtime.onConnect.addListener(function (port) {
  // relay alignment status messages from options to content scripts
  if (port.name === 'relay-detection') {
    port.onMessage.addListener((msg) => {
      console.log('[bg] relaying alignment message', msg);
      handleAlignmentMessage(msg);
    });
    port.onDisconnect.addListener(function () {
      // normal disconnection when options page closes
    });
  }
});

// broadcast alignment status to all tabs
function handleAlignmentMessage(msg) {
  // Broadcast to all http/https tabs so blur applies even if Options popup is focused
  chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] }, function (tabs) {
    if (!tabs || !tabs.length) return;
    tabs.forEach((tab) => {
      if (!tab.id) return;
      // debug log target tab id
      console.log('[bg] sending to tab', tab.id, msg);
      // Use sendMessage with callback to handle errors gracefully
      chrome.tabs.sendMessage(tab.id, msg, function (response) {
        // Check for errors (content script might not exist on this tab)
        if (chrome.runtime.lastError) {
          // Silently ignore - this is normal for tabs without content script
          return;
        }
      });
    });
  });
}
