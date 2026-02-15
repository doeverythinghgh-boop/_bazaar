/**
 * @file pages/ADMIN/adminPanel-relations.js
 * @description Logic for managing relationships between users (e.g., sellers and distributors).
 */

/**
 * @function showRelationsModal
 * @description Displays the relations management modal for a user.
 * @param {string} userKey - The user's unique key.
 * @param {string} username - The user's name.
 * @returns {Promise<void>}
 */
async function showRelationsModal(userKey, username) {
    Swal.fire({
        title: 'جاري جلب العلاقات...',
        didOpen: () => Swal.showLoading()
    });

    try {
        const response = await fetch(`${baseURL}/api/suppliers-deliveries?relatedTo=${userKey}`);
        if (!response.ok) throw new Error('فشل جلب العلاقات');
        const data = await response.json();

        let htmlContent = `<div class="modern-modal-container">`;
        
        htmlContent += `<div class="modern-modal-header seller-type">📦 الموزعين التابعين له (كموزعين لديك)</div>`;
        htmlContent += `<div class="modern-relation-list">`;
        if (data.asSeller && data.asSeller.length > 0) {
            htmlContent += createRelationsListHtml(data.asSeller, userKey, 'seller');
        } else {
            htmlContent += `<div class="empty-state-text">لا يوجد موزعين مرتبطين.</div>`;
        }
        htmlContent += `</div>`;

        htmlContent += `<div class="modern-modal-header delivery-type">🚚 البائعين التابع لهم (كموزع لديهم)</div>`;
        htmlContent += `<div class="modern-relation-list">`;
        if (data.asDelivery && data.asDelivery.length > 0) {
            htmlContent += createRelationsListHtml(data.asDelivery, userKey, 'delivery');
        } else {
            htmlContent += `<div class="empty-state-text">لا يوجد بائعين مرتبطين.</div>`;
        }
        htmlContent += `</div>`;

        htmlContent += `
            <div class="add-relation-box">
                <h4 class="add-relation-title">➕ إضافة علاقة جديدة</h4>
                <div class="modern-input-group">
                    <input type="text" id="newRelUserKey" placeholder="مفتاح المستخدم..." class="modern-input">
                    <select id="newRelType" class="modern-select">
                        <option value="delivery">هو موزع لي</option>
                        <option value="seller">هو بائع لي</option>
                    </select>
                </div>
                <button onclick="handleAddRelation('${userKey}')" class="btn-modern-action">ربط الآن</button>
            </div>
        </div>`;

        Swal.fire({
            title: `إدارة علاقات: ${username}`,
            html: htmlContent,
            width: '600px',
            showConfirmButton: false,
            showCloseButton: true,
            customClass: {
                popup: 'modern-swal-popup'
            }
        });

    } catch (error) {
        console.error(error);
        Swal.fire('خطأ', 'حدث خطأ أثناء تحميل العلاقات', 'error');
    }
}

/**
 * @function createRelationsListHtml
 * @description Generates HTML markup for a list of relationships.
 * @param {Array<object>} list - List of related users.
 * @param {string} currentUserKey - The key of the user being managed.
 * @param {string} currentRoleContext - The role context ('seller' or 'delivery').
 * @returns {string} HTML string.
 */
function createRelationsListHtml(list, currentUserKey, currentRoleContext) {
    let html = '<ul style="list-style: none; padding: 0; margin: 0;">';
    list.forEach(item => {
        const actionBtnText = item.isActive ? 'تعطيل' : 'تفعيل';
        const sellerKey = currentRoleContext === 'seller' ? currentUserKey : item.userKey;
        const deliveryKey = currentRoleContext === 'delivery' ? currentUserKey : item.userKey;

        html += `
            <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                <div>
                    <strong style="display: block;">${item.username || 'بدون اسم'}</strong>
                    <small style="color: #666;">${item.userKey}</small>
                    <span class="status-badge ${item.isActive ? 'status-active' : 'status-inactive'}">${item.isActive ? 'نشط' : 'غير نشط'}</span>
                </div>
                <div>
                    <button onclick="handleToggleRelation('${sellerKey}', '${deliveryKey}', ${!item.isActive}, '${currentUserKey}')" 
                            class="action-btn ${item.isActive ? 'btn-danger' : 'btn-success'}">
                        ${actionBtnText}
                    </button>
                </div>
            </li>
        `;
    });
    html += '</ul>';
    return html;
}

/**
 * @function handleAddRelation
 * @description Handles adding a new relationship between two users.
 * @param {string} currentUserKey - The key of the owner of the modal.
 * @returns {Promise<void>}
 */
window.handleAddRelation = async (currentUserKey) => {
    const targetUserKey = document.getElementById('newRelUserKey').value.trim();
    const relType = document.getElementById('newRelType').value;

    if (!targetUserKey) {
        Swal.showValidationMessage('يرجى إدخال مفتاح المستخدم');
        return;
    }

    var sellerKey, deliveryKey;
    if (relType === 'delivery') {
        sellerKey = currentUserKey;
        deliveryKey = targetUserKey;
    } else {
        sellerKey = targetUserKey;
        deliveryKey = currentUserKey;
    }

    try {
        const response = await fetch(`${baseURL}/api/suppliers-deliveries`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sellerKey, deliveryKey, isActive: true })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'فشل الإضافة');

        Swal.fire({
            icon: 'success',
            title: 'تم!',
            text: 'تم إضافة العلاقة بنجاح',
            timer: 1500,
            showConfirmButton: false
        }).then(() => {
            const title = Swal.getTitle().textContent.replace('إدارة علاقات: ', '');
            showRelationsModal(currentUserKey, title);
        });

    } catch (error) {
        console.error('خطأ في إضافة العلاقة:', error);
    }
};

/**
 * @function handleToggleRelation
 * @description Handles enabling or disabling an existing relationship.
 * @param {string} sellerKey - The seller's unique key.
 * @param {string} deliveryKey - The distributor's unique key.
 * @param {boolean} newStatus - The target status (active/inactive).
 * @param {string} modalOwnerKey - The key of the user being managed (to refresh the UI).
 * @returns {Promise<void>}
 */
window.handleToggleRelation = async (sellerKey, deliveryKey, newStatus, modalOwnerKey) => {
    try {
        const response = await fetch(`${baseURL}/api/suppliers-deliveries`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sellerKey, deliveryKey, isActive: newStatus })
        });

        if (!response.ok) throw new Error('فشل التحديث');

        Swal.fire({
            icon: 'success',
            title: 'تم التحديث',
            timer: 1000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });

        const title = Swal.getTitle().textContent.replace('إدارة علاقات: ', '');
        showRelationsModal(modalOwnerKey, title);

    } catch (error) {
        console.error('خطأ في تحديث العلاقة:', error);
    }
};
