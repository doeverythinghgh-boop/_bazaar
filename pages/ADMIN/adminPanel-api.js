/**
 * @file pages/ADMIN/adminPanel-api.js
 * @description API functions for the admin panel, including user data fetching and status updates.
 */

/**
 * @description Asynchronously fetches all basic user data from the server API.
 * Uses IndexedDB to cache users and fetches only new data (Incremental Fetch).
 * @returns {Promise<Array<object>>} Array of processed user objects.
 * @async
 * @throws {Error} - If there is a network error or the API response indicates failure.
 */
async function getAllUsers_() {
    console.log('[getAllUsers_] بدء عملية جلب المستخدمين (Incremental Fetching)...');

    try {
        var lastId = 0;
        try {
            if (window.usersDB) {
                lastId = await window.usersDB.getMaxId();
                console.log(`[getAllUsers_] آخر ID مخزن محلياً: ${lastId}`);
            } else {
                console.warn('[getAllUsers_] usersDB helper not loaded!');
            }
        } catch (dbError) {
            console.error('[getAllUsers_] خطأ في قراءة قاعدة البيانات المحلية:', dbError);
        }

        console.log(`[getAllUsers_] طلب البيانات الجديدة من الخادم (users > ${lastId})...`);
        const response = await fetch(`${baseURL}/api/users?last_id=${lastId}`);

        if (!response.ok) {
            console.error(`[getAllUsers_] فشل استلام البيانات من الخادم، رمز الخطأ: ${response.status}`);
            throw new Error(`Server response failed: ${response.status}`);
        }

        const newUsers = await response.json();
        console.log(`[getAllUsers_] تم استلام ${newUsers.length} مستخدم جديد.`);

        if (newUsers.length > 0 && window.usersDB) {
            const processedNewUsers = await processUsersDeliveryStatus(newUsers);
            await window.usersDB.saveUsers(processedNewUsers);
        }

        let allUsers = [];
        if (window.usersDB) {
            allUsers = await window.usersDB.getAllUsers();
            console.log(`[getAllUsers_] تم تحميل إجمالي ${allUsers.length} مستخدم من قاعدة البيانات المحلية.`);
        } else {
            allUsers = await processUsersDeliveryStatus(newUsers); 
        }

        return allUsers;

    } catch (error) {
        console.error('[getAllUsers_] حدث خطأ أثناء جلب البيانات:', error);
        if (window.usersDB) {
            console.log('[getAllUsers_] محاولة عرض البيانات المخزنة محلياً بعد الفشل...');
            return await window.usersDB.getAllUsers();
        }
        throw error;
    }
}

/**
 * @description Helper function to process raw users and append delivery/seller status.
 * @param {Array<object>} rawUsersData - Raw users data from API.
 * @returns {Promise<Array<object>>} Processed users with roles.
 */
async function processUsersDeliveryStatus(rawUsersData) {
    if(!rawUsersData || rawUsersData.length === 0) return [];

    console.log('[processUsersDeliveryStatus] بدء معالجة حالات التوصيل لـ', rawUsersData.length, 'مستخدم...');

    const userKeys = rawUsersData.map(user => user.user_key);
    const deliveryStatusMap = {};

    try {
        const statusResponse = await fetch(`${baseURL}/api/suppliers-deliveries`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userKeys })
        });

        if (statusResponse.ok) {
            const statusData = await statusResponse.json();
            const results = statusData.results || [];

            results.forEach(item => {
                deliveryStatusMap[item.key] = {
                    isSeller: item.isSeller,
                    isDelivery: item.isDelivery
                };
            });
        }
    } catch (statusError) {
        console.error('[processUsersDeliveryStatus] Error fetching delivery status:', statusError);
    }

    return rawUsersData.map(user => {
        const status = deliveryStatusMap[user.user_key] || { isSeller: false, isDelivery: false };

        return {
            id: user.id || 0,
            user_key: user.user_key,
            username: user.username,
            phone: user.phone,
            Address: user.Address,
            Password: user.Password,
            hasFCMToken: !!user.fcm_token,
            tokenPlatform: user.platform ? user.platform : "None",
            isSeller: status.isSeller,
            isDelivery: status.isDelivery,
            limitPackage: user.limitPackage || 0,
            isDelivered: user.isDelivered || 0
        };
    });
}

/**
 * @description Fetches the latest data for a single user and updates their card/cache.
 * @param {string} userKey - The unique user key.
 * @returns {Promise<void>}
 */
async function refreshSingleUser(userKey) {
    const card = document.getElementById(`user-card-${userKey}`);
    if (!card) return;

    card.classList.add('loading-card');
    console.log(`[refreshSingleUser] Updating user: ${userKey}`);

    try {
        const response = await fetch(`${baseURL}/api/users?user_key=${userKey}`);
        if (!response.ok) throw new Error('Failed to fetch user update');
        
        const userData = await response.json();
        const [processedUser] = await processUsersDeliveryStatus([userData]);

        const index = allUsers_cache.findIndex(u => u.user_key === userKey);
        if (index !== -1) {
            allUsers_cache[index] = processedUser;
        }

        if (window.usersDB) {
            await window.usersDB.saveUsers([processedUser]);
        }

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = generateCardHTML(processedUser);
        card.innerHTML = tempDiv.innerHTML;

        card.classList.remove('loading-card');
        card.classList.add('flash-success');
        setTimeout(() => card.classList.remove('flash-success'), 1500);

    } catch (error) {
        console.error('[refreshSingleUser] Error:', error);
        card.classList.remove('loading-card');
    }
}

/**
 * @function updateUserField
 * @description Updates a specific field for a user via the API (e.g., limitPackage or isDelivered).
 * @param {string} userKey - The user key to identify the user.
 * @param {string} fieldName - The name of the field to update.
 * @param {any} [value] - The value to update (optional).
 * @returns {Promise<void>}
 */
window.updateUserField = async (userKey, fieldName, value) => {
    try {
        var finalValue = value;

        if (fieldName === 'limitPackage' && value === undefined) {
            var input = document.getElementById(`limit-input-${userKey}`);
            if (input) {
                finalValue = parseFloat(input.value);
            }
        } else if (fieldName === 'isDelivered') {
            finalValue = parseInt(value, 10);
        }

        if (finalValue === undefined || isNaN(finalValue)) {
            Swal.fire('تنبيه', 'يرجى إدخال قيمة صحيحة', 'warning');
            return;
        }

        Swal.showLoading();

        var body = {
            user_key: userKey
        };
        body[fieldName] = finalValue;

        console.log('[updateUserField] Sending update request:', body);

        var response = await fetch(`${baseURL}/api/users`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        var result = await response.json();

        if (response.ok) {
            const cachedUser = allUsers_cache.find(u => u.user_key === userKey);
            if (cachedUser) {
                cachedUser[fieldName] = finalValue;
                console.log(`[updateUserField] Updated cache for ${userKey}: ${fieldName} = ${finalValue}`);
            }

            const Toast = Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 2000,
                timerProgressBar: true
            });
            Toast.fire({ icon: 'success', title: 'تم التحديث بنجاح' });
        } else {
            throw new Error(result.error || 'فشل تحديث البيانات');
        }

    } catch (error) {
        console.error('[updateUserField] Error:', error);
        Swal.fire('خطأ', error.message || 'حدث خطأ أثناء التحديث', 'error');
    }
};
