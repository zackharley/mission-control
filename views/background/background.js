'use strict';

import { chromeUtils, toUrlString } from '../../common/common.js';

const DEFAULT_STATE = {
    blockedUrls: [],
    customRedirectUrl: null,
    goal: {
        description: null,
        lastResetDate: null,
        isGoalVisible: false
    },
    thingsToDo: [],
    thingsToNotDo: []
};
const DEFAULT_REDIRECT_URL = '/views/mission-control/mission-control.html';

chrome.runtime.onInstalled.addListener(initializeExtension);
chrome.webNavigation.onBeforeNavigate.addListener(filterWebNavigation);

async function initializeExtension(details) {
    let initializedState;
    const { state } = await chromeUtils.storage.sync.get(['state']);

    if (details.reason === 'install') {
        chrome.runtime.openOptionsPage();
        // Show walkthrough
        await chromeUtils.storage.sync.set({ state: DEFAULT_STATE });
        initializedState = DEFAULT_STATE;
    } else {
        initializedState = state;
    }

    console.log('Application initialized successfully!');
    console.log('State initialized to :', initializedState);
}

async function filterWebNavigation(details) {
    if (details.parentFrameId !== -1) {
        return;
    }

    const { state } = await chromeUtils.storage.sync.get(['state']);
    const { blockedUrls, customRedirectUrl } = state;


    const { url } = details;
    if (doesUrlMatchBlockedUrls(url, blockedUrls)) {
        const { tabId } = details;
        const options = {
            url: (customRedirectUrl && toUrlString(customRedirectUrl)) || DEFAULT_REDIRECT_URL
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
                return accum || url.match(blockedUrlRegExp)
            },
            false
        )
}

function toBlockedUrlRegExp(blockedUrl) {
    return new RegExp(`^https?://(.+\.|)${blockedUrl}(/.*|)$`);
}
