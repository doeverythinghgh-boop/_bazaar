/**
 * @file pages/merchant-portfolio/js/renderers/portfolio-render-contacts.js
 * @description Social links and contact buttons (WhatsApp, Call, Facebook, etc.) rendering.
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

    let socialLinks = {};
    if (user.links) {
        try {
            socialLinks = typeof user.links === 'string' ? JSON.parse(user.links) : user.links;
        } catch (e) {
            console.error('Error parsing social links:', e);
            socialLinks = {};
        }
    }

    const openLinkChooser = (title, links) => {
        const list = Array.isArray(links) ? links : [];
        if (!list.length) return;
        if (list.length === 1) {
            window.open(normalizeUrl(list[0]), '_blank');
            return;
        }

        Swal.fire({
            title: title,
            html: list.slice(0, 3).map((link, index) => `
                <button type="button" class="swal2-confirm swal2-styled" data-portfolio-link-index="${index}" style="display:block; width:100%; margin:0 0 10px; background:#0f766e;">
                    ${link}
                </button>
            `).join(""),
            showConfirmButton: false,
            didOpen: () => {
                const popup = Swal.getPopup();
                if (!popup) return;
                popup.querySelectorAll("[data-portfolio-link-index]").forEach((button) => {
                    button.addEventListener("click", () => {
                        const selected = list[parseInt(button.getAttribute("data-portfolio-link-index"), 10)];
                        if (selected) {
                            window.open(normalizeUrl(selected), '_blank');
                        }
                        Swal.close();
                    });
                });
            }
        });
    };

    const isValidValue = (value) => {
        if (!value || typeof value !== 'string') return false;
        const trimmed = value.trim();
        return trimmed !== '' && trimmed.toLowerCase() !== 'null' && trimmed.toLowerCase() !== 'undefined';
    };

    [waBtn, fbBtn, igBtn, tkBtn, tgBtn, xBtn, webBtn, callBtn].forEach((btn) => {
        if (btn) btn.style.setProperty('display', 'none', 'important');
    });

    let hasContact = false;
    const phones = Array.isArray(user.phones) ? user.phones : [];
    const waValue = user.whatsapp_phone || user.business_whatsapp || user.phone;
    if (isValidValue(waValue)) {
        let waClean = waValue.replace(/\D/g, '');
        if (waClean.startsWith('01') && waClean.length === 11) waClean = '2' + waClean;
        waBtn.href = `https://wa.me/${waClean}`;
        waBtn.onclick = (e) => e.stopPropagation();
        waBtn.style.setProperty('display', 'flex', 'important');
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
        const list = toArray(socialLinks[key]).filter((v) => typeof v === 'string' && v.trim() !== '').slice(0, 3);
        if (!list.length) return;

        const title = typeof window.langu === 'function' ? (window.langu(titleKey) || fallbackTitle) : fallbackTitle;
        btn.href = '#';
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            openLinkChooser(title, list);
        };
        btn.style.setProperty('display', 'flex', 'important');
        hasContact = true;
    });

    if (phones.length || isValidValue(user.phone)) {
        const primaryCallPhone = user.primary_phone || user.phone;
        const telClean = String(primaryCallPhone || '').replace(/[^\d+]/g, '');
        callBtn.href = `tel:${telClean}`;
        callBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof window.portfolioOpenPhoneChooser === 'function') {
                window.portfolioOpenPhoneChooser(user);
            } else if (telClean) {
                window.location.href = `tel:${telClean}`;
            }
        };
        callBtn.style.setProperty('display', 'flex', 'important');
        hasContact = true;
    }

    const wrapper = document.getElementById('portfolio-connect-wrapper');
    if (wrapper) {
        wrapper.style.display = (hasContact && specialtyViewModel?.showContactSection !== false) ? 'block' : 'none';
    }
};
