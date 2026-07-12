importScripts("shared.js");

let isOptimizing = false;
chrome.alarms.create("timeOptimizeCheck", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
    // guard overlapping triggers
    if (isOptimizing) {
        return;
    }
    
    // read local storage settings
    const saved = await chrome.storage.local.get({
        minCbox: false,
        minValue: 1,
        lastSavedTime: 0
    });
    
    // trigger optimization for each time interval in minutes
    if (saved.minCbox) {
        const now = Date.now();
        const mins = (now - saved.lastSavedTime) / 60000;

        if (mins >= saved.minValue) {
            isOptimizing = true;
            await optimize();
            isOptimizing = false;
            await chrome.storage.local.set({ lastSavedTime: now });
        }
    }
});

// hotkey event handling
chrome.commands.onCommand.addListener(async (command) => {
    if (command  === "run-optimize") {
        await optimize();
    }
});