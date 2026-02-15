/**
 * @file pages/ADMIN/adminPanel-actions.js
 * @description Logic for complex admin actions such as impersonation and sending notifications.
 */

/**
 * @function loginAsUser
 * @description Automatically logs in as the target user (Impersonation).
 * @param {string} targetUserKey - The key of the user to impersonate.
 * @returns {Promise<void>}
 */
window.loginAsUser = async (targetUserKey) => {
    try {
        var result = await Swal.fire({
            title: 'تأكيد الدخول',
            text: 'هل أنت متأكد من رغبتك في الدخول بحساب هذا المستخدم؟ سيتم تسجيل خروجك الحالي.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'نعم، دخول',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: 'var(--primary-color)',
            cancelButtonColor: 'var(--danger-color)'
        });

        if (!result.isConfirmed) return;

        Swal.fire({
            title: 'جاري تبديل المستخدم...',
            text: 'سيتم تسجيل الخروج وتنظيف البيانات الحالية...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(`${baseURL}/api/users`);
        const allUsers = await response.json();
        const targetUser = allUsers.find(u => u.user_key === targetUserKey);

        if (!targetUser) throw new Error('المستخدم غير موجود');

        await SessionManager.impersonate(targetUser);

    } catch (error) {
        console.error(error);
        Swal.fire("خطأ", error.message || "حدث خطأ أثناء التبديل.", "error");
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
    const messageBody = inputElement ? inputElement.value.trim() : '';

    if (!messageBody) {
        Swal.fire({
            toast: true,
            icon: 'warning',
            title: 'الرجاء كتابة نص الرسالة',
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
        return;
    }

    try {
        Swal.showLoading();

        const tokens = await getUsersTokens([userKey]);

        if (!tokens || tokens.length === 0) {
            Swal.fire('خطأ', 'هذا المستخدم ليس لديه توكن إشعارات (FCM Token) مسجل.', 'error');
            return;
        }

        const notificationTitle = (window.notificationMessages && window.notificationMessages.admin_manual)
            ? window.notificationMessages.admin_manual.title
            : "إشعار من الإدارة";

        await sendNotificationsToTokens(tokens, notificationTitle, messageBody);

        Swal.fire({
            toast: true,
            icon: 'success',
            title: 'تم الإرسال بنجاح',
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });

        if (inputElement) inputElement.value = '';

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
    var inputElement = document.getElementById('broadcast-message-input');
    var messageBody = inputElement ? inputElement.value.trim() : '';

    if (!messageBody) {
        Swal.fire({
            toast: true,
            icon: 'warning',
            title: 'الرجاء كتابة نص الرسالة',
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000
        });
        return;
    }

    var result = await Swal.fire({
        title: 'تأكيد الإرسال الجماعي',
        text: 'هل أنت متأكد من إرسال هذه الرسالة لجميع المستخدمين؟ قد تستغرق هذه العملية بعض الوقت حسب عدد المستخدمين.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'نعم، أرسل للجميع',
        cancelButtonText: 'إلغاء',
        confirmButtonColor: 'var(--primary-color)',
        cancelButtonColor: 'var(--danger-color)'
    });

    if (!result.isConfirmed) return;

    try {
        Swal.fire({
            title: 'جاري التحضير...',
            text: 'يتم جلب بيانات المستخدمين وتجهيز الإشعارات...',
            allowOutsideClick: false,
            didOpen: function () {
                Swal.showLoading();
            }
        });

        var users = await getAllUsers_();
        var userKeysWithTokens = users.filter(function (u) { return u.hasFCMToken; }).map(function (u) { return u.user_key; });

        if (userKeysWithTokens.length === 0) {
            Swal.fire('تنبيه', 'لا يوجد مستخدمون لديهم توكن إشعارات (FCM Token) مسجل حالياً في النظام.', 'info');
            return;
        }

        var tokens = await getUsersTokens(userKeysWithTokens);

        if (!tokens || tokens.length === 0) {
            Swal.fire('خطأ', 'فشل جلب توكنات المستخدمين من السيرفر.', 'error');
            return;
        }

        var notificationTitle = (window.notificationMessages && window.notificationMessages.admin_manual)
            ? window.notificationMessages.admin_manual.title
            : "إشعار عام من الإدارة";

        await sendNotificationsToTokens(tokens, notificationTitle, messageBody);

        Swal.fire({
            icon: 'success',
            title: 'تم الإرسال بنجاح',
            text: 'تم إرسال الرسالة بنجاح إلى ' + tokens.length + ' جهاز.',
            confirmButtonText: 'موافق'
        });

        if (inputElement) inputElement.value = '';

    } catch (error) {
        console.error('[sendBroadcastNotification] Error:', error);
        Swal.fire('خطأ', 'حدث خطأ غير متوقع أثناء إرسال الرسائل الجماعية. يرجى المحاولة مرة أخرى.', 'error');
    }
};
