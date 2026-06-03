/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * @file pages/merchant-portfolio/js/portfolio-actions-contact.js
 * @description Handles contact and rating action setup.
 */

window.portfolioSetupContactActions = function (user) {
    const masterBtn = document.getElementById('btn-contact-master');
    const fabContainer = document.getElementById('portfolio-fab-contact');
    const fabCall = document.getElementById('fab-call');
    const fabWhatsapp = document.getElementById('fab-whatsapp');

    const L = (key, fallback) => (window.langu ? (window.langu(key) || fallback) : fallback);

    const normalizeWa = (raw) => {
        let waClean = String(raw || "").replace(/\D/g, "");
        if (waClean.startsWith('01') && waClean.length === 11) waClean = '2' + waClean;
        return waClean ? `https://wa.me/${waClean}` : "";
    };

    /**
     * Modern Combined Contact Modal
     */
    window.portfolioOpenCombinedContactModal = function (profileUser) {
        const phones = Array.isArray(profileUser?.phones) && profileUser.phones.length
            ? profileUser.phones
            : [{ number: profileUser?.primary_phone || profileUser?.phone || "", is_primary: true, has_whatsapp: true }].filter(p => p.number);

        if (!phones.length) return;

        Swal.fire({
            title: L('contact_details_title', 'اتصل بالتاجر'),
            html: `
                <div class="modern-contact-list">
                    ${phones.map((p, idx) => `
                        <div class="contact-number-row" style="display: flex; flex-direction: column; align-items: center; padding: 16px; background: rgba(0,0,0,0.03); border-radius: 18px; margin-bottom: 12px; gap: 12px;">
                            <div class="contact-number-info" style="text-align: center; font-weight: 700; font-family: 'Outfit', sans-serif; color: #333; font-size: 1.1rem;">
                                ${p.number}
                                ${p.is_primary ? `<div style="font-size: 0.7rem; color: #f39c12; font-weight: 700; margin-top: 2px;">${L('phone_primary_label', 'الرقم الرئيسي')}</div>` : ''}
                            </div>
                            <div class="contact-actions-group" style="display: flex; gap: 15px; justify-content: center; width: 100%;">
                                <a href="tel:${p.number}" class="contact-action-icon call" style="color: #0f766e; font-size: 1.2rem; padding: 12px; background: rgba(15,118,110,0.1); border-radius: 12px; flex: 1; display: flex; justify-content: center; align-items: center; gap: 8px; text-decoration: none;">
                                    <i class="fas fa-phone"></i>
                                    <span style="font-size: 0.85rem;">${L('gen_call', 'اتصال')}</span>
                                </a>
                                ${p.has_whatsapp ? `
                                    <a href="${normalizeWa(p.number)}" target="_blank" class="contact-action-icon whatsapp" style="color: #16a34a; font-size: 1.3rem; padding: 12px; background: rgba(22,163,74,0.1); border-radius: 12px; flex: 1; display: flex; justify-content: center; align-items: center; gap: 8px; text-decoration: none;">
                                        <i class="fab fa-whatsapp"></i>
                                        <span style="font-size: 0.85rem;">واتساب</span>
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            customClass: {
                popup: 'swal-modern-mini-popup',
                container: 'swal-contact-container'
            }
        });
    };

    /**
     * Modern Social Links Modal
     */
    window.portfolioOpenSocialLinksModal = function (title, links, type) {
        const platformColors = {
            facebook: '#1877f2',
            instagram: '#e4405f',
            tiktok: '#000000',
            telegram: '#229ed9',
            x: '#111827',
            website: '#0f766e'
        };
        const color = platformColors[type] || '#333';

        Swal.fire({
            title: title,
            html: `
                <div class="modern-social-list" style="padding-top: 5px;">
                    ${links.map((link, idx) => `
                        <button type="button" class="swal-social-btn" data-link="${link}" style="display: flex; align-items: center; justify-content: center; width: 100%; padding: 14px; margin-bottom: 10px; border-radius: 14px; border: none; background: ${color}; color: #fff; font-weight: 700; gap: 10px; cursor: pointer; font-size: 0.9rem;">
                            <i class="${idx === 0 ? 'fas fa-link' : (idx === 1 ? 'fas fa-external-link-alt' : 'fas fa-share-alt')}"></i>
                            <span>${L('social_link_label', 'فتح الرابط')} ${links.length > 1 ? (idx + 1) : ''}</span>
                        </button>
                    `).join('')}
                </div>
            `,
            showConfirmButton: false,
            showCloseButton: true,
            customClass: {
                popup: 'swal-modern-mini-popup'
            },
            didOpen: () => {
                const popup = Swal.getPopup();
                popup.querySelectorAll('.swal-social-btn').forEach(btn => {
                    btn.onclick = () => {
                        const url = btn.dataset.link;
                        const normalized = url.startsWith('http') ? url : `https://${url}`;
                        window.open(normalized, '_blank');
                        Swal.close();
                    };
                });
            }
        });
    };

    if (masterBtn) {
        masterBtn.style.display = 'inline-flex';
        masterBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.portfolioOpenCombinedContactModal(user);
        };
    }

    if (fabCall) {
        fabCall.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.portfolioOpenCombinedContactModal(user);
        };
    }

    if (fabWhatsapp) {
        fabWhatsapp.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.portfolioOpenCombinedContactModal(user);
        };
    }

    if (fabContainer) {
        if (window._portfolioFabScrollHandler) {
            window.removeEventListener('scroll', window._portfolioFabScrollHandler);
        }
        window._portfolioFabScrollHandler = function () {
            if (window.scrollY > 400) fabContainer.classList.add('visible');
            else fabContainer.classList.remove('visible');
        };
        window.addEventListener('scroll', window._portfolioFabScrollHandler, { passive: true });
    }
};

window.portfolioSetupRatingAction = function (user, currentUser) {
    const rateBtn = document.getElementById('btn-rate-merchant');
    if (!rateBtn) return;

    const settings = typeof window.portfolioResolveProfileSettings === 'function'
        ? window.portfolioResolveProfileSettings(user || {})
        : {};

    const ratingEnabled = settings.ratingEnabled !== false;
    if (!ratingEnabled) {
        rateBtn.style.display = 'none';
    } else if (currentUser && currentUser.user_key === "guest_user") {
        rateBtn.style.setProperty('opacity', '0.5', 'important');
        rateBtn.style.setProperty('pointer-events', 'none', 'important');
    } else {
        rateBtn.onclick = function () {
            portfolioHandleRate(user);
        };
    }
};
