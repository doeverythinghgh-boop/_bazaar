/**
 * @file pages/merchant-portfolio/js/renderers/portfolio-render-tags.js
 * @description Status tags and specialty labels rendering.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.portfolioRenderProfileTags = function (user, options) {
    const { specialtyViewModel, specialtyProfile, specialtyDisplayMeta, specialtyAccent } = options;
    const tagsContainer = document.getElementById('portfolio-tags');
    tagsContainer.innerHTML = '';

    if (user.username) {
        const usernameTag = document.createElement('span');
        usernameTag.id = 'pages-merchant-portfolio-merchant-portfoliohtml-span-393'; // Preserve ID that user might be relying on
        usernameTag.className = 'tag tag-identity';
        usernameTag.innerHTML = `<i class="fas fa-at"></i> ${user.username}`;
        tagsContainer.appendChild(usernameTag);
    }

    if (specialtyViewModel?.showProfileTags === false) {
        tagsContainer.style.display = 'none';
    } else if (tagsContainer.children.length > 0) {
        tagsContainer.style.display = 'flex';
    }

    // NEW: Deep Clean Button (Always appended to tags if container is visible)
    if (tagsContainer.style.display !== 'none') {
        const cleanBtn = document.createElement('span');
        cleanBtn.id = 'portfolio-tag-deep-clean';
        cleanBtn.className = 'tag tag-clean';
        cleanBtn.style.cursor = 'pointer';

        const cleanLabel = (window.app_language === 'en') ? 'Refresh Data' : 'تحديث البيانات';
        cleanBtn.innerHTML = `<i class="fas fa-sync-alt"></i> ${cleanLabel}`;

        cleanBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.portfolioDeepCleanAndReload === 'function') {
                const userKey = user.user_key || user.seller_key || new URLSearchParams(window.location.search).get('user_key');
                window.portfolioDeepCleanAndReload(userKey);
            }
        };

        tagsContainer.appendChild(cleanBtn);
        tagsContainer.style.display = 'flex'; // Ensure visible
    }
};
