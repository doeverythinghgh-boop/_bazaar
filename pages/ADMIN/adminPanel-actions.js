/**
 * @file pages/ADMIN/adminPanel-actions.js
 * @description Logic for complex admin actions such as impersonation and sending notifications.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function unwrapAdminActionPayload(payload) {
    return adminUnwrapPayload(payload);
}

/**
 * @function loginAsUser
 * @description Automatically logs in as the target user (Impersonation).
 * @param {string} targetUserKey - The key of the user to impersonate.
 * @returns {Promise<void>}
 */
window.loginAsUser = async (targetUserKey) => {
    try {
        var result = await Swal.fire({
            title: adminActionText("admin_impersonate_confirm_title", "تأكيد الدخول"),
            text: adminActionText("admin_impersonate_confirm_text", "هل أنت متأكد من رغبتك في الدخول بحساب هذا المستخدم؟ سيتم تسجيل خروجك الحالي."),
            icon: "question",
            showCancelButton: true,
            confirmButtonText: adminActionText("admin_impersonate_confirm_btn", "نعم، دخول"),
            cancelButtonText: adminActionText("alert_cancel_btn", "إلغاء"),
            confirmButtonColor: "var(--primary-color)",
            cancelButtonColor: "var(--danger-color)"
        });

        if (!result.isConfirmed) return;

        Swal.fire({
            title: adminActionText("admin_impersonate_loading_title", "جاري تبديل المستخدم..."),
            text: adminActionText("admin_impersonate_loading_text", "سيتم تسجيل الخروج وتنظيف البيانات الحالية..."),
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const allUsers = typeof getAllUsers_ === "function"
            ? await getAllUsers_()
            : (await apiFetch(`/api/users?limit=100`)) || [];
        const targetUser = allUsers.find((u) => u.user_key === targetUserKey);

        if (!targetUser) {
            throw new Error(adminActionText("admin_user_not_found", "المستخدم غير موجود"));
        }

        await SessionManager.impersonate(targetUser);
    } catch (error) {
        console.error(error);
        Swal.fire(
            adminActionText("gen_swal_error_title", "خطأ"),
            error.message || adminActionText("admin_impersonate_error", "حدث خطأ أثناء التبديل."),
            "error"
        );
    }
};

/**
 * @function sendAdminNotification
 * @description Sends a manual notification to a single user.
 * @param {string} userKey - The target user's unique key.
 * @returns {Promise<void>}
 */
window.sendAdminNotification = async (userKey) => {
    const inputElement = document.getElementById(`notify-input-${userKey}`);
    const messageBody = inputElement ? inputElement.value.trim() : "";

    if (!messageBody) {
        Swal.fire({
            toast: true,
            icon: "warning",
            title: adminActionText("admin_notify_message_required", "الرجاء كتابة نص الرسالة"),
            position: "top-end",
            showConfirmButton: false,
            timer: 2000
        });
        return;
    }

    try {
        Swal.showLoading();

        const tokens = await getUsersTokens([userKey]);

        if (!tokens || tokens.length === 0) {
            Swal.fire(
                adminActionText("gen_swal_error_title", "خطأ"),
                adminActionText("admin_notify_no_token", "هذا المستخدم ليس لديه توكن إشعارات (FCM Token) مسجل."),
                "error"
            );
            return;
        }

        const notificationTitle = (window.notificationMessages && window.notificationMessages.admin_manual)
            ? window.notificationMessages.admin_manual.title
            : adminActionText("admin_notify_title_manual", "إشعار من الإدارة");

        await sendNotificationsToTokens(tokens, notificationTitle, messageBody);

        Swal.fire({
            toast: true,
            icon: "success",
            title: adminActionText("admin_notify_sent", "تم الإرسال بنجاح"),
            position: "top-end",
            showConfirmButton: false,
            timer: 2000
        });

        if (inputElement) inputElement.value = "";
    } catch (error) {
        console.error(error);
    }
};

/**
 * @function sendBroadcastNotification
 * @description Sends a broadcast message to all users who have registered devices.
 * @returns {Promise<void>}
 */
window.sendBroadcastNotification = async function () {
    var inputElement = document.getElementById("broadcast-message-text");
    var messageBody = inputElement ? inputElement.value.trim() : "";

    if (!messageBody) {
        Swal.fire({
            toast: true,
            icon: "warning",
            title: adminActionText("admin_notify_message_required", "الرجاء كتابة نص الرسالة"),
            position: "top-end",
            showConfirmButton: false,
            timer: 2000
        });
        return;
    }

    var result = await Swal.fire({
        title: adminActionText("admin_broadcast_confirm_title", "تأكيد الإرسال الجماعي"),
        text: adminActionText("admin_broadcast_confirm_text", "هل أنت متأكد من إرسال هذه الرسالة لجميع المستخدمين؟ قد تستغرق هذه العملية بعض الوقت حسب عدد المستخدمين."),
        icon: "question",
        showCancelButton: true,
        confirmButtonText: adminActionText("admin_broadcast_confirm_btn", "نعم، أرسل للجميع"),
        cancelButtonText: adminActionText("alert_cancel_btn", "إلغاء"),
        confirmButtonColor: "var(--primary-color)",
        cancelButtonColor: "var(--danger-color)"
    });

    if (!result.isConfirmed) return;

    try {
        Swal.fire({
            title: adminActionText("admin_broadcast_prepare_title", "جاري التحضير..."),
            text: adminActionText("admin_broadcast_prepare_text", "يتم جلب بيانات المستخدمين وتجهيز الإشعارات..."),
            allowOutsideClick: false,
            didOpen: function () {
                Swal.showLoading();
            }
        });

        var users = await getAllUsers_();
        var userKeysWithTokens = users.filter(function (u) { return u.hasFCMToken; }).map(function (u) { return u.user_key; });

        if (userKeysWithTokens.length === 0) {
            Swal.fire(
                adminActionText("gen_swal_info_title", "تنبيه"),
                adminActionText("admin_broadcast_no_users_with_tokens", "لا يوجد مستخدمون لديهم توكن إشعارات (FCM Token) مسجل حاليًا في النظام."),
                "info"
            );
            return;
        }

        var tokens = await getUsersTokens(userKeysWithTokens);

        if (!tokens || tokens.length === 0) {
            Swal.fire(
                adminActionText("gen_swal_error_title", "خطأ"),
                adminActionText("admin_broadcast_token_fetch_failed", "فشل جلب توكنات المستخدمين من السيرفر."),
                "error"
            );
            return;
        }

        var notificationTitle = (window.notificationMessages && window.notificationMessages.admin_manual)
            ? window.notificationMessages.admin_manual.title
            : adminActionText("admin_broadcast_title_manual", "إشعار عام من الإدارة");

        await sendNotificationsToTokens(tokens, notificationTitle, messageBody);

        Swal.fire({
            icon: "success",
            title: adminActionText("admin_notify_sent", "تم الإرسال بنجاح"),
            text: adminActionText("admin_broadcast_sent_text", "تم إرسال الرسالة بنجاح إلى {count} جهاز.").replace("{count}", tokens.length),
            confirmButtonText: adminActionText("alert_confirm_btn", "موافق")
        });

        if (inputElement) inputElement.value = "";
    } catch (error) {
        console.error("[sendBroadcastNotification] Error:", error);
        Swal.fire(
            adminActionText("gen_swal_error_title", "خطأ"),
            adminActionText("admin_broadcast_error", "حدث خطأ غير متوقع أثناء إرسال الرسائل الجماعية. يرجى المحاولة مرة أخرى."),
            "error"
        );
    }
};
