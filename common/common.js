const promisify = func => (...inputs) => new Promise(resolve => {
    return func(...inputs, resolve);
});

const chromeUtils = {
    extension: {
        isAllowedIncognitoAccess: promisify(chrome.extension.isAllowedIncognitoAccess)
    },
    storage: {
        local: {
            get: promisify(chrome.storage.local.get),
            set: promisify(chrome.storage.local.set)
        },
        sync: {
            get: promisify(chrome.storage.sync.get),
            set: promisify(chrome.storage.sync.set)
        }
    },
    tabs: {
        create: promisify(chrome.tabs.create),
        update: promisify(chrome.tabs.update)
    }
};

const hasProtocol = url => url.match(/^https?:\/\//);
const toUrlString = url => hasProtocol(url)
    ? url
    : `http://${url}`;

export {
    chromeUtils,
    toUrlString
};
