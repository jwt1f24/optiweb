// normalize domain into a simpler format
function normalizeDomain(hostname) {
    return hostname.replace(/^www\./, "");
}

// optimize browser by discarding inactive tabs
async function optimize() {
    const saved = await chrome.storage.local.get({ whitelist: [] });
    const whitelist = saved.whitelist;
    const inactiveTabs = await chrome.tabs.query({ active: false, discarded: false, audible:false, pinned: false });
    const memBefore = await chrome.system.memory.getInfo();
    let discardCount = 0;
    for (const tab of inactiveTabs) {
        if (!tab.id) {
            continue;
        }
        try {
            const domain = normalizeDomain(new URL(tab.url).hostname);
            if (!whitelist.includes(domain)) {
                await chrome.tabs.discard(tab.id);
                discardCount += 1;
            }
        } catch (err) {
            console.error(`Failed to discard tab ID: ${tab.id}`, err);
        }
    }

    // if settings enabled, send a notification after optimizing is triggered
    await new Promise(res => setTimeout(res, 1000));
    const memAfter = await chrome.system.memory.getInfo();
    const memSaved = Math.max(0, ((memAfter.availableCapacity - memBefore.availableCapacity) / (1024 ** 2))).toFixed(1);
    const notifSaved = await chrome.storage.local.get({ notifCbox: false });

    // configure notification content
    if (notifSaved.notifCbox) {
        chrome.notifications.create({
            type: "basic",
            iconUrl: "/images/icon128.png",
            title: "Web Browser Optimized",
            message: `${discardCount} tabs have been discarded, ${memSaved} MB of memory has been saved.`
        });
    }
}