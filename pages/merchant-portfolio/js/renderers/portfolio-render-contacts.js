/**
 * @file pages/merchant-portfolio/js/renderers/portfolio-render-contacts.js
 * @description Social links and contact buttons (WhatsApp, Call, Facebook, etc.) rendering.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.portfolioRenderProfileContacts = function (user, options) {
    const { specialtyViewModel } = options;
    const waBtn = document.getElementById('btn-whatsapp');
    const fbBtn = document.getElementById('btn-facebook');
    const igBtn = document.getElementById('btn-instagram');
    const tkBtn = document.getElementById('btn-tiktok');
    const tgBtn = document.getElementById('btn-telegram');
    const xBtn = document.getElementById('btn-x');
    const webBtn = document.getElementById('btn-website');
    const callBtn = document.getElementById('btn-call');

    const toArray = (value) => {
        if (Array.isArray(value)) return value;
        if (!value || typeof value !== 'string') return [];
        const trimmed = value.trim();
        return trimmed ? [trimmed] : [];
    };

    const normalizeUrl = (value) => {
        const trimmed = String(value || "").trim();
        if (!trimmed) return "";
        return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
    };

    console.log('[Portfolio_Contacts] Rendering contacts for user:', user.username, 'Links:', user.links);
    let socialLinks = {};
    if (user.links) {
        try {
            socialLinks = typeof user.links === 'string' ? JSON.parse(user.links) : user.links;
            console.log('[Portfolio_Contacts] Parsed socialLinks:', socialLinks);
        } catch (error) {
            console.error('[Portfolio_Contacts] Failed to parse user links:', error, user.links);
            if (window.PortfolioErrorUtils?.log) {
                window.PortfolioErrorUtils.log("PortfolioRenderContacts", "Failed to parse social links payload.", error);
            } else {
                console.error('Error parsing social links:', error);
            }
            socialLinks = {};
        }
    }

    const isValidValue = (value) => {
        if (!value || typeof value !== 'string') return false;
        const trimmed = value.trim();
        return trimmed !== '' && trimmed.toLowerCase() !== 'null' && trimmed.toLowerCase() !== 'undefined';
    };

    [waBtn, fbBtn, igBtn, tkBtn, tgBtn, xBtn, webBtn, callBtn, document.getElementById('btn-contact-master')].forEach((btn) => {
        if (btn) btn.style.setProperty('display', 'none', 'important');
    });

    let hasContact = false;
    const phones = Array.isArray(user.phones) ? user.phones : [];

    // Master Contact Button Logic
    const masterBtn = document.getElementById('btn-contact-master');
    if (phones.length || isValidValue(user.phone) || isValidValue(user.whatsapp_phone)) {
        if (masterBtn) {
            masterBtn.style.setProperty('display', 'flex', 'important');
            masterBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (typeof window.portfolioOpenCombinedContactModal === 'function') {
                    window.portfolioOpenCombinedContactModal(user);
                }
            };
        }
        hasContact = true;
    }

    [
        { key: 'facebook', btn: fbBtn, titleKey: 'business_facebook_label', fallbackTitle: 'Facebook' },
        { key: 'instagram', btn: igBtn, titleKey: 'business_instagram_label', fallbackTitle: 'Instagram' },
        { key: 'tiktok', btn: tkBtn, titleKey: 'business_tiktok_label', fallbackTitle: 'TikTok' },
        { key: 'telegram', btn: tgBtn, titleKey: 'business_telegram_label', fallbackTitle: 'Telegram' },
        { key: 'x', btn: xBtn, titleKey: 'business_x_label', fallbackTitle: 'X' },
        { key: 'website', btn: webBtn, titleKey: 'business_website_label', fallbackTitle: 'Website' }
    ].forEach(({ key, btn, titleKey, fallbackTitle }) => {
        const val = socialLinks[key];
        const list = toArray(val).filter((link) => !!link && typeof link === 'string' && link.trim() !== '').slice(0, 3);
        if (!list.length || !btn) return;

        const title = typeof window.langu === 'function' ? (window.langu(titleKey) || fallbackTitle) : fallbackTitle;

        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();

            // If more than one link, show modal. If exactly one, open directly.
            if (list.length > 1 && typeof window.portfolioOpenSocialLinksModal === 'function') {
                window.portfolioOpenSocialLinksModal(title, list, key);
            } else if (list[0]) {
                window.open(normalizeUrl(list[0]), '_blank');
            }
        };

        btn.style.setProperty('display', 'flex', 'important');
        hasContact = true;
    });

    const wrapper = document.getElementById('portfolio-connect-wrapper');
    if (wrapper) {
        const isVisible = (hasContact && specialtyViewModel?.showContactSection !== false);
        console.log('[Portfolio_Contacts] Contact section visibility:', isVisible, {
            hasContact,
            showContactSection: specialtyViewModel?.showContactSection,
            socialKeys: Object.keys(socialLinks)
        });
        wrapper.style.display = isVisible ? 'block' : 'none';
    }
};
