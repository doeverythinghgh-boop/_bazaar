/**
 * @file pages/ADMIN/adminPanel-api.js
 * @description API functions for the admin panel, including user data fetching and status updates.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function unwrapAdminApiPayload(payload) {
    return adminUnwrapPayload(payload);
}

function buildAdminPhoneHealth(user) {
    const phones = Array.isArray(user.phones) ? user.phones : [];
    const normalizedPhone = String(user.phone || "").trim();
    const primaryPhones = phones.filter((item) => item && item.is_primary);
    const issues = [];

    if (!phones.length) {
        issues.push("missing_phones");
    }
    if (primaryPhones.length === 0 && phones.length) {
        issues.push("missing_primary");
    }
    if (primaryPhones.length > 1) {
        issues.push("multiple_primary");
    }
    if (primaryPhones[0] && normalizedPhone && primaryPhones[0].number !== normalizedPhone) {
        issues.push("primary_mismatch");
    }
    if (primaryPhones[0] && !primaryPhones[0].has_whatsapp) {
        issues.push("primary_without_whatsapp");
    }

    return {
        isHealthy: issues.length === 0,
        issues,
        primaryPhone: primaryPhones[0]?.number || normalizedPhone || "",
        phonesCount: phones.length
    };
}

async function fetchAdminPhoneIntegrityReport() {
    const data = await apiFetch(`/api/database-analysis?mode=phones_integrity&limit=1000`);
    if (data && data.error) {
        throw new Error(`Integrity report request failed: ${data.error}`);
    }
    return data;
}

async function ensureAdminApiFirestoreDb() {
    if (typeof window.ensureFirestoreDb !== "function") {
        throw new Error("ensureFirestoreDb function is not loaded/available");
    }
    return window.ensureFirestoreDb();
}

function chunkAdminUserKeys(userKeys, size = 10) {
    const unique = [...new Set((userKeys || []).filter(Boolean))];
    const chunks = [];
    for (let i = 0; i < unique.length; i += size) {
        chunks.push(unique.slice(i, i + size));
    }
    return chunks;
}

async function fetchAdminDeliveryStatusMap(userKeys) {
    const deliveryStatusMap = {};
    const keys = [...new Set((userKeys || []).filter(Boolean))];
    keys.forEach((key) => {
        deliveryStatusMap[key] = {
            isSeller: false,
            isCommercial: false,
            isDelivery: false
        };
    });
    if (!keys.length) return deliveryStatusMap;

    const db = await ensureAdminApiFirestoreDb();
    const relationCollection = db.collection("supplier_deliveries");
    const chunks = chunkAdminUserKeys(keys);

    await Promise.all(chunks.map(async (chunk) => {
        const [sellerSnap, deliverySnap] = await Promise.all([
            relationCollection.where("seller_key", "in", chunk).get(),
            relationCollection.where("delivery_key", "in", chunk).get()
        ]);

        sellerSnap.docs.forEach((doc) => {
            const relation = doc.data() || {};
            const sellerKey = relation.seller_key || relation.sellerKey;
            if (!sellerKey || !deliveryStatusMap[sellerKey]) return;
            deliveryStatusMap[sellerKey].isSeller = true;
            deliveryStatusMap[sellerKey].isCommercial = true;
        });

        deliverySnap.docs.forEach((doc) => {
            const relation = doc.data() || {};
            const deliveryKey = relation.delivery_key || relation.deliveryKey;
            if (!deliveryKey || !deliveryStatusMap[deliveryKey]) return;
            deliveryStatusMap[deliveryKey].isDelivery = true;
        });
    }));

    return deliveryStatusMap;
}

function renderAdminPhoneIntegritySummary(report) {
    const container = document.getElementById("admin-phone-integrity-summary");
    if (!container || !report?.summary) return;

    const summary = report.summary;
    const issueCount = parseInt(summary.problematic_users, 10) || 0;
    const issueUsers = Array.isArray(report.users) ? report.users : [];
    const issuePreview = issueUsers.slice(0, 5).map((item) => {
        const issuesText = Array.isArray(item.issues) ? item.issues.join(", ") : "";
        return `
            <span class="admin-integrity-user-pill" title="${issuesText}">
                ${item.username || item.user_key}
            </span>
        `;
    }).join("");

    container.innerHTML = `
        <div class="admin-integrity-summary-head">
            <div>
                <div class="admin-integrity-title">${adminApiText("admin_phone_integrity_title", "Phone Integrity")}</div>
                <div class="admin-integrity-subtitle">${adminApiText("admin_phone_integrity_subtitle", "Live database audit for primary-phone alignment and phones availability.")}</div>
            </div>
            <span class="admin-integrity-badge ${issueCount ? "has-issues" : "is-clean"}">
                ${issueCount
                    ? adminApiText("admin_phone_integrity_badge_issues", "{count} accounts need review").replace("{count}", issueCount)
                    : adminApiText("admin_phone_integrity_badge_clean", "All accounts are healthy")}
            </span>
        </div>
        <div class="admin-integrity-stats">
            <span>${adminApiText("admin_phone_integrity_stat_scanned", "Scanned")}: ${summary.scanned_users || 0}</span>
            <span>${adminApiText("admin_phone_integrity_stat_healthy", "Healthy")}: ${summary.healthy_users || 0}</span>
            <span>${adminApiText("admin_phone_integrity_stat_issues", "Issues")}: ${summary.problematic_users || 0}</span>
        </div>
        ${issuePreview ? `<div class="admin-integrity-user-list">${issuePreview}</div>` : ""}
    `;
    container.style.display = "block";
}

async function getAllUsers_() {
    console.log("[getAllUsers_] Starting incremental users fetch...");

    try {
        var lastId = 0;
        try {
            if (window.usersDB) {
                lastId = await window.usersDB.getMaxId();
                console.log(`[getAllUsers_] Last cached local ID: ${lastId}`);
            } else {
                console.warn("[getAllUsers_] usersDB helper not loaded!");
            }
        } catch (dbError) {
            console.error("[getAllUsers_] Failed to read local users DB:", dbError);
        }

        console.log(`[getAllUsers_] Requesting new data from server (users > ${lastId})...`);
        const newUsers = await apiFetch(`/api/users?last_id=${lastId}`);

        if (!newUsers || newUsers.error) {
            console.error(`[getAllUsers_] Server response failed: ${newUsers?.error || 'Unknown error'}`);
            throw new Error(newUsers?.error || 'Server response failed');
        }

        const usersArray = Array.isArray(newUsers) ? newUsers : [];
        console.log(`[getAllUsers_] Received ${usersArray.length} new users.`);

        if (usersArray.length > 0 && window.usersDB) {
            const processedNewUsers = await processUsersDeliveryStatus(usersArray);
            await window.usersDB.saveUsers(processedNewUsers);
        }

        let allUsers = [];
        if (window.usersDB) {
            allUsers = await window.usersDB.getAllUsers();
            console.log(`[getAllUsers_] Loaded total ${allUsers.length} users from local database.`);
        } else {
            allUsers = await processUsersDeliveryStatus(usersArray);
        }

        return allUsers;
    } catch (error) {
        console.error("[getAllUsers_] Failed while fetching data:", error);
        if (window.usersDB) {
            console.log("[getAllUsers_] Falling back to cached local data...");
            return await window.usersDB.getAllUsers();
        }
        throw error;
    }
}

async function processUsersDeliveryStatus(rawUsersData) {
    if (!rawUsersData || rawUsersData.length === 0) return [];

    console.log("[processUsersDeliveryStatus] Processing delivery/commercial status for users:", rawUsersData.length);

    const userKeys = rawUsersData.map((user) => user.user_key);
    const deliveryStatusMap = {};

    try {
        Object.assign(deliveryStatusMap, await fetchAdminDeliveryStatusMap(userKeys));
    } catch (statusError) {
        console.error("[processUsersDeliveryStatus] Error fetching delivery status:", statusError);
    }

    return rawUsersData.map((user) => {
        const status = deliveryStatusMap[user.user_key] || { isSeller: false, isCommercial: false, isDelivery: false };
        const capabilities = typeof window.resolveUserCapabilities === "function"
            ? window.resolveUserCapabilities(user)
            : null;
        const accountType = capabilities?.accountType ?? (parseInt(user.account_type, 10) || 0);

        return {
            id: user.id || 0,
            user_key: user.user_key,
            username: user.username,
            phone: user.phone,
            primary_phone: user.primary_phone || user.phone || "",
            whatsapp_phone: user.whatsapp_phone || user.business_whatsapp || user.phone || "",
            phones: Array.isArray(user.phones) ? user.phones : [],
            Address: user.Address,
            Password: user.Password,
            hasFCMToken: !!user.fcm_token,
            tokenPlatform: user.platform ? user.platform : "None",
            isSeller: !!capabilities?.isCommercial || status.isSeller || status.isCommercial,
            isCommercial: !!capabilities?.isCommercial || status.isSeller || status.isCommercial,
            isDelivery: !!capabilities?.canDeliver || status.isDelivery,
            isServiceProvider: !!capabilities?.isServiceProvider,
            isAdmin: !!capabilities?.isAdmin,
            isSuperAdmin: !!capabilities?.isSuperAdmin,
            system_role: capabilities?.systemRole || user.system_role || "user",
            account_type: accountType,
            limitPackage: user.limitPackage || 0,
            isDelivered: user.isDelivered || 0,
            business_category: user.business_category || "",
            created_at: user.created_at || null,
            updated_at: user.updated_at || null,
            last_login_at: user.last_login_at || null,
            phoneHealth: buildAdminPhoneHealth(user)
        };
    });
}

async function refreshSingleUser(userKey) {
    const card = document.getElementById(`user-card-${userKey}`);
    if (!card) return;

    card.classList.add("loading-card");
    console.log(`[refreshSingleUser] Updating user: ${userKey}`);

    try {
        const userData = await apiFetch(`/api/users?user_key=${userKey}`);
        if (!userData || userData.error) throw new Error(userData?.error || "Failed to fetch user update");

        const [processedUser] = await processUsersDeliveryStatus([userData]);

        const index = allUsers_cache.findIndex((u) => u.user_key === userKey);
        if (index !== -1) {
            allUsers_cache[index] = processedUser;
        }

        if (window.usersDB) {
            await window.usersDB.saveUsers([processedUser]);
        }

        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = generateCardHTML(processedUser);
        card.innerHTML = tempDiv.innerHTML;
        if (typeof bindUserCardInteractions === "function") {
            bindUserCardInteractions(card, processedUser);
        }

        card.classList.remove("loading-card");
        card.classList.add("flash-success");
        setTimeout(() => card.classList.remove("flash-success"), 1500);
    } catch (error) {
        console.error("[refreshSingleUser] Error:", error);
        card.classList.remove("loading-card");
    }
}

window.updateUserField = async (userKey, fieldName, value) => {
    try {
        var finalValue = value;

        if (fieldName === "limitPackage" && value === undefined) {
            var input = document.getElementById(`limit-input-${userKey}`);
            if (input) {
                finalValue = parseFloat(input.value);
            }
        } else if (fieldName === "isDelivered" || fieldName === "account_type") {
            finalValue = parseInt(value, 10);
        }

        if (finalValue === undefined || isNaN(finalValue)) {
            Swal.fire(adminApiText("gen_swal_info_title", "تنبيه"), adminApiText("admin_api_enter_valid_value", "يرجى إدخال قيمة صحيحة"), "warning");
            return;
        }

        Swal.showLoading();

        var body = {
            user_key: userKey
        };
        body[fieldName] = finalValue;

        console.log("[updateUserField] Sending update request:", body);

        var result = await apiFetch(`/api/users`, {
            method: "PUT",
            body
        });

        if (!result || result.error) {
            throw new Error(result?.error || adminApiText("admin_api_update_failed", "فشل تحديث البيانات"));
        }

        if (true) {
            const cachedUser = allUsers_cache.find((u) => u.user_key === userKey);
            if (cachedUser) {
                cachedUser[fieldName] = finalValue;
                console.log(`[updateUserField] Updated cache for ${userKey}: ${fieldName} = ${finalValue}`);
            }

            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
            Toast.fire({ icon: "success", title: adminApiText("admin_api_update_success", "تم التحديث بنجاح") });
        }
    } catch (error) {
        console.error("[updateUserField] Error:", error);
        Swal.fire(adminApiText("gen_swal_error_title", "خطأ"), error.message || adminApiText("admin_api_update_error", "حدث خطأ أثناء التحديث"), "error");
    }
};
