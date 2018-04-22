'use-strict';

import { chromeUtils } from '../../common/index.js';

new Vue({
    el: '#app',
    data: {
        manageExtensionUrl: `chrome://extensions/?id=${chrome.runtime.id}`,
        isAllowedIncognitoAccess: false,
        forms: {
            blockedUrls: {
                input: ''
            },
            goal: {
                description: '',
                lastResetDate: null
            }
        },
        state: {}
    },
    async mounted() {
        this.isAllowedIncognitoAccess = await chromeUtils.extension.isAllowedIncognitoAccess();
        await this.fetchState();
    },
    methods: {
        /**
         * URL Matching Rules:
         *   - Match using host, not hostname (see http://bl.ocks.org/abernier/3070589)
         *   - Don't care about protocol
         */
        async handleNewBlockedUrl() {
            let url;
            try {
                url = new URL(this.forms.blockedUrls.input.trim());
            } catch (e) {
                console.error('Invalid URL!');
                return;
            }
            await this.setSyncStorageState({ blockedUrls: [...this.state.blockedUrls, url.host] });
        },

        async handleRemovedBlockedUrl(url) {
            const currentBlockedUrls = this.state.blockedUrls;
            const index = currentBlockedUrls.indexOf(url);
            const updatedBlockedUrls = [
                ...currentBlockedUrls.slice(0, index),
                ...currentBlockedUrls.slice(index + 1)
            ];
            await this.setSyncStorageState({ blockedUrls: updatedBlockedUrls });
        },

        async handleGoalFormSubmit(e) {
            e.preventDefault();
            const goal = {
                description: this.forms.goal.description,
                lastResetDate: moment(this.forms.goal.lastResetDate).valueOf()
            };
            await this.setSyncStorageState({ goal });
        },

        async handleClearGoal() {
            const defaultGoal = {
                description: '',
                lastResetDate: null
            };
            await this.setSyncStorageState({ goal: defaultGoal });
        },

        async setSyncStorageState(newState = {}) {
            const updatedState = Object.assign({}, this.state, newState);
            await chromeUtils.storage.sync.set({ state: updatedState });
            console.log('Storage set successfully!');
            await this.fetchState();
        },

        async redirectToManageExtension() {
            await chromeUtils.tabs.update({ url: this.manageExtensionUrl })
        },

        async fetchState() {
            const { state } = await chromeUtils.storage.sync.get(['state']);
            this.state = state;
        }
    }
});