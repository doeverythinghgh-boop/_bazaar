/**
 * @file pages/merchant-portfolio/js/portfolio-featured-scroll.js
 * @description Featured products scroll engine.
 */

function startCommercialFeaturedScroll(track) {
    const state = window.portfolioFeaturedState;
    const isRTL = document.documentElement.dir === 'rtl';

    const step = (timestamp) => {
        if (!state.lastTimestamp) state.lastTimestamp = timestamp;
        const elapsed = timestamp - state.lastTimestamp;
        state.lastTimestamp = timestamp;

        if (state.isPaused) {
            state.animationFrame = requestAnimationFrame(step);
            return;
        }

        const move = (state.scrollSpeed * elapsed) / 1000;
        const halfWidth = track.scrollWidth / 2;

        state.scrollPos += move;
        if (state.scrollPos >= halfWidth) state.scrollPos = 0;

        const userKey = new URLSearchParams(window.location.search).get('user_key');
        if (userKey) {
            sessionStorage.setItem(state.storageKey + userKey, state.scrollPos.toFixed(2));
        }

        if (!isRTL) {
            track.scrollLeft = state.scrollPos;
        } else {
            track.scrollLeft = -state.scrollPos;
            if (track.scrollLeft > 0) {
                track.scrollLeft = track.scrollWidth - track.clientWidth - state.scrollPos;
            }
        }

        state.animationFrame = requestAnimationFrame(step);
    };

    state.animationFrame = requestAnimationFrame(step);

    track.addEventListener('scroll', () => {
        if (state.isPaused) {
            state.scrollPos = Math.abs(track.scrollLeft);
            const userKey = new URLSearchParams(window.location.search).get('user_key');
            if (userKey) {
                sessionStorage.setItem(state.storageKey + userKey, state.scrollPos.toFixed(2));
            }
        }
    }, { passive: true });

    track.addEventListener('touchstart', () => { state.isPaused = true; }, { passive: true });
    track.addEventListener('touchend', () => {
        setTimeout(() => {
            state.isPaused = false;
            state.lastTimestamp = performance.now();
        }, 1500);
    }, { passive: true });
    track.addEventListener('touchcancel', () => {
        state.isPaused = false;
        state.lastTimestamp = performance.now();
    }, { passive: true });
}
