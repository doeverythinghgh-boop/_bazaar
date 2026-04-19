/**
 * @file pages/merchant-portfolio/js/renderers/portfolio-render-header.js
 * @description Header and core actions (Share, Map, Settings, Pharmacy Request) rendering.
 */

window.portfolioRenderProfileHeaderActions = function (user) {
    document.getElementById('portfolio-name').textContent = user.business_name || user.username;

    const existingBtn = document.getElementById('btn-share-mini');
    if (existingBtn) existingBtn.remove();
    const existingWrapper = document.querySelector('.username-share-wrapper');
    if (existingWrapper) existingWrapper.remove();
    const existingContainer = document.getElementById('portfolio-share-main-container');
    if (existingContainer) existingContainer.remove();

    const shareContainer = document.createElement('div');
    shareContainer.id = 'portfolio-share-main-container';
    shareContainer.className = 'share-button-container';
    shareContainer.style.gap = '20px';

    const applyModernBtnStyle = (btn) => {
        btn.style.display = 'flex';
        btn.style.setProperty('display', 'flex', 'important');
        btn.style.setProperty('width', 'auto', 'important');
        btn.style.setProperty('height', 'auto', 'important');
        btn.style.setProperty('border-radius', '12px', 'important');
        btn.style.setProperty('padding', '8px 20px', 'important');
        btn.style.setProperty('flex-direction', 'column', 'important');
        btn.style.setProperty('gap', '0', 'important');
        btn.style.setProperty('background', 'transparent', 'important');
        btn.style.setProperty('border', 'none', 'important');
        btn.style.setProperty('box-shadow', 'none', 'important');
        btn.style.setProperty('backdrop-filter', 'none', 'important');
        btn.style.setProperty('color', 'inherit', 'important');

        if (user.user_key === 'guest_user' && btn.id !== 'btn-settings-mini') {
            btn.style.setProperty('opacity', '0.5', 'important');
            btn.style.setProperty('pointer-events', 'none', 'important');
            btn.style.setProperty('cursor', 'default', 'important');
        }
    };

    const shareBtn = document.createElement('a');
    shareBtn.id = 'btn-share-mini';
    shareBtn.href = '#';
    shareBtn.className = 'glass-btn contact-btn';
    const shareLabelText = typeof window.langu === 'function' ? window.langu('share') : 'مشاركة';
    shareBtn.innerHTML = `<i class="fas fa-share-alt"></i> <span data-lkey="share" style="font-size: 0.5rem; margin-top: 5px; display: block;">${shareLabelText}</span>`;
    applyModernBtnStyle(shareBtn);
    shareBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof portfolioHandleShare === 'function') portfolioHandleShare(user);
    };
    shareContainer.appendChild(shareBtn);

    if (user.location && user.location.trim() !== '') {
        const coords = user.location.replace(/\s/g, '');
        const mapBtn = document.createElement('a');
        mapBtn.id = 'btn-map-mini';
        mapBtn.href = `https://www.google.com/maps/search/?api=1&query=${coords}`;
        mapBtn.onclick = (e) => e.stopPropagation();
        mapBtn.className = 'glass-btn contact-btn';
        const mapLabelText = typeof window.langu === 'function' ? window.langu('location_on_map') : 'الموقع';
        mapBtn.innerHTML = `<i class="fas fa-map-location-dot"></i> <span data-lkey="location_on_map" style="font-size: 0.5rem; margin-top: 5px; display: block;">${mapLabelText}</span>`;
        applyModernBtnStyle(mapBtn);
        shareContainer.appendChild(mapBtn);
    }

    const settingsBtn = document.createElement('a');
    settingsBtn.id = 'btn-settings-mini';
    settingsBtn.href = '#';
    settingsBtn.className = 'glass-btn contact-btn';
    settingsBtn.setAttribute('data-lkey-title', 'settings');
    settingsBtn.innerHTML = `
        <i class="fas fa-cog"></i>
        <span data-lkey="settings" style="font-size: 0.5rem; margin-top: 5px; display: block;">${typeof window.langu === 'function' ? window.langu('settings') : 'الإعدادات'}</span>
    `;
    applyModernBtnStyle(settingsBtn);
    shareContainer.appendChild(settingsBtn);

    // --- PHARMACY SEND REQUEST BUTTON ---
    const isPharmacy = (user?.portfolio_view_model?.profile?.entries?.some(e => String(e.subId) === '204')) ||
                       (user && typeof user.business_category === 'string' && user.business_category.includes('"204"'));

    if (isPharmacy) {
        const sendRequestBtn = document.createElement('a');
        sendRequestBtn.id = 'btn-send-request-mini';
        sendRequestBtn.href = '#';
        sendRequestBtn.className = 'glass-btn contact-btn';
        const sendRequestLabelText = typeof window.langu === 'function' ? window.langu('port_send_request') : 'ارسل طلب';
        sendRequestBtn.innerHTML = `
            <i class="fas fa-paper-plane"></i>
            <span data-lkey="port_send_request" style="font-size: 0.5rem; margin-top: 5px; display: block;">${sendRequestLabelText}</span>
        `;
        applyModernBtnStyle(sendRequestBtn);
        
        sendRequestBtn.style.setProperty('opacity', '1', 'important');
        sendRequestBtn.style.setProperty('pointer-events', 'auto', 'important');
        sendRequestBtn.style.setProperty('cursor', 'pointer', 'important');
        
        sendRequestBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (typeof userSession !== 'undefined' && userSession.user_key !== 'guest_user') {
                window.location.href = `/pages/merchant-portfolio/send-request.html?user_key=${user.user_key}`;
            } else {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'warning',
                        title: window.langu('alert_title_info') || 'تسجيل الدخول مطلوب',
                        text: window.langu('port_login_required_request') || 'يجب تسجيل الدخول لتتمكن من إرسال طلب صيدلية مباشر.',
                        confirmButtonText: window.langu('login_text') || 'تسجيل الدخول',
                        showCancelButton: true,
                        cancelButtonText: window.langu('alert_cancel_btn') || 'إلغاء',
                        buttonsStyling: false,
                        customClass: {
                            popup: 'swal-modern-mini-popup',
                            title: 'swal-modern-mini-title',
                            htmlContainer: 'swal-modern-mini-text',
                            confirmButton: 'swal-modern-mini-confirm',
                            cancelButton: 'swal-modern-mini-cancel'
                        }
                    }).then((result) => {
                        if (result.isConfirmed) window.location.href = '/pages/identity/login.html';
                    });
                } else {
                    window.location.href = '/pages/identity/login.html';
                }
            }
        };
        shareContainer.appendChild(sendRequestBtn);
    }

    const nameContainer = document.getElementById('portfolio-name-container');
    nameContainer.style.display = 'flex';
    nameContainer.style.flexDirection = 'column';
    nameContainer.style.alignItems = 'center';
    nameContainer.appendChild(shareContainer);

    if (typeof window.dashboardSetupSettings === 'function') {
        window.dashboardSetupSettings('btn-settings-mini');
    }

    shareContainer.querySelectorAll('[data-lkey]').forEach((el) => {
        if (typeof window.langu === 'function') {
            el.textContent = window.langu(el.getAttribute('data-lkey'));
        }
    });
};
