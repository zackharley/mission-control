const promisify = func => (...inputs) => new Promise(resolve => {
    return func(...inputs, resolve);
});

const chromeUtils = {
    extension: {
        isAllowedIncognitoAccess: promisify(chrome.extension.isAllowedIncognitoAccess)
    },
    storage: {
        sync: {
            get: promisify(chrome.storage.sync.get),
            set: promisify(chrome.storage.sync.set)
        }
    },
    tabs: {
        update: promisify(chrome.tabs.update)
    }
};

export {
    chromeUtils
};

