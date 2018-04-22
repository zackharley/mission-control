'use strict';

import { chromeUtils } from '../../common/index.js';

const DEFAULT_STATE = {
    blockedUrls: [],
    thingsToDo: [],
    thingsToNotDo: [],
    goal: {
        description: '',
        lastResetDate: null
    }
};

chrome.runtime.onInstalled.addListener(initializeExtension);
chrome.runtime.onInstalled.addListener(openOptionsPage);
chrome.webNavigation.onBeforeNavigate.addListener(filterWebNavigation);

async function initializeExtension(details) {
    let initializedState;
    const { state } = await chromeUtils.storage.sync.get(['state']);

    if (details.reason === 'install') {
        await chromeUtils.storage.sync.set({ state: DEFAULT_STATE });
        initializedState = DEFAULT_STATE;
    } else {
        initializedState = state;
    }

    console.log('Application initialized successfully!');
    console.log('State initialized to :', initializedState);
}

function openOptionsPage(details) {
    if (details.reason === 'install') {
        chrome.runtime.openOptionsPage();
    }
}

async function filterWebNavigation(details) {
    if (details.parentFrameId !== -1) {
        return;
    }

    const result = await chromeUtils.storage.sync.get(['state']);
    const blockedUrls = result.state.blockedUrls;

    const { url } = details;
    if (doesUrlMatchBlockedUrls(url, blockedUrls)) {
        const { tabId } = details;
        const options = {
            url: '/views/mission-control/mission-control.html'
        };
        await chromeUtils.tabs.update(tabId, options);
    }
}

function doesUrlMatchBlockedUrls(url, blockedUrls) {
    if (!blockedUrls || blockedUrls.length === 0) return false;
    return blockedUrls
        .map(toBlockedUrlRegExp)
        .reduce(
            (accum, blockedUrlRegExp) => {
                console.log(url, blockedUrlRegExp);
                return accum || url.match(blockedUrlRegExp)
            },
            false
        )
}

function toBlockedUrlRegExp(blockedUrl) {
    return new RegExp(`^https?://(.+\.|)${blockedUrl}(/.*|)$`)
}
