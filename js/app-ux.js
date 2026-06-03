/**
 * @file app-ux.js
 * @description User Experience (UX) and Tutorial module for the Bazaar application.
 * Manages interactive guides and visual help systems.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @function runHeaderScrollTutorial
 * @description Auto-scroll tutorial to show that the header is scrollable.
 * Runs limited number of times per user.
 */
export const runHeaderScrollTutorial = () => {
  var TUTORIAL_KEY = 'headerScrollTutorial_v4';
  var MAX_RUNS = 7;
  var SCROLL_DURATION = 1000;

  try {
    var count = parseInt(LocalDBStorage.getItem(TUTORIAL_KEY) || '0', 10);

    if (count >= MAX_RUNS) {
      return;
    }

    LocalDBStorage.setItem(TUTORIAL_KEY, (count + 1).toString());

    var wrapper = document.getElementById('index-app-header');
    if (!wrapper) return;

    setTimeout(function () {
      var scrollW = wrapper.scrollWidth;
      var clientW = wrapper.clientWidth;
      var maxScroll = scrollW - clientW;

      if (maxScroll <= 1) {
        return;
      }

      var originalPos = wrapper.scrollLeft;
      wrapper.scrollLeft = 50;
      var valPositive = wrapper.scrollLeft;
      wrapper.scrollLeft = originalPos;

      var targetValue = 0;
      if (valPositive > 1) {
        targetValue = maxScroll;
      } else {
        targetValue = -maxScroll;
      }

      console.log('[HeaderTutorial] Auto-scrolling to ' + targetValue + ' over ' + SCROLL_DURATION + 'ms');

      var startTime = performance.now();

      function animate(time) {
        var elapsed = time - startTime;
        var progress = Math.min(elapsed / SCROLL_DURATION, 1);
        var ease = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        var currentPos = targetValue * ease;
        wrapper.scrollLeft = currentPos;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setTimeout(function () {
            var returnStart = performance.now();
            function animateBack(t) {
              var e = t - returnStart;
              var p = Math.min(e / SCROLL_DURATION, 1);
              var easeBack = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
              wrapper.scrollLeft = targetValue * (1 - easeBack);
              if (p < 1) requestAnimationFrame(animateBack);
            }
            requestAnimationFrame(animateBack);
          }, 250);
        }
      }
      requestAnimationFrame(animate);
    }, 1500);

  } catch (e) {
    console.warn("[HeaderTutorial] Silent fail:", e);
  }
};

// Hybrid bridge
window.runHeaderScrollTutorial = runHeaderScrollTutorial;

console.log("[ESM Load] app-ux.js: Hybrid bridge established.");
