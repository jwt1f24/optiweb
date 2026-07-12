// main navbar navigation
const navBtns = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".section");
navBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        sections.forEach(section => {
            if (section.id === btn.dataset.target) {
                section.style.display = "flex";
            } else {
                section.style.display = "none";
            }
        });

        // active nav button toggle effect
        navBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        // default display when user navigates to tab list section
        if (btn.dataset.target === "tabList") {
            displayList();
        }
        // restore settings
        if (btn.dataset.target === "settings") {
            checkboxSettings();
        }
    });
});

// secondary navbar navigation for list tabs section
const listNavBtns = document.querySelectorAll(".list-nav-btn");
const listSections = document.querySelectorAll(".list-container");
listNavBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        listSections.forEach(section => {
            if (section.id === btn.dataset.target) {
                section.style.display = "flex";
            } else {
                section.style.display = "none";
            }
        });

        // active nav button toggle effect
        listNavBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        // display all tabs section
        if (btn.dataset.target === "allTabsView") {
            displayList();
        }
        // display whitelist section
        if (btn.dataset.target === "whitelistView") {
            displayWhitelist();
        }
    });
});

// scan all opened tabs & update dashboard tab counter
async function updateMetrics() {
    // check for active & sleeping tabs
    const tabs = await chrome.tabs.query({});
    let active = 0, freeze = 0, pinned = 0, audible = 0;
    
    tabs.forEach(tab => {
        if (tab.discarded) { 
            freeze += 1;
        } else {
            active += 1;
        }
        if (tab.pinned) {
            pinned += 1;
        }
        if (tab.audible) {
            audible += 1;
        }
    });

    // connect the html elements with the number counter
    const activeCount = document.getElementById("activeCount");
    const pinnedCount = document.getElementById("pinnedCount");
    const audibleCount = document.getElementById("audibleCount");
    const freezeCount = document.getElementById("freezeCount");

    activeCount.innerText = active;
    pinnedCount.innerText = pinned;
    audibleCount.innerText = audible;
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

// scrollbar effect when tab list content overflows
async function scrollbar(container) {
    if (container.scrollHeight > container.clientHeight) {
        container.style.paddingRight = "6px";
    } else {
        container.style.paddingRight = "0px";
    }
}

// display all opened tabs on a list
async function displayList() {
    const tabs = await chrome.tabs.query({});
    const filtered = tabs.filter(tab => !tab.url.startsWith("chrome://"));
    const saved = await chrome.storage.local.get({ whitelist: [] });
    let whitelist = saved.whitelist;
    const listContainer = document.getElementById("listTabs");
    listContainer.innerHTML = "";

    filtered.forEach(tab => {
        try {
            const domain = normalizeDomain(new URL(tab.url).hostname);
            const div = document.createElement("div");
            const tabName = document.createElement("h4");
            const rightGroup = document.createElement("div");
            const url = document.createElement("p");
            const cbox = document.createElement("input");
            const isProtected = tab.pinned || tab.audible;

            tabName.textContent = tab.title;
            
            // if checkbox is ticked, save tab domain in a local storage
            cbox.type = "checkbox";
            cbox.checked = isProtected || whitelist.includes(domain);
            cbox.disabled = isProtected;
            cbox.addEventListener("change", async () => {
                if (cbox.checked) {
                    whitelist.push(domain);
                } else {
                    whitelist = whitelist.filter(item => item !== domain);
                }
                await chrome.storage.local.set({ whitelist: whitelist });
                displayList();
            });

            // mark pinned and audible tabs with a symbol
            let prefix = "";
            if (tab.pinned)  {
                prefix += "📌 ";
            } else if (tab.audible) {
                prefix += "🔉 ";
            }
            url.textContent = prefix + domain;

            rightGroup.className = "row-right";
            rightGroup.appendChild(url);
            rightGroup.appendChild(cbox);
            div.appendChild(tabName);
            div.appendChild(rightGroup);
            listContainer.appendChild(div);
        } catch (err) {
            console.error(`Failed to display tab ID: ${tab.id}`, err);
        }
    });
    // scrollbar event handling
    scrollbar(listContainer);
}

// display whitelisted domains on a list
async function displayWhitelist() {
    const saved = await chrome.storage.local.get({ whitelist: [] });
    let whitelist = saved.whitelist;
    const listContainer = document.getElementById("whitelistedDomains");
    listContainer.innerHTML = "";

    whitelist.forEach(domain => {
        try {
            const div = document.createElement("div");
            const name = document.createElement("p");
            const rightGroup = document.createElement("div");
            const editBtn = document.createElement("button");
            const deleteBtn = document.createElement("button");

            editBtn.className = "edit-btn";
            deleteBtn.className = "delete-btn";

            name.textContent = domain;
            editBtn.textContent = "✎";
            deleteBtn.textContent = "✖";

            // button to edit existing domain in whitelist
            editBtn.addEventListener("click", () => {
                const input = document.createElement("input");
                input.type = "text";
                input.value = domain;
                div.replaceChild(input, name);
                input.focus();

                const saveEdit = async () => {
                    const newDomain = normalizeDomain(input.value);
                    const pattern = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;
                    if (pattern.test(newDomain) && newDomain !== domain) {
                        whitelist = whitelist.filter(item => item !== domain);
                        if (!whitelist.includes(newDomain)) {
                            whitelist.push(newDomain);
                        }
                        await chrome.storage.local.set({ whitelist: whitelist });
                        displayWhitelist();
                    } else {
                        // revert if invalid or unchanged
                        displayWhitelist(); 
                    }
                };

                input.addEventListener("keydown", (e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") displayWhitelist();
                });
                input.addEventListener("blur", saveEdit);
            });

            // button to remove saved domain from whitelist
            deleteBtn.addEventListener("click", async () => {
                whitelist = whitelist.filter(item => item !== domain);
                await chrome.storage.local.set({ whitelist: whitelist });
                displayWhitelist();
            });
            
            rightGroup.className = "row-right";
            rightGroup.appendChild(editBtn);
            rightGroup.appendChild(deleteBtn);
            div.appendChild(name);
            div.appendChild(rightGroup);
            listContainer.appendChild(div);
        } catch (err) {
            console.error(`Failed to display domain: ${domain}`, err);
        }
    });
    // scrollbar event handling
    scrollbar(listContainer);
}

// whitelist domain input handling
async function addToWhitelist() {
    const input = normalizeDomain(domainField.value);
    const pattern = /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;
    const validFormat = pattern.test(input);
    const saved = await chrome.storage.local.get({ whitelist: [] });
    let whitelist = saved.whitelist;

    // add domain to whitelist if input matches valid domain format
    if (validFormat) {
        if (!whitelist.includes(input)) {
            whitelist.push(input);
        } else {
            console.error(`Domain '${input}' already exists in whitelist`);
        }
        await chrome.storage.local.set({ whitelist: whitelist });
        displayWhitelist();
    } else {
        console.error(`Invalid domain format: ${input}`);
    }
    domainField.value = "";
}

// settings checkbox value storing
async function checkboxSettings() {
    const saved = await chrome.storage.local.get({ 
        notifCbox: false,
        minCbox: false,
        minValue: 1
    });
    notifCheck.checked = saved.notifCbox;
    minuteCheck.checked = saved.minCbox;
    minuteValue.value = saved.minValue;
}

// dashboard section event handling
const optBtn = document.getElementById("optBtn");
optBtn.addEventListener("click", async () => {
    document.body.classList.add("loading"); 
    optBtn.disabled = true;
    await optimize();
    updateMetrics();
    document.body.classList.remove("loading");
    optBtn.disabled = false;
});
document.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const dashboard = document.getElementById("dashboard");
        if (dashboard.style.display !== "none") {
            optBtn.click();
        }
    }
});

// whitelist section event handling
const domainBtn = document.getElementById("domainBtn");
const domainField = document.getElementById("domainField");
domainBtn.addEventListener("click", addToWhitelist);
domainField.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        addToWhitelist();
    }
});

// display theme setting
const darkBtn = document.getElementById("dark");
const lightBtn = document.getElementById("light");

function setTheme(theme) {
    if (theme === "light") {
        document.body.classList.add("light-theme");
        lightBtn.classList.add("active");
        darkBtn.classList.remove("active");
    } else {
        document.body.classList.remove("light-theme");
        darkBtn.classList.add("active");
        lightBtn.classList.remove("active");
    }
}
async function restoreTheme() {
    const saved = await chrome.storage.local.get({ theme: "dark" });
    setTheme(saved.theme);
}

darkBtn.addEventListener("click", async () => {
    setTheme("dark");
    await chrome.storage.local.set({ theme: "dark" });
});
lightBtn.addEventListener("click", async () => {
    setTheme("light");
    await chrome.storage.local.set({ theme: "light" });
});
restoreTheme();

// number input event handling
function numberInput(input, key, defaultVal) {
    // ignore non-digit characters
    input.addEventListener("input", () => {
        input.value = input.value.replace(/\D/g, "");
    });

    input.addEventListener("change", async () => {
        // reset field to default value if value is empty
        if (input.value === "") {
            input.value = defaultVal;
        }
        
        // clamp numbers within their min/max boundary
        const curr = parseInt(input.value);
        const min = parseInt(input.min);
        const max = parseInt(input.max);

        if (curr < min) {
            input.value = min;
        } else if (curr > max) {
            input.value = max;
        }
        await chrome.storage.local.set({ [key]: input.value });
    });
}

const minuteCheck = document.getElementById("minuteCheck");
const minuteValue = document.getElementById("minuteValue");
minuteCheck.addEventListener("change", async () => {
    await chrome.storage.local.set({ minCbox: minuteCheck.checked });
});
numberInput(minuteValue, "minValue", 1);

// loop boundary values of number input
function numberInputLoop(input, dir, defaultVal) {
    // reset field to default value if value is empty
    if (input.value === "") {
        input.value = defaultVal;
    }
    
    // loop values by going from one extreme to another extreme
    let curr = parseInt(input.value);
    const min = parseInt(input.min);
    const max = parseInt(input.max);

    if (dir === "up") {
        curr = (curr === max) ? min : curr + 1;
    } else {
        curr = (curr === min) ? max : curr - 1;
    }
    input.value = curr;
    return curr;
}

function numberInputButton(upBtn, downBtn, input, key, defaultVal) {
    upBtn.addEventListener("click", async () => {
        numberInputLoop(input, "up", defaultVal);
        await chrome.storage.local.set({ [key]: input.value });
    });
    downBtn.addEventListener("click", async () => {
        numberInputLoop(input, "down", defaultVal);
        await chrome.storage.local.set({ [key]: input.value });
    });
}

const minuteUp = document.getElementById("minuteUp");
const minuteDown = document.getElementById("minuteDown");
numberInputButton(minuteUp, minuteDown, minuteValue, "minValue", 1);

// notification setting event handling
const notifCheck = document.getElementById("notifCheck");
notifCheck.addEventListener("change", async () => {
    await chrome.storage.local.set({ notifCbox: notifCheck.checked });
});

// instantiate live view dashboard tab updates
updateMetrics();
setInterval(updateMetrics, 1000);