importScripts("shared.js");

// check if extension is toggled on or off
async function isExtensionEnabled() {
    const saved = await chrome.storage.local.get({ extensionEnabled: true });
    return saved.extensionEnabled;
}

// optimize on browser startup
chrome.runtime.onStartup.addListener(async () => {
    if (!(await isExtensionEnabled())) {
        return;
    }
    await optimize();
});

// automated optimization
let isOptimizing = false;
chrome.alarms.create("timeOptimizeCheck", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
    // guard extension state
    if (!(await isExtensionEnabled())) {
        return;
    }
    
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
    console.log(command);
    // toggle extension hotkey
    if (command === "toggle-extension") {
        const saved = await chrome.storage.local.get({ extensionEnabled: true });
        await chrome.storage.local.set({ extensionEnabled: !saved.extensionEnabled });
    }
    
    // optimize hotkey
    if (command  === "run-optimize") {
        if (!(await isExtensionEnabled())) {
            return;
        }
        await optimize();
    }
});