/**
 * @file pages/ADMIN/adminPanel-ui.js
 * @description UI functions for the admin panel, including card rendering and selection management.
 */

/**
 * @description Populates the users dashboard with cards based on the provided data.
 * @function renderUsersCards
 * @param {Array<object>} users - Array containing user objects.
 * @returns {void}
 */
function renderUsersCards(users) {
    const grid = document.getElementById('admin-users-grid');
    const displayedCount = document.getElementById('displayed-users-count');

    if (!grid) return;
    grid.innerHTML = '';

    if (displayedCount) displayedCount.innerText = users.length;

    if (!users || users.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #888;">لا يوجد مستخدمون يطابقون بحثك.</div>`;
        return;
    }

    users.forEach(user => {
        const card = document.createElement('div');
        card.className = 'user-card';
        card.id = `user-card-${user.user_key}`;
        card.innerHTML = generateCardHTML(user);

        card.onclick = (e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.tagName === 'INPUT') return;
            selectUserCard(user.user_key, user.username);
        };

        grid.appendChild(card);
    });
}

/**
 * @description Helper to generate card HTML for a user.
 * @param {object} user - User object.
 * @returns {string} HTML string.
 */
function generateCardHTML(user) {
    const tokenStatusIcon = user.hasFCMToken
        ? '<i class="fas fa-check-circle" style="color: var(--success-color);" title="لديه توكن"></i>'
        : '<i class="fas fa-times-circle" style="color: var(--danger-color);" title="لا يوجد توكن"></i>';

    var roleBtnClass = 'btn-role-manage';
    var roleText = 'إدارة الحساب';
    if (user.isSeller && user.isDelivery) { roleBtnClass = 'btn-role-both'; roleText = 'بائع وموزع'; }
    else if (user.isSeller) { roleBtnClass = 'btn-role-seller'; roleText = 'حساب بائع'; }
    else if (user.isDelivery) { roleBtnClass = 'btn-role-delivery'; roleText = 'حساب موزع'; }

    return `
        <div class="card-header">
            <div class="user-info-main">
                <button class="btn-refresh-user" onclick="event.stopPropagation(); refreshSingleUser('${user.user_key}')" title="تحديث البيانات">
                    <i class="fas fa-sync-alt"></i>
                </button>
                <h3 class="copy-able" onclick="copyToClipboard('${user.username}')">${user.username || 'بدون اسم'}</h3>
                <span class="user-key-badge copy-able" onclick="copyToClipboard('${user.user_key}')">${user.user_key}</span>
            </div>
            <div class="token-status-icon">${tokenStatusIcon}</div>
        </div>

        <div class="card-body-details">
            <div class="detail-item">
                <span class="detail-label">الهاتف</span>
                <span class="detail-value copy-able" onclick="copyToClipboard('${user.phone}')">${user.phone || '—'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">كلمة المرور</span>
                <span class="detail-value copy-able" onclick="copyToClipboard('${user.Password}')">${user.Password || '—'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">العنوان</span>
                <span class="detail-value copy-able" onclick="copyToClipboard('${user.Address}')">${user.Address || '—'}</span>
            </div>
            <div class="detail-item">
                <span class="detail-label">المنصة</span>
                <span class="detail-value">${user.tokenPlatform || 'None'}</span>
            </div>
        </div>

        <div class="card-actions-row">
            <div class="card-action-group">
                <span class="group-title">الأدوار والعلاقات</span>
                <button class="btn-delivery-status ${roleBtnClass}" style="width: 100%" onclick="showRelationsModal('${user.user_key}', '${user.username}')">
                    ${roleText}
                </button>
            </div>

            <div class="card-action-group">
                <span class="group-title">إعدادات التسليم</span>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div class="flex-actions">
                        <input type="number" id="limit-input-${user.user_key}" value="${user.limitPackage}" class="input-small" placeholder="حد الباقة">
                        <button class="btn-delivery-status" style="background-color: var(--success-color);" onclick="updateUserField('${user.user_key}', 'limitPackage')">
                            <i class="fas fa-save"></i>
                        </button>
                    </div>
                    <div class="status-radio-group">
                        <label class="radio-option">
                            <input type="radio" name="isDelivered-${user.user_key}" value="1" ${user.isDelivered == 1 ? 'checked' : ''} onchange="updateUserField('${user.user_key}', 'isDelivered', this.value)"> نعم
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="isDelivered-${user.user_key}" value="0" ${user.isDelivered == 0 ? 'checked' : ''} onchange="updateUserField('${user.user_key}', 'isDelivered', this.value)"> لا
                        </label>
                    </div>
                </div>
            </div>

            <div class="card-action-group">
                <span class="group-title">رسائل ذكية</span>
                <div class="flex-actions">
                    <input type="text" id="notify-input-${user.user_key}" placeholder="نص الإشعار..." class="input-small">
                    <button class="btn-delivery-status" style="background-color: #ffc107; color: #000;" onclick="sendAdminNotification('${user.user_key}')">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>

            <button class="btn-delivery-status" style="background-color: #17a2b8; width: 100%; font-weight: bold;" onclick="loginAsUser('${user.user_key}')">
                <i class="fas fa-sign-in-alt"></i> دخول بالحساب
            </button>
        </div>
    `;
}

/**
 * @description Manages visual selection of a user card.
 * @function selectUserCard
 * @param {string} userKey - User key.
 * @param {string} username - Username.
 * @returns {void}
 */
function selectUserCard(userKey, username) {
    const allCards = document.querySelectorAll('.user-card');
    allCards.forEach(c => c.classList.remove('selected-card'));

    const activeCard = document.getElementById(`user-card-${userKey}`);
    if (activeCard) {
        activeCard.classList.add('selected-card');
    }

    const selectedUserDisplay = document.getElementById('selected-user-display');
    if (selectedUserDisplay) {
        selectedUserDisplay.innerText = `(${username})`;
    }
}

/**
 * @description Helper to copy text to clipboard and show toast notification.
 * @function copyToClipboard
 * @param {string} text - Text to copy.
 * @returns {void}
 */
window.copyToClipboard = (text) => {
    if (!text || ['غير متوفر', 'لا يوجد', '-', 'N/A', '—'].includes(text)) return;

    navigator.clipboard.writeText(text).then(() => {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true
        });
        Toast.fire({ icon: 'success', title: 'تم النسخ: ' + text });
    }).catch(err => console.error('فشل النسخ', err));
};
