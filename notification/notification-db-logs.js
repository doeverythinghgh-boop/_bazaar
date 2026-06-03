/**
 * @file notification/notification-db-logs.js
 * @description Notification log create/read/clear helpers.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * Adds a notification record to the logs.
 * @param {Object} notificationData
 */
export async function addNotificationLog(notificationData) {
    if (typeof window.initDB !== 'function') {
        console.error("[DB] initDB not found.");
        return;
    }
    const db = await window.initDB();
    const storeName = window.NOTIFICATIONS_STORE || 'notificationsLog';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);

        if (notificationData.messageId && notificationData.type === 'received') {
            const index = store.index('messageId');
            const requestCheck = index.get(notificationData.messageId);

            requestCheck.onsuccess = () => {
                if (requestCheck.result) {
                    console.warn(`[DB] Duplicate notification prevented (messageId: ${notificationData.messageId})`);
                    if (typeof window !== 'undefined' && window.GLOBAL_NOTIFICATIONS) {
                        window.GLOBAL_NOTIFICATIONS.updateCounter();
                    }
                    resolve(requestCheck.result.id);
                } else {
                    addRecord(store, notificationData, resolve, reject);
                }
            };
            requestCheck.onerror = (event) => {
                console.error('[DB] Error checking messageId:', event.target.error);
                addRecord(store, notificationData, resolve, reject);
            };
        } else {
            addRecord(store, notificationData, resolve, reject);
        }
    });
}

/**
 * Internal helper to add a record.
 */
function addRecord(store, notificationData, resolve, reject) {
    try {
        const record = { ...notificationData };
        if (record.messageId && record.type === 'received') {
            record.messageIdUnique = record.messageId;
        }

        const request = store.add(record);

        request.onsuccess = () => {
            console.log('[DB] Added notification log successfully:', record.type);
            if (typeof window !== 'undefined') {
                const newLogEvent = new CustomEvent('notificationLogAdded', {
                    detail: { ...record, id: request.result }
                });
                window.dispatchEvent(newLogEvent);
            }
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error('[DB] Failed to add notification log:', event.target.error);
            reject('Failed to add record.');
        };
    } catch (error) {
        console.error('[DB] Error in addRecord:', error);
        reject(error);
    }
}

/**
 * Retrieves notification logs.
 * @param {string} type 'all' or specific type
 * @param {number} limit
 */
export async function getNotificationLogs(type = 'all', limit = 50) {
    if (typeof window.initDB !== 'function') return [];
    const db = await window.initDB();
    const storeName = window.NOTIFICATIONS_STORE || 'notificationsLog';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index('timestamp');
        const results = [];
        const cursorRequest = index.openCursor(null, 'prev');
        let count = 0;

        cursorRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor && count < limit) {
                const record = cursor.value;
                if (type === 'all' || record.type === type) {
                    results.push(record);
                    count++;
                }
                cursor.continue();
            } else {
                resolve(results);
            }
        };

        cursorRequest.onerror = (event) => {
            console.error('[DB] Failed to fetch notification logs:', event.target.error);
            reject('Failed to fetch records.');
        };
    });
}

/**
 * Counts unread notifications.
 */
export async function countUnreadNotifications() {
    if (typeof window.initDB !== 'function') return 0;
    const db = await window.initDB();
    const storeName = window.NOTIFICATIONS_STORE || 'notificationsLog';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index('status');
        const request = index.count(IDBKeyRange.only('unread'));

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = (event) => {
            console.error('[DB] Failed to count unread notifications:', event.target.error);
            reject(0);
        };
    });
}

/**
 * Clears all notification logs.
 */
export async function clearNotificationLogs() {
    if (typeof window.initDB !== 'function') return;
    const db = await window.initDB();
    const storeName = window.NOTIFICATIONS_STORE || 'notificationsLog';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => {
            console.log('[DB] Notification logs cleared successfully.');
            resolve();
        };

        request.onerror = (event) => {
            console.error('[DB] Failed to clear notification logs:', event.target.error);
            reject('Failed to clear records.');
        };
    });
}

// Hybrid bridge
window.addNotificationLog = addNotificationLog;
window.getNotificationLogs = getNotificationLogs;
window.countUnreadNotifications = countUnreadNotifications;
window.clearNotificationLogs = clearNotificationLogs;

console.log("[ESM Load] notification-db-logs.js: Hybrid bridge established.");
