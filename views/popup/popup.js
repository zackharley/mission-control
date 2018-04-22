'use strict';

import { chromeUtils } from '../../common/index.js';

new Vue({
    el: '#app',
    data: {
        loading: true,
        state: {}
    },
    async mounted() {
        await this.fetchState();
        this.loading = false;
    },
    methods: {
        async fetchState() {
            const { state } = await chromeUtils.storage.sync.get(['state']);
            const today = moment();
            const lastResetDate = moment(state.goal.lastResetDate);
            state.goal.daysSinceReset = today.diff(lastResetDate, 'days');
            this.state = state;
        },
        async handleResetClick() {
            const updatedGoal = Object.assign({}, this.state.goal, {
                lastResetDate: moment().valueOf()
            });
            await this.setSyncStorageState({ goal: updatedGoal });
        },
        async setSyncStorageState(newState = {}) {
            const updatedState = Object.assign({}, this.state, newState);
            await chromeUtils.storage.sync.set({ state: updatedState });
            console.log('Storage set successfully!');
            await this.fetchState();
        },
    }
});
