/**
 * @file pages/merchant-portfolio/js/services/portfolio-safe-fetch.js
 * @description Shared retry/error strategy for merchant portfolio requests.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
    async function wait(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function request(executor, options = {}) {
        const retries = Number.isFinite(options.retries) ? options.retries : 1;
        const retryDelayMs = Number.isFinite(options.retryDelayMs) ? options.retryDelayMs : 300;
        const retryBackoff = Number.isFinite(options.retryBackoff) ? options.retryBackoff : 2;
        const fallback = Object.prototype.hasOwnProperty.call(options, 'fallback') ? options.fallback : null;
        const onError = typeof options.onError === 'function' ? options.onError : null;
        const shouldRetry = typeof options.shouldRetry === 'function'
            ? options.shouldRetry
            : function () { return true; };

        let attempt = 0;
        let lastError = null;
        let currentDelay = retryDelayMs;

        while (attempt <= retries) {
            try {
                const result = await executor();
                if (result && result.error) {
                    throw new Error(result.error);
                }
                return result;
            } catch (error) {
                lastError = error;
                const canRetry = attempt < retries && shouldRetry(error, attempt + 1);
                if (!canRetry) break;
                await wait(currentDelay);
                currentDelay *= retryBackoff;
                attempt += 1;
            }
        }

        if (onError) onError(lastError);
        return fallback;
    }

    window.PortfolioSafeFetch = {
        request
    };
})();
