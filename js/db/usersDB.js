/**
 * @file js/db/usersDB.js
 * @description Manages IndexedDB operations for caching user data.
 * Wrapped in IIFE to prevent global namespace pollution and redeclaration errors.
 */

(function() {
    // Prevent re-initialization if already loaded
    if (window.usersDB) {
        return;
    }

    const DB_NAME = 'UserCacheDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'users';

    /**
     * @description Opens a connection to the IndexedDB database.
     * @returns {Promise<IDBDatabase>} The database instance.
     */
    function openDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    // Create object store with 'user_key' as the key path (unique identifier)
                    // We also need an index on 'id' to find the max ID efficiently.
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'user_key' });
                    store.createIndex('id', 'id', { unique: true });
                }
            };

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                console.error('[IndexedDB] Error opening database:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * @description Saves an array of user objects to the database.
     * Uses 'put' to update existing records or insert new ones.
     * @param {Array<object>} users - The list of users to save.
     * @returns {Promise<void>}
     */
    async function saveUsers(users) {
        if (!users || users.length === 0) return;

        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            users.forEach(user => {
                store.put(user);
            });

            transaction.oncomplete = () => {
                console.log(`[IndexedDB] Saved ${users.length} users successfully.`);
                resolve();
            };

            transaction.onerror = (event) => {
                console.error('[IndexedDB] Error saving users:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * @description Retrieves all users stored in the database.
     * @returns {Promise<Array<object>>} List of all cached users.
     */
    async function getAllUsers() {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('[IndexedDB] Error fetching users:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * @description Gets the maximum 'id' currently stored in the database.
     * Used to determine the 'last_id' for incremental fetching.
     * @returns {Promise<number>} The highest ID, or 0 if database is empty.
     */
    async function getMaxId() {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('id');

        return new Promise((resolve, reject) => {
            // Open a cursor at the end of the index (highest value)
            const request = index.openCursor(null, 'prev');

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    resolve(cursor.value.id);
                } else {
                    resolve(0); // Store is empty
                }
            };

            request.onerror = (event) => {
                console.error('[IndexedDB] Error getting max ID:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /**
     * @description Clears all data from the users store.
     * Useful for logout or hard refresh scenarios.
     * @returns {Promise<void>}
     */
    async function clearDatabase() {
        const db = await openDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        return new Promise((resolve, reject) => {
            const request = store.clear();

            request.onsuccess = () => {
                console.log('[IndexedDB] Database cleared.');
                resolve();
            };

            request.onerror = (event) => {
                console.error('[IndexedDB] Error clearing database:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // Export functions globally
    window.usersDB = {
        saveUsers,
        getAllUsers,
        getMaxId,
        clearDatabase
    };

})();
