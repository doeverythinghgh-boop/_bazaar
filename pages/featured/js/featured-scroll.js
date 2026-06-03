/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */
﻿/** Developer note: Hover effects are prohibited in this project. This UI is designed for tablet devices, so do not add hover-based behavior. */
/**
 * @file pages/featured/js/featured-scroll.js
 * @description Infinite scroll and animation logic for featured products.
 */

function setupFeaturedScroll(track) {
    let animationFrame;
    let isPaused = false;
    let lastTimestamp = 0;
    const scrollSpeedPerSecond = 35;
    const isRTL = document.documentElement.dir === 'rtl';

    let scrollPos = parseFloat(LocalDBSession.getItem('featured_scroll_pos')) || 0;

    const step = (timestamp) => {
        if (!lastTimestamp) lastTimestamp = timestamp;
        const elapsed = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        if (isPaused) {
            animationFrame = requestAnimationFrame(step);
            return;
        }

        const move = (scrollSpeedPerSecond * elapsed) / 1000;
        const halfWidth = track.scrollWidth / 2;

        if (!isRTL) {
            scrollPos += move;
            if (scrollPos >= halfWidth) scrollPos = 0;
            track.scrollLeft = scrollPos;
        } else {
            scrollPos += move;
            if (scrollPos >= halfWidth) scrollPos = 0;
            track.scrollLeft = -scrollPos;
            if (track.scrollLeft > 0) {
                track.scrollLeft = track.scrollWidth - track.clientWidth - scrollPos;
            }
        }

        LocalDBSession.setItem('featured_scroll_pos', scrollPos);
        animationFrame = requestAnimationFrame(step);
    };

    const startAutoScroll = () => {
        isPaused = false;
        lastTimestamp = performance.now();
    };

    const stopAutoScroll = () => {
        isPaused = true;
    };

    animationFrame = requestAnimationFrame(step);
    let touchTimeout;
    track.addEventListener('touchstart', () => {
        stopAutoScroll();
        if (touchTimeout) clearTimeout(touchTimeout);
    }, { passive: true });

    track.addEventListener('touchend', () => {
        requestAnimationFrame(() => {
            const halfWidth = track.scrollWidth / 2;
            let currentScroll = track.scrollLeft;

            if (!isRTL) {
                scrollPos = currentScroll % halfWidth;
            } else {
                scrollPos = Math.abs(currentScroll) % halfWidth;
            }
            LocalDBSession.setItem('featured_scroll_pos', scrollPos);
            lastTimestamp = 0;
        });

        if (touchTimeout) clearTimeout(touchTimeout);
        touchTimeout = setTimeout(startAutoScroll, 2500);
    }, { passive: true });
    track.addEventListener('touchcancel', startAutoScroll, { passive: true });

    return { stop: stopAutoScroll, start: startAutoScroll };
}


