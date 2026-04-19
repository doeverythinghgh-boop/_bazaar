/**
 * RULE: All comments and documentation must be in English only.
 * WARNING: Hover effects are strictly prohibited on this page to ensure touch-device compatibility.
 */
/**
 * @file pages/merchant-portfolio/js/portfolio-actions-contact.js
 * @description Handles contact and rating action setup.
 */

window.portfolioSetupContactActions = function (user) {
    const whatsappBtn = document.getElementById('btn-whatsapp');
    const callBtn = document.getElementById('btn-call');
    const fabWhatsapp = document.getElementById('fab-whatsapp');
    const fabCall = document.getElementById('fab-call');
    const fabContainer = document.getElementById('portfolio-fab-contact');

    const phones = Array.isArray(user?.phones) ? user.phones : [];
    const primaryPhone = user.primary_phone || user.phone;
    const whatsappPhone = user.whatsapp_phone || user.business_whatsapp || primaryPhone;
    if (!primaryPhone && !whatsappPhone) return;

    const normalizeWa = (raw) => {
        let waClean = String(raw || "").replace(/\D/g, "");
        if (waClean.startsWith('01') && waClean.length === 11) waClean = '2' + waClean;
        return waClean ? `https://wa.me/${waClean}` : "";
    };

    const waCandidates = [];
    // Prefer phones list (multiple WhatsApp capable numbers)
    phones.forEach((p) => {
        if (!p || !p.number) return;
        if (p.has_whatsapp) waCandidates.push(String(p.number));
    });
    if (user.whatsapp_phone) waCandidates.unshift(String(user.whatsapp_phone));
    else if (user.business_whatsapp) waCandidates.unshift(String(user.business_whatsapp));
    else if (primaryPhone) waCandidates.unshift(String(primaryPhone));

    const uniqueWa = Array.from(new Set(waCandidates.map((n) => n.trim()).filter(Boolean)));
    const waLinks = uniqueWa.map(normalizeWa).filter(Boolean).slice(0, 3);
    const waLink = waLinks[0] || "";

    const telClean = String(primaryPhone || "").replace(/[^\d+]/g, "");
    const telLink = `tel:${telClean}`;

    window.portfolioOpenPhoneChooser = function (profileUser) {
        const availablePhones = Array.isArray(profileUser?.phones) && profileUser.phones.length
            ? profileUser.phones
            : [{ number: profileUser?.primary_phone || profileUser?.phone || "", is_primary: true, has_whatsapp: true }].filter((item) => item.number);

        if (!availablePhones.length) return;

        if (availablePhones.length === 1) {
            window.location.href = `tel:${availablePhones[0].number}`;
            return;
        }

        Swal.fire({
            title: window.langu ? (window.langu("contact_details_title_phone") || "اختر رقم الاتصال") : "اختر رقم الاتصال",
            html: availablePhones.map((item, index) => `
                <button type="button" class="swal2-confirm swal2-styled" data-portfolio-phone-index="${index}" style="display:block; width:100%; margin:0 0 10px; background:#0f766e;">
                    ${item.number}${item.is_primary ? " (Primary)" : ""}${item.has_whatsapp ? " - WhatsApp" : ""}
                </button>
            `).join(""),
            showConfirmButton: false,
            didOpen: () => {
                const popup = Swal.getPopup();
                if (!popup) return;
                popup.querySelectorAll("[data-portfolio-phone-index]").forEach((button) => {
                    button.addEventListener("click", () => {
                        const selected = availablePhones[parseInt(button.getAttribute("data-portfolio-phone-index"), 10)];
                        if (selected?.number) {
                            window.location.href = `tel:${selected.number}`;
                        }
                        Swal.close();
                    });
                });
            }
        });
    };

    window.portfolioOpenWhatsappChooser = function (profileUser) {
        const entries = Array.isArray(profileUser?.phones) && profileUser.phones.length
            ? profileUser.phones
            : [{ number: profileUser?.whatsapp_phone || profileUser?.business_whatsapp || profileUser?.primary_phone || profileUser?.phone || "", is_primary: true, has_whatsapp: true }].filter((item) => item.number);

        const waNumbers = entries
            .filter((item) => item && item.number && (item.has_whatsapp || item.is_primary))
            .map((item) => String(item.number));

        const unique = Array.from(new Set(waNumbers.map((n) => n.trim()).filter(Boolean)));
        const links = unique.map(normalizeWa).filter(Boolean).slice(0, 3);
        if (!links.length) return;
        if (links.length === 1) {
            window.location.href = links[0];
            return;
        }

        Swal.fire({
            title: window.langu ? (window.langu("contact_details_title_whatsapp") || "اختر رقم واتساب") : "اختر رقم واتساب",
            html: unique.slice(0, 3).map((number, index) => `
                <button type="button" class="swal2-confirm swal2-styled" data-portfolio-wa-index="${index}" style="display:block; width:100%; margin:0 0 10px; background:#16a34a;">
                    ${number}
                </button>
            `).join(""),
            showConfirmButton: false,
            didOpen: () => {
                const popup = Swal.getPopup();
                if (!popup) return;
                popup.querySelectorAll("[data-portfolio-wa-index]").forEach((button) => {
                    button.addEventListener("click", () => {
                        const idx = parseInt(button.getAttribute("data-portfolio-wa-index"), 10);
                        const href = links[idx];
                        if (href) window.location.href = href;
                        Swal.close();
                    });
                });
            }
        });
    };

    if (whatsappBtn) {
        whatsappBtn.href = waLink || '#';
        whatsappBtn.style.display = 'inline-flex';
        whatsappBtn.onclick = function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (waLinks.length > 1) window.portfolioOpenWhatsappChooser(user);
            else if (waLink) window.location.href = waLink;
        };
    }
    if (callBtn) {
        callBtn.href = telLink;
        callBtn.style.display = 'inline-flex';
        callBtn.onclick = function (event) {
            event.preventDefault();
            event.stopPropagation();
            window.portfolioOpenPhoneChooser(user);
        };
    }
    if (fabWhatsapp) {
        fabWhatsapp.href = waLink || '#';
        fabWhatsapp.onclick = function (event) {
            event.preventDefault();
            event.stopPropagation();
            if (waLinks.length > 1) window.portfolioOpenWhatsappChooser(user);
            else if (waLink) window.location.href = waLink;
        };
    }
    if (fabCall) {
        fabCall.href = telLink;
        fabCall.onclick = function (event) { event.stopPropagation(); };
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

    let settings = {};
    try {
        settings = typeof user.settings === 'string' ? JSON.parse(user.settings || '{}') : (user.settings || {});
    } catch (error) {
        settings = {};
    }

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
