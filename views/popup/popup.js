'use strict';

import { chromeUtils } from '../../common/common.js';

Vue.use(VueMaterial.default);

new Vue({
    el: '#app',
    data: {
        optionsPageUrl: `chrome-extension://${chrome.runtime.id}/views/options/options.html`,
        isLoading: true,
        state: {}
    },
    async mounted() {
        await this.fetchState();
        this.isLoading = false;
    },
    methods: {
        async handleResetClick() {
            const updatedGoal = {
                ...this.state.goal,
                lastResetDate: moment().valueOf()
            };
            await this.setSyncStorageState({ goal: updatedGoal });
        },

        async handleCancelClick() {
            const updatedGoal = {
                description: '',
                lastResetDate: null
            };
            await this.setSyncStorageState({ goal: updatedGoal });
        },

        async setSyncStorageState(newState = {}) {
            const updatedState = {
                ...this.state,
                ...newState
            };
            await chromeUtils.storage.sync.set({ state: updatedState });
            console.log('Storage set successfully!');
            await this.fetchState();
        },

        async fetchState() {
            const { state } = await chromeUtils.storage.sync.get(['state']);
            const today = moment();
            const lastResetDate = moment(state.goal.lastResetDate);
            state.goal.daysSinceReset = today.diff(lastResetDate, 'days');
            this.state = state;
        },

        async redirectToOptionsPage(focus) {
            await chromeUtils.tabs.create({
                url: focus
                    ? `${this.optionsPageUrl}?focus=${focus}`
                    : this.optionsPageUrl
            })
        }
    }
});
