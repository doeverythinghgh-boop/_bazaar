/**
 * @file notification/notification-db-core.js
 * @description LocalDB setup bridge for notifications and orders.
 */

export const DB_NAME = window.LocalDB?.DB_NAME || "SuezBazaarLocalDatabasesProject";
export const DB_VERSION = window.LocalDB?.DB_VERSION || 6;
export const NOTIFICATIONS_STORE = "notificationsLog";

export async function initDB() {
    await window.LocalDB.ready();
    return window.LocalDB.openDB();
}

window.initDB = initDB;
window.NOTIFICATIONS_STORE = NOTIFICATIONS_STORE;

export default initDB;

console.log("[ESM Load] notification-db-core.js: LocalDB bridge established.");
