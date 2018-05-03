'use-strict';

import { chromeUtils, toUrlString } from '../../common/common.js';

Vue.use(VueMaterial.default);
Vue.use(window.vuelidate.default);

const { required } = window.validators;
const isUrl = value => {
    if (!value.trim().match(/[-a-zA-Z0-9@:%._+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_+.~#?&/=]*)/)) {
        console.log('Doesnt match');
        return false;
    }
    try {
        new URL(toUrlString(value));
        return true;
    } catch (e) {
        return false;
    }
};

const DEFAULT_CUSTOM_REDIRECT_URL = {
    url: null,
    usesCustomRedirect: false
};
const DEFAULT_GOAL = {
    description: null,
    lastResetDate: null,
    isGoalVisible: false
};
const DEFAULT_SNACKBAR = {
    isVisible: false,
    message: null,
    type: null
};
const FAIL = 'fail';
const FOCUS = 'focus';
const SUCCESS = 'success';

function getLocationSearchParams() {
    return location.search.replace(/^\?/, '')
        .split('&')
        .map(pair => pair.split('='))
        .reduce((accum, [key, value]) => ({
            ...accum,
            [key]: value
        }), {});
}

new Vue({
    el: '#app',
    data: {
        isEditingGoal: false,
        isLoading: true,
        manageExtensionUrl: `chrome://extensions/?id=${chrome.runtime.id}`,
        missionControlScreenUrl: `chrome-extension://${chrome.runtime.id}/views/mission-control/mission-control.html`,
        isAllowedIncognitoAccess: false,
        forms: {
            blockedUrls: {
                input: '',
                urls: []
            },
            customRedirectUrl: { ...DEFAULT_CUSTOM_REDIRECT_URL },
            goal: { ...DEFAULT_GOAL }
        },
        snackbar: { ...DEFAULT_SNACKBAR },
        state: {}
    },
    validations: {
        forms: {
            blockedUrls: {
                input: {
                    required,
                    isUrl
                }
            },
            customRedirectUrl: {
                url: {
                    required,
                    isUrl
                }
            },
            goal: {
                description: {
                    required
                },
                lastResetDate: {
                    required
                }
            }
        }
    },
    async mounted() {
        window.vm = this;
        this.isAllowedIncognitoAccess = await chromeUtils.extension.isAllowedIncognitoAccess();
        await this.fetchState();
        this.isLoading = false;
        const searchParams = getLocationSearchParams();
        const ref = searchParams[FOCUS];
        if (ref) {
            this.$refs[ref].$el.focus();
        }
    },
    methods: {
        getValidationClass(form, fieldName) {
            const field = this.$v.forms[form][fieldName];

            if (field) {
                return {
                    'md-invalid': field.$invalid && field.$dirty
                };
            }
        },

        async validateForm(form, handleSubmit) {
            this.$v.forms[form].$touch();
            if (!this.$v.forms[form].$invalid) {
                await handleSubmit();
            }
        },

        /**
         * URL Matching Rules:
         *   - Match using host, not hostname (see http://bl.ocks.org/abernier/3070589)
         *   - Don't care about protocol, but assume HTTP or HTTPS for matching
         *   - Match pathname if a pathname is supplied
         */
        async handleNewBlockedUrl() {
            const fullUrl = new URL(toUrlString(this.forms.blockedUrls.input.trim()));
            const blockedUrl = fullUrl.pathname
                ? `${fullUrl.host}${fullUrl.pathname}`
                : fullUrl.host;
            await this.setSyncStorageState({ blockedUrls: [...this.state.blockedUrls, blockedUrl] });
        },

        async handleRemoveBlockedUrl(url) {
            const currentBlockedUrls = this.state.blockedUrls;
            const index = currentBlockedUrls.indexOf(url);
            const updatedBlockedUrls = [
                ...currentBlockedUrls.slice(0, index),
                ...currentBlockedUrls.slice(index + 1)
            ];
            await this.setSyncStorageState({ blockedUrls: updatedBlockedUrls });
        },

        async handleCustomRedirectCheckboxChange(isEnabled) {
            if (!isEnabled) {
                this.forms.customRedirectUrl = { ...DEFAULT_CUSTOM_REDIRECT_URL };
                await this.setSyncStorageState({ customRedirectUrl: null })
            }
        },

        async handleNewCustomRedirectUrl() {
            const url = this.forms.customRedirectUrl.url.trim();
            await this.setSyncStorageState({ customRedirectUrl: url });
            this.showSnackbarSuccess('Custom redirect URL set successfully!');
        },

        async handleRemoveCustomRedirectUrl() {
            await this.setSyncStorageState({ customRedirectUrl: null });
            this.showSnackbarFail('Custom redirect URL removed');
        },

        async handleGoalFormSubmit() {
            const goal = {
                description: this.forms.goal.description,
                lastResetDate: moment(this.forms.goal.lastResetDate).valueOf(),
                isGoalVisible: this.forms.goal.isGoalVisible
            };
            await this.setSyncStorageState({ goal });
            this.forms.goal = { ...DEFAULT_GOAL };
            this.showSnackbarSuccess('Congratulations! New goal created!');
        },

        async handleResetGoal() {
            const updatedGoal = {
                ...this.state.goal,
                lastResetDate: moment().valueOf()
            };
            await this.setSyncStorageState({ goal: updatedGoal });
            this.showSnackbarSuccess('Reset goal date to today!');
        },

        async handleEditGoal() {
            this.isEditingGoal = true;
            this.forms.goal = {
                ...this.state.goal,
                lastResetDate: new Date(this.state.goal.lastResetDate)
            };
        },

        async handleCancelEdit() {
            this.isEditingGoal = false;
            this.forms.goal = { ...DEFAULT_GOAL };
        },

        async handleUpdateGoal() {
            this.isEditingGoal = false;
            const updatedGoal = {
                description: this.forms.goal.description,
                lastResetDate: moment(this.forms.goal.lastResetDate).valueOf(),
                isGoalVisible: this.forms.goal.isGoalVisible
            };
            await this.setSyncStorageState({ goal: updatedGoal });
            this.forms.goal = { ...DEFAULT_GOAL };
            this.showSnackbarSuccess('Updated goal successfully!');
        },

        async handleClearGoal() {
            const defaultGoal = {
                description: '',
                lastResetDate: null
            };
            await this.setSyncStorageState({ goal: defaultGoal });
            this.showSnackbarFail('Goal removed');
        },

        showSnackbarSuccess(message) {
            this.showSnackbar(message, SUCCESS);
        },

        showSnackbarFail(message) {
            this.showSnackbar(message, FAIL);
        },

        showSnackbar(message, type) {
            this.snackbar.isVisible = true;
            this.snackbar.message = message;
            this.snackbar.type = type;
        },

        clearSnackbar() {
            this.snackbar = { ...DEFAULT_SNACKBAR };
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
            if (state.customRedirectUrl) {
                this.forms.customRedirectUrl.usesCustomRedirect = true;
                this.forms.customRedirectUrl.url = state.customRedirectUrl;
            } else {
                this.forms.customRedirectUrl = { ...DEFAULT_CUSTOM_REDIRECT_URL };
            }
        },

        async redirectToManageExtension() {
            await chromeUtils.tabs.update({ url: this.manageExtensionUrl })
        },

        async redirectToMissionControlScreen() {
            await chromeUtils.tabs.update({ url: this.missionControlScreenUrl })
        }
    }
});