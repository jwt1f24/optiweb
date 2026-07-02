// scan all opened tabs & update dashboard tab counter
async function updateMetrics() {
    // check for active & sleeping tabs
    const tabs = await chrome.tabs.query({});
    let active = 0;
    let freeze = 0;
    
    tabs.forEach((tab) => {
        if (tab.discarded) { 
            freeze += 1;
        } else {
            active += 1;
        }
    });

    // connect the html elements with the number counter
    const activeCount = document.getElementById("activeCount");
    const freezeCount = document.getElementById("freezeCount");

    activeCount.innerText = active;
    freezeCount.innerText = freeze;

    // display memory usage metrics
    const memUsage = document.getElementById("memUsage");
    const memAvailable = document.getElementById("memAvailable");

    if (chrome.system && chrome.system.memory) {
        const mem = await chrome.system.memory.getInfo(); // returns {capacity, availableCapacity}
        const memUsed = (mem.capacity - mem.availableCapacity) / (1024 ** 3);
        const memUnused = mem.availableCapacity / (1024 ** 3);

        memUsage.innerText = memUsed.toFixed(1) + " GB";
        memAvailable.innerText = memUnused.toFixed(1) + " GB";
    }
}

// optimize browser by freezing inactive tabs on button click
const optBtn = document.getElementById("optBtn");
optBtn.addEventListener("click", async () => {
    const inactiveTabs = await chrome.tabs.query({ active: false });
    for (const tab of inactiveTabs) {
        if (tab.id) {
            await chrome.tabs.discard(tab.id);
        }
    }
    // refresh dashboard to load changes
    updateMetrics();
});

// instantiate live view dashboard tab updates
updateMetrics();
chrome.tabs.onActivated.addListener(updateMetrics);
chrome.tabs.onUpdated.addListener(updateMetrics);
chrome.tabs.onRemoved.addListener(updateMetrics);
setInterval(updateMetrics, 1000);