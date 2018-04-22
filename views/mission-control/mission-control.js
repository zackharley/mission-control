new Vue({
    el: '#app',
    data: {
        state: {}
    },
    mounted() {
        chrome.storage.sync.get(['state'], result => {
            const state = result.state || {};
            this.state = state;
        });
    }
});
