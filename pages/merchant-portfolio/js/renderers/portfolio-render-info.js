/**
 * @file pages/merchant-portfolio/js/renderers/portfolio-render-info.js
 * @description Bio and address info rendering for merchant portfolio.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.portfolioRenderProfileInfo = function (user) {
    const bioEl = document.getElementById('portfolio-bio');
    const accordionEl = document.getElementById('portfolio-bio-accordion');
    const descTextEl = document.getElementById('portfolio-description-text');
    const accordionToggle = document.getElementById('accordion-toggle');

    if (!bioEl) return;

    const fullBio = user.business_bio || '';
    const parts = fullBio.split('\n\n');
    const tagline = parts[0] || '';
    const description = parts.slice(1).join('\n\n') || '';

    // 1. Render Tagline in the header area
    bioEl.innerHTML = tagline ? `<span class="bio-tagline">${tagline}</span>` : '';
    bioEl.classList.remove('skeleton-item');
    bioEl.style.minWidth = 'auto';
    bioEl.style.minHeight = 'auto';

    // 2. Render Activity Description in the Accordion (Inside Connect Wrapper)
    if (accordionEl && descTextEl) {
        if (description) {
            descTextEl.textContent = description;
            accordionEl.style.display = 'block';

            // Reset state to closed when re-rendering
            accordionToggle.classList.remove('active');

            // Click interaction for toggle
            // We remove any existing listener by cloning (standard pattern if needed, but here simple assignment is usually okay in this SPA context)
            accordionToggle.onclick = (e) => {
                e.preventDefault();
                accordionToggle.classList.toggle('active');
            };
        } else {
            accordionEl.style.display = 'none';
        }
    }
};




