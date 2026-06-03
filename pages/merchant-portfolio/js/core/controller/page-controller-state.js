/**
 * @file page-controller-state.js
 * @description State management and resolution for the portfolio page controller.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    window.portfolioPageControllerState = {
        getAPI: function() { return window.PortfolioAPI || {}; },
        getStore: function() { return window.PortfolioStore || null; },

        ensurePortfolioState: function() {
            if (this.getStore()) return this.getStore().getState();
            if (!window.portfolioState) window.portfolioState = {};
            return window.portfolioState;
        },

        getUserKey: function() {
            return this.getAPI().getUserKeyFromLocation
                ? this.getAPI().getUserKeyFromLocation()
                : (new URLSearchParams(window.location.search).get('user_key') || '');
        },

        getCache: function(userKey) {
            return this.getAPI().loadCache ? this.getAPI().loadCache(userKey || this.getUserKey()) : null;
        },

        getActiveUser: function() {
            return this.ensurePortfolioState().activeUser || this.getCache()?.user || null;
        },

        getSpecialtyViewModel: function(user) {
            const targetUser = user || this.getActiveUser();
            if (!targetUser) return null;
            return this.getAPI().resolveSpecialtyViewModel ? this.getAPI().resolveSpecialtyViewModel(targetUser) : null;
        }
    };
})();
