/**
 * @file page-controller-scroll.js
 * @description Scroll persistence and restoration for the portfolio page controller.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    window.portfolioPageControllerScroll = {
        getScrollY: function() {
            return window.scrollY ||
                window.pageYOffset ||
                document.documentElement.scrollTop ||
                document.body.scrollTop ||
                (document.getElementById('portfolio-main-container')?.scrollTop || 0);
        },

        restoreCachedScroll: function(cache) {
            const stateUtil = window.portfolioPageControllerState;
            if (!cache?.scrollY || cache.scrollY <= 10) {
                if (stateUtil?.getStore()) {
                    stateUtil.getStore().patch({ isFirstLoad: false }, { source: 'page-controller' });
                } else if (stateUtil) {
                    stateUtil.ensurePortfolioState().isFirstLoad = false;
                }
                return;
            }

            const targetY = cache.scrollY;
            let restorationAttempts = 0;
            const restorationInterval = setInterval(() => {
                window.scrollTo(0, targetY);
                if (document.documentElement) document.documentElement.scrollTop = targetY;
                if (document.body) document.body.scrollTop = targetY;

                restorationAttempts += 1;
                const currentY = this.getScrollY();
                if (Math.abs(currentY - targetY) < 10 || restorationAttempts > 40) {
                    clearInterval(restorationInterval);
                    if (stateUtil?.getStore()) {
                        stateUtil.getStore().patch({ isFirstLoad: false }, { source: 'page-controller' });
                    } else if (stateUtil) {
                        stateUtil.ensurePortfolioState().isFirstLoad = false;
                    }
                }
            }, 100);
        },

        setupScrollPersistence: function(userKey) {
            const stateUtil = window.portfolioPageControllerState;
            const api = stateUtil?.getAPI();
            const resolvedUserKey = userKey || stateUtil?.getUserKey();
            if (!resolvedUserKey || !api?.saveCache) return;

            if (window._portfolioScrollHandler) {
                document.removeEventListener('scroll', window._portfolioScrollHandler, true);
            }
            if (window._portfolioBeforeUnloadHandler) {
                window.removeEventListener('beforeunload', window._portfolioBeforeUnloadHandler);
            }

            let scrollTimeout;
            const scrollHandler = () => {
                const currentY = this.getScrollY();
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    if (!stateUtil.ensurePortfolioState().isFirstLoad) {
                        api.saveCache(resolvedUserKey, { scrollY: Math.round(currentY) });
                    }
                }, 300);
            };

            const beforeUnloadHandler = () => {
                const finalY = this.getScrollY();
                if (Math.round(finalY) > 0) {
                    api.saveCache(resolvedUserKey, { scrollY: Math.round(finalY) });
                }
            };

            window._portfolioScrollHandler = scrollHandler;
            window._portfolioBeforeUnloadHandler = beforeUnloadHandler;

            document.addEventListener('scroll', scrollHandler, { passive: true, capture: true });
            window.addEventListener('beforeunload', beforeUnloadHandler);
        }
    };
})();
