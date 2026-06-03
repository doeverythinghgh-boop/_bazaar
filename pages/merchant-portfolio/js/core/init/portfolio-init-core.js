/**
 * @file portfolio-init-core.js
 * @description Main entry point for merchant portfolio initialization.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

async function initPortfolio() {
    const startTime = performance.now();
    console.log(`[Diagnostic][${startTime.toFixed(0)}ms] initPortfolio: Starting main initialization...`);

    // 0. Safety Circuit Breaker (Forced Timeout) to prevent infinite UI loading block
    setTimeout(() => {
        if (!window.portfolioNavigationRestorationComplete) {
            console.warn("[Diagnostic] Safety circuit breaker triggered: Unblocking navigation state saving (Forced).");
            window.portfolioNavigationRestorationComplete = true;
        }
    }, 6000);

    const controller = window.portfolioPageController;
    const hideMainLoader = controller?.hideMainLoader || function () { };
    if (controller?.bindReactiveControllers) {
        console.log(`[Diagnostic] Binding reactive controllers...`);
        controller.bindReactiveControllers();
    }

    const userKey = window.portfolioResolveUserKeyOrThrow ? window.portfolioResolveUserKeyOrThrow() : null;
    if (!userKey) return;

    if (window.portfolioConfigureScrollRestoration) window.portfolioConfigureScrollRestoration();
    if (window.portfolioConfigureSweetAlertForPage) window.portfolioConfigureSweetAlertForPage();

    // 1. Restore Navigation State
    if (window.portfolioRestoreNavigationState) {
        window.portfolioRestoreNavigationState(userKey);
    }

    let userRes = null;

    try {
        // 2. Fetch Data and Apply Cache
        if (window.portfolioInitFetchData) {
            userRes = await window.portfolioInitFetchData(userKey, controller, hideMainLoader);
        }

        if (controller?.syncDerivedUi) {
            console.log(`[Diagnostic] Syncing derived UI...`);
            controller.syncDerivedUi();
        }

        // --- SEARCH RESTORATION: Check if we should restore a previous search state ---
        if (typeof window.portfolioRestoreSearchFromLocal === 'function') {
            await window.portfolioRestoreSearchFromLocal(userKey);
        }

    } catch (error) {
        if (window.PortfolioErrorUtils?.log) {
            window.PortfolioErrorUtils.log("PortfolioInit", "Portfolio initialization failed.", error);
        } else {
            console.error('[Portfolio] Error:', error);
        }
        if (controller?.showErrorState) controller.showErrorState();
        else hideMainLoader();
    }

    // 3. Post-Render Restoration (Scroll, etc.)
    if (window.portfolioHandlePostRenderRestoration) {
        window.portfolioHandlePostRenderRestoration(userRes);
    }
}

window.initPortfolio = initPortfolio;
