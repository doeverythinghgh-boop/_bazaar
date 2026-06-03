/**
 * @file pages/ADMIN/adminPanel-relations.js
 * @description Logic for managing relationships between users (e.g., commercial providers and distributors).
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function ensureAdminRelationsDb() {
    if (typeof window.ensureFirestoreDb !== "function") {
        throw new Error("ensureFirestoreDb function is not loaded/available");
    }
    return window.ensureFirestoreDb();
}

function adminRelationDocId(sellerKey, deliveryKey) {
    return `${sellerKey}__${deliveryKey}`;
}

function normalizeAdminRelation(doc) {
    const data = typeof doc.data === "function" ? doc.data() : doc;
    return {
        ...data,
        id: doc.id || data.id || "",
        seller_key: data.seller_key || data.sellerKey || "",
        delivery_key: data.delivery_key || data.deliveryKey || data.user_key || "",
        is_active: data.is_active !== false && data.isActive !== false
    };
}

async function fetchAdminUserFromTurso(userKey) {
    const payload = await apiFetch(`/api/users?user_key=${encodeURIComponent(userKey)}`).catch(() => null);
    if (!payload || payload.error) return null;
    return payload;
}

async function findAdminRelationUser(userKey) {
    if (!userKey) return null;

    if (Array.isArray(window.allUsers_cache)) {
        const cached = window.allUsers_cache.find((user) => user.user_key === userKey);
        if (cached) return cached;
    }

    if (window.usersDB?.getUserByKey) {
        try {
            const localUser = await window.usersDB.getUserByKey(userKey);
            if (localUser) return localUser;
        } catch (error) {
            console.error("[AdminRelations] Failed to read user from local DB.", error);
        }
    }

    const apiUser = await fetchAdminUserFromTurso(userKey);
    if (apiUser) return apiUser;

    return null;
}

async function buildAdminRelationUserMap(userKeys) {
    const entries = await Promise.all([...new Set(userKeys.filter(Boolean))]
        .map(async (key) => [key, await findAdminRelationUser(key)]));
    return new Map(entries);
}

function relationUserName(user, relation, fallbackKey, type) {
    if (user?.username || user?.business_name) return user.username || user.business_name;
    if (type === "delivery") return relation.delivery_name || fallbackKey;
    return relation.seller_name || fallbackKey;
}

function relationUserPhone(user, relation, type) {
    if (user?.phone || user?.primary_phone) return user.phone || user.primary_phone;
    if (type === "delivery") return relation.delivery_phone || "";
    return relation.seller_phone || "";
}

async function fetchAdminRelations(userKey) {
    const db = await ensureAdminRelationsDb();
    const [asSellerSnap, asDeliverySnap] = await Promise.all([
        db.collection("supplier_deliveries").where("seller_key", "==", userKey).get(),
        db.collection("supplier_deliveries").where("delivery_key", "==", userKey).get()
    ]);

    const asSellerRelations = asSellerSnap.docs.map(normalizeAdminRelation);
    const asDeliveryRelations = asDeliverySnap.docs.map(normalizeAdminRelation);
    const userMap = await buildAdminRelationUserMap([
        ...asSellerRelations.map((relation) => relation.delivery_key),
        ...asDeliveryRelations.map((relation) => relation.seller_key)
    ]);

    return {
        asSeller: asSellerRelations.map((relation) => {
            const delivery = userMap.get(relation.delivery_key);
            return {
                userKey: relation.delivery_key,
                username: relationUserName(delivery, relation, relation.delivery_key, "delivery"),
                phone: relationUserPhone(delivery, relation, "delivery"),
                isActive: relation.is_active,
                role: "delivery"
            };
        }),
        asDelivery: asDeliveryRelations.map((relation) => {
            const seller = userMap.get(relation.seller_key);
            return {
                userKey: relation.seller_key,
                username: relationUserName(seller, relation, relation.seller_key, "seller"),
                phone: relationUserPhone(seller, relation, "seller"),
                isActive: relation.is_active,
                role: "commercial"
            };
        })
    };
}

async function saveAdminRelation(sellerKey, deliveryKey, isActive) {
    const db = await ensureAdminRelationsDb();
    const [seller, delivery] = await Promise.all([
        findAdminRelationUser(sellerKey),
        findAdminRelationUser(deliveryKey)
    ]);

    if (!seller) throw new Error(adminRelationsText("admin_relations_seller_not_found", "مقدم الخدمة غير موجود."));
    if (!delivery) throw new Error(adminRelationsText("admin_relations_delivery_not_found", "مقدم التوصيل غير موجود."));

    const sellerCaps = typeof window.resolveUserCapabilities === "function" ? window.resolveUserCapabilities(seller) : null;
    const deliveryCaps = typeof window.resolveUserCapabilities === "function" ? window.resolveUserCapabilities(delivery) : null;
    if (sellerCaps && !sellerCaps.isCommercial && !sellerCaps.isServiceProvider) {
        throw new Error(adminRelationsText("admin_relations_seller_not_eligible", "المستخدم المحدد كمقدم خدمة غير مؤهل لهذه العلاقة."));
    }
    if (deliveryCaps && !deliveryCaps.canDeliver) {
        throw new Error(adminRelationsText("admin_relations_delivery_not_eligible", "المستخدم المحدد للتوصيل غير مؤهل لهذه العلاقة."));
    }

    await db.collection("supplier_deliveries")
        .doc(adminRelationDocId(sellerKey, deliveryKey))
        .set({
            seller_key: sellerKey,
            seller_name: seller.username || seller.business_name || sellerKey,
            seller_phone: seller.phone || seller.primary_phone || "",
            delivery_key: deliveryKey,
            delivery_name: delivery.username || delivery.business_name || deliveryKey,
            delivery_phone: delivery.phone || delivery.primary_phone || "",
            delivery_location: delivery.location || delivery.user_location || "",
            is_active: !!isActive,
            updated_at: new Date().toISOString()
        }, { merge: true });
}

async function showRelationsModal(userKey, username) {
    Swal.fire({
        title: adminRelationsText("admin_relations_loading", "جاري جلب العلاقات..."),
        allowOutsideClick: false,
        showConfirmButton: false,
        customClass: {
            popup: "swal-modern-mini-popup",
            title: "swal-modern-mini-title",
            htmlContainer: "swal-modern-mini-text"
        },
        didOpen: () => Swal.showLoading()
    });

    try {
        const data = await fetchAdminRelations(userKey);

        let htmlContent = `<div id="relations-modal-container-${userKey}" class="modern-modal-container">`;

        htmlContent += `<div id="relations-commercial-header-${userKey}" class="modern-modal-header commercial-type">📦 ${adminRelationsText("admin_relations_as_seller_header", "الموزعين التابعين له (كموزعين لديك)")}</div>`;
        htmlContent += `<div id="relations-commercial-list-${userKey}" class="modern-relation-list">`;
        if (Array.isArray(data?.asSeller) && data.asSeller.length > 0) {
            htmlContent += createRelationsListHtml(data.asSeller, userKey, username, "commercial");
        } else {
            htmlContent += `<div id="relations-commercial-empty-${userKey}" class="empty-state-text">${adminRelationsText("admin_relations_empty_seller", "لا يوجد موزعين مرتبطين.")}</div>`;
        }
        htmlContent += "</div>";

        htmlContent += `<div id="relations-delivery-header-${userKey}" class="modern-modal-header delivery-type">🚚 ${adminRelationsText("admin_relations_as_delivery_header", "مقدمو الخدمة التابع لهم (كموزع لديهم)")}</div>`;
        htmlContent += `<div id="relations-delivery-list-${userKey}" class="modern-relation-list">`;
        if (Array.isArray(data?.asDelivery) && data.asDelivery.length > 0) {
            htmlContent += createRelationsListHtml(data.asDelivery, userKey, username, "delivery");
        } else {
            htmlContent += `<div id="relations-delivery-empty-${userKey}" class="empty-state-text">${adminRelationsText("admin_relations_empty_delivery", "لا يوجد مقدمو خدمة مرتبطون.")}</div>`;
        }
        htmlContent += "</div>";

        htmlContent += `
            <div id="add-relation-box-${userKey}" class="add-relation-box">
                <h4 id="add-relation-title-${userKey}" class="add-relation-title">➕ ${adminRelationsText("admin_relations_add_title", "إضافة علاقة جديدة")}</h4>
                <div id="add-relation-input-group-${userKey}" class="modern-input-group">
                    <input type="text" id="newRelUserKey-${userKey}" placeholder="${adminRelationsText("admin_relations_user_key_placeholder", "مفتاح المستخدم...")}" class="modern-input">
                    <select id="newRelType-${userKey}" class="modern-select">
                        <option id="newRelType-delivery-${userKey}" value="delivery">${adminRelationsText("admin_relations_type_delivery", "هو موزع لي")}</option>
                        <option id="newRelType-commercial-${userKey}" value="commercial">${adminRelationsText("admin_relations_type_commercial", "هو مقدم خدمة لي")}</option>
                    </select>
                </div>
                <button id="add-relation-submit-${userKey}" onclick="handleAddRelation('${userKey}', '${username}')" class="btn-modern-action">${adminRelationsText("admin_relations_link_now", "ربط الآن")}</button>
            </div>
        </div>`;

        Swal.fire({
            title: adminRelationsText("admin_relations_manage_title", "إدارة علاقات: {username}").replace("{username}", username),
            html: htmlContent,
            width: "600px",
            showConfirmButton: false,
            showCloseButton: true,
            customClass: {
                popup: "swal-modern-mini-popup swal-table-popup",
                title: "swal-modern-mini-title",
                htmlContainer: "swal-modern-mini-text"
            }
        });
    } catch (error) {
        console.error(error);
        Swal.fire({
            icon: "error",
            title: adminRelationsText("gen_swal_error_title", "خطأ"),
            text: error.message || adminRelationsText("admin_relations_load_error", "حدث خطأ أثناء تحميل العلاقات"),
            customClass: {
                popup: "swal-modern-mini-popup",
                title: "swal-modern-mini-title",
                htmlContainer: "swal-modern-mini-text",
                confirmButton: "swal-modern-mini-confirm"
            }
        });
    }
}

function createRelationsListHtml(list, currentUserKey, username, currentRoleContext) {
    let html = `<ul id="relations-items-${currentRoleContext}-${currentUserKey}" style="list-style: none; padding: 0; margin: 0;">`;

    list.forEach((item, index) => {
        const actionBtnText = item.isActive
            ? adminRelationsText("admin_relations_action_deactivate", "تعطيل")
            : adminRelationsText("admin_relations_action_activate", "تفعيل");
        const sellerKey = currentRoleContext === "commercial" ? currentUserKey : item.userKey;
        const deliveryKey = currentRoleContext === "delivery" ? currentUserKey : item.userKey;
        const itemIdBase = `${currentRoleContext}-${currentUserKey}-${item.userKey}-${index}`;

        html += `
            <li id="relation-item-${itemIdBase}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                <div id="relation-info-${itemIdBase}">
                    <strong id="relation-name-${itemIdBase}" style="display: block;">${item.username || adminRelationsText("admin_relations_default_username", "بدون اسم")}</strong>
                    <small id="relation-key-${itemIdBase}" style="color: #666;">${item.userKey}</small>
                    <span id="relation-status-${itemIdBase}" class="status-badge ${item.isActive ? "status-active" : "status-inactive"}">${item.isActive ? adminRelationsText("admin_relations_status_active", "نشط") : adminRelationsText("admin_relations_status_inactive", "غير نشط")}</span>
                </div>
                <div id="relation-actions-${itemIdBase}">
                    <button id="relation-toggle-${itemIdBase}" onclick="handleToggleRelation('${sellerKey}', '${deliveryKey}', ${!item.isActive}, '${currentUserKey}', '${username}')" 
                            class="action-btn ${item.isActive ? "btn-danger" : "btn-success"}">
                        ${actionBtnText}
                    </button>
                </div>
            </li>
        `;
    });

    html += "</ul>";
    return html;
}

window.handleAddRelation = async (currentUserKey, username) => {
    const targetInput = document.getElementById(`newRelUserKey-${currentUserKey}`);
    const typeSelect = document.getElementById(`newRelType-${currentUserKey}`);
    const targetUserKey = targetInput ? targetInput.value.trim() : "";
    const relType = typeSelect ? typeSelect.value : "";

    if (!targetUserKey) {
        Swal.showValidationMessage(adminRelationsText("admin_relations_validation_user_key", "يرجى إدخال مفتاح المستخدم"));
        return;
    }

    let sellerKey;
    let deliveryKey;

    if (relType === "delivery") {
        sellerKey = currentUserKey;
        deliveryKey = targetUserKey;
    } else {
        sellerKey = targetUserKey;
        deliveryKey = currentUserKey;
    }

    try {
        await saveAdminRelation(sellerKey, deliveryKey, true);

        Swal.fire({
            icon: "success",
            title: adminRelationsText("gen_swal_success_title", "نجاح"),
            text: adminRelationsText("admin_relations_added", "تم إضافة العلاقة بنجاح"),
            timer: 1500,
            showConfirmButton: false,
            customClass: {
                popup: "swal-modern-mini-popup",
                title: "swal-modern-mini-title",
                htmlContainer: "swal-modern-mini-text"
            }
        }).then(() => {
            showRelationsModal(currentUserKey, username);
        });
    } catch (error) {
        console.error("Error adding relation:", error);
        Swal.fire({
            icon: "error",
            title: adminRelationsText("gen_swal_error_title", "خطأ"),
            text: error.message || adminRelationsText("admin_relations_add_failed", "فشل إضافة العلاقة"),
            customClass: {
                popup: "swal-modern-mini-popup",
                title: "swal-modern-mini-title",
                htmlContainer: "swal-modern-mini-text",
                confirmButton: "swal-modern-mini-confirm"
            }
        });
    }
};

window.handleToggleRelation = async (sellerKey, deliveryKey, newStatus, modalOwnerKey, username) => {
    try {
        await saveAdminRelation(sellerKey, deliveryKey, newStatus);

        Swal.fire({
            icon: "success",
            title: adminRelationsText("admin_relations_updated", "تم التحديث"),
            timer: 1000,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
            customClass: {
                popup: "swal-modern-mini-popup",
                title: "swal-modern-mini-title"
            }
        });

        showRelationsModal(modalOwnerKey, username);
    } catch (error) {
        console.error("Error updating relation:", error);
        Swal.fire({
            icon: "error",
            title: adminRelationsText("gen_swal_error_title", "خطأ"),
            text: error.message || adminRelationsText("admin_relations_update_failed", "فشل تحديث العلاقة"),
            customClass: {
                popup: "swal-modern-mini-popup",
                title: "swal-modern-mini-title",
                htmlContainer: "swal-modern-mini-text",
                confirmButton: "swal-modern-mini-confirm"
            }
        });
    }
};
