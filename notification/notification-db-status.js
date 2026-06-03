/**
 * @file notification/notification-db-status.js
 * @description Notification status and delete helpers.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

/**
 * Updates a specific notification's status in LocalDB.
 * @param {number} id
 * @param {string} status
 */
export async function updateNotificationStatusInDB(id, status) {
    if (typeof window.initDB !== 'function') return;
    const db = await window.initDB();
    const storeName = window.NOTIFICATIONS_STORE || 'notificationsLog';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);

        request.onsuccess = (event) => {
            const data = event.target.result;
            if (data) {
                data.status = status;
                const updateRequest = store.put(data);

                updateRequest.onsuccess = () => {
                    console.log(`[DB] Updated notification ${id} status to ${status} successfully.`);
                    if (typeof window !== 'undefined') {
                        window.dispatchEvent(new CustomEvent('notificationStatusUpdated', {
                            detail: { id, status }
                        }));
                    }
                    resolve();
                };

                updateRequest.onerror = (e) => {
                    console.error('[DB] Failed to update notification status:', e.target.error);
                    reject(e.target.error);
                };
            } else {
                console.warn(`[DB] Notification ${id} not found.`);
                resolve();
            }
        };

        request.onerror = (event) => {
            console.error('[DB] Failed to get notification for update:', event.target.error);
            reject(event.target.error);
        };
    });
}

/**
 * Marks all notifications as read in LocalDB.
 */
export async function markAllNotificationsAsReadInDB() {
    if (typeof window.initDB !== 'function') return;
    const db = await window.initDB();
    const storeName = window.NOTIFICATIONS_STORE || 'notificationsLog';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const index = store.index('status');
        const request = index.openCursor(IDBKeyRange.only('unread'));

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const updateData = cursor.value;
                updateData.status = 'read';
                cursor.update(updateData);
                cursor.continue();
            } else {
                console.log('[DB] All notifications marked as read successfully.');
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('notificationStatusUpdated', {
                        detail: { id: 'all', status: 'read' }
                    }));
                }
                resolve();
            }
        };

        request.onerror = (e) => {
            console.error('[DB] Failed to mark all notifications as read:', e.target.error);
            reject(e.target.error);
        };
    });
}

/**
 * Deletes a specific notification from LocalDB.
 * @param {number} id
 */
export async function deleteNotificationFromDB(id) {
    if (typeof window.initDB !== 'function') return;
    const db = await window.initDB();
    const storeName = window.NOTIFICATIONS_STORE || 'notificationsLog';

    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
            console.log(`[DB] Deleted notification ${id} successfully.`);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('notificationDeleted', {
                    detail: { id }
                }));
            }
            resolve();
        };

        request.onerror = (event) => {
            console.error('[DB] Failed to delete notification:', event.target.error);
            reject('Failed to delete notification.');
        };
    });
}

// Hybrid bridge
window.updateNotificationStatusInDB = updateNotificationStatusInDB;
window.markAllNotificationsAsReadInDB = markAllNotificationsAsReadInDB;
window.deleteNotificationFromDB = deleteNotificationFromDB;

console.log("[ESM Load] notification-db-status.js: Hybrid bridge established.");
