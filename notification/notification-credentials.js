/**
 * @file notification/notification-credentials.js
 * @description Local credentials for FCM P2P notifications.
 * This file is git-ignored for safety.
 */

/**
 * @constant {Object} FCM_ADMIN_SDK_KEY
 * @description Structure for Firebase Admin SDK credentials.
 * @property {string} client_email - The service account email.
 * @property {string} private_key - The private key for signing JWTs.
 */
var FCM_ADMIN_SDK_KEY = {
    client_email: "PASTE_YOUR_SERVICE_ACCOUNT_EMAIL_HERE",
    private_key: "PASTE_YOUR_PRIVATE_KEY_HERE"
};
