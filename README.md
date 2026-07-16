# **OptiWeb**

OptiWeb is a Chrome extension developed with the aim of optimizing browser performance by automatically discarding inactive tabs to free up memory space. The more tabs opened, the more impactful OptiWeb becomes!

## Built with

- HTML - Popup UI layout
- CSS - Visual design structure & theming
- JavaScript - Extension logic & background service worker
- Chrome Extension API - Tabs, alarms, storage, and system memory management

## Features

- Dashboard displaying memory usage and tab metrics
- Button to discard inactive tabs once clicked
- Tab list displaying all opened tabs
- Whitelist that protects specific sites from being discarded
- Automated optimization
- Dark & light theme
- Custom keyboard shortcuts
- Settings backup & restoring

## Why I built this

Web browsers consume a lot of memory, and memory usage grows for each tab opened, slowing down performance. I built this extension to allow users that frequently open many tabs to be able to simply freeze tabs they do not actively use, while saving memory and retaining site data if they were to open them again.

## Technical highlights

- Architected using Manifest V3 and implemented scripts to bridge the popup and background service worker together
- Background service worker is scheduled with 'chrome.alarms', working around its life-cycle constraints
- Utilized 'chrome.storage' to save user settings locally, with JSON files to export and import settings.

## Screenshots

|      ![Dashboard](/screenshots/dashboard.png)       |                 ![Optimized Dashboard](/screenshots/dashboard-cleaned.png)                 |
| :-------------------------------------------------: | :----------------------------------------------------------------------------------------: |
| **Dashboard** — memory usage and opened tab metrics | **Optimize Function** — discarded all tabs while ignoring focused, audible and pinned tabs |

|         ![Whitelist](/screenshots/all-tabs.png)          | ![Whitelist Edit](/screenshots/whitelist-input.png) |
| :------------------------------------------------------: | :-------------------------------------------------: |
| **Whitelist** — saved domains, protected from discarding | **Editing a domain** — inline edit with save/cancel |

|       ![Settings](/screenshots/settings-1.png)       |               ![Advanced Settings](/screenshots/settings-2.png)               |
| :--------------------------------------------------: | :---------------------------------------------------------------------------: |
| **Settings** — automation, notifications, and themes | **Advanced Settings** — keyboard shortcuts and settings saving via JSON files |

| ![Dark Mode](/screenshots/dashboard-dark.png) | ![Light Mode](/screenshots/dashboard.png) |
| :-------------------------------------------: | :---------------------------------------: |
|                **Dark theme**                 |              **Light theme**              |

## Pre-requisites

Before installing, please ensure that you are using a Chromium web browser (e.g. Google Chrome, Microsoft Edge)

## How to install

1. Clone the repository or download & extract the project ZIP file
2. Navigate to the **`chrome://extensions/`** page
3. Enable **`Developer mode`** on the top right corner of the page
4. Click on **`Load unpacked`** on the top left corner of the page
5. Select the root project folder **`optiweb`** containing **`manifest.json`**
