/**
 * @file pages/merchant-portfolio/js/controllers/portfolio-ratings-controller.js
 * @description Ratings/profile controller helpers with reactive profile refresh.
 */

(function () {
    let isBound = false;

    function getAPI() {
        return window.PortfolioAPI || {};
    }

    function getStore() {
        return window.PortfolioStore || null;
    }

    function getUserKey() {
        return getAPI().getUserKeyFromLocation
            ? getAPI().getUserKeyFromLocation()
            : (new URLSearchParams(window.location.search).get('user_key') || '');
    }

    function rerenderProfile(user) {
        if (!user) return null;

        if (typeof window.portfolioRenderProfile === 'function') {
            window.portfolioRenderProfile(user);
        }
        if (typeof window.portfolioSetupActions === 'function') {
            window.portfolioSetupActions(user);
        }

        return user;
    }

    function applyRatingsUpdate(targetUserKey, ratings) {
        const store = getStore();
        const resolvedUserKey = targetUserKey || getUserKey();
        const state = store ? store.getState() : window.portfolioState;
        const currentUser = state?.activeUser || null;
        if (!resolvedUserKey || !Array.isArray(ratings) || !currentUser || String(currentUser.user_key) !== String(resolvedUserKey)) {
            return null;
        }

        const nextUser = {
            ...currentUser,
            ratings: ratings
        };

        if (store) {
            store.patch({
                activeUser: nextUser,
                merchant: nextUser
            }, {
                source: 'ratings-controller'
            });
        } else {
            window.portfolioState.activeUser = nextUser;
            window.portfolioState.merchant = nextUser;
        }

        return nextUser;
    }

    function bindStore() {
        if (isBound || !getStore()) return;
        isBound = true;

        getStore().subscribe(function (state, payload) {
            if (payload?.meta?.source === 'actions-setup') {
                return;
            }
            if (payload.keys.some(function (key) { return ['activeUser', 'merchant'].includes(key); }) && state.activeUser) {
                rerenderProfile(state.activeUser);
            }
        });
    }

    window.portfolioRatingsController = {
        rerenderProfile,
        applyRatingsUpdate,
        bindStore
    };
})();
