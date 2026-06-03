/**
 * @file portfolio-init-scroll-debug.js
 * @description Scroll debugging utility for merchant portfolio.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function() {
    let scrollDebugTimeout = null;
    window.addEventListener('scroll', (e) => {
        if (scrollDebugTimeout) clearTimeout(scrollDebugTimeout);
        scrollDebugTimeout = setTimeout(() => {
            const scrollElement = e.target === document ? document.documentElement : e.target;
            const currentScroll = scrollElement.scrollTop || window.scrollY;
            const currentHeight = scrollElement.scrollHeight || document.documentElement.scrollHeight;
            const elementName = scrollElement.id || scrollElement.nodeName || 'Window';

            console.log(`[Scroll Debug] Live Scroll on [${elementName}]: ${currentScroll}px | Max Height: ${currentHeight}px`);
        }, 150);
    }, { capture: true });
})();
