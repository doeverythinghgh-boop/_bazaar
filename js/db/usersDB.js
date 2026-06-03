/**
 * @file js/db/usersDB.js
 * @description Unified LocalDB bridge for cached user data.
 * @module usersDB
 */

console.log("[ESM Load] js/db/usersDB.js: Initializing LocalDB bridge...");

const STORE_NAME = "users";

export async function openDB() {
    await window.LocalDB.ready();
    return window.LocalDB;
}

export async function saveUsers(users) {
    if (!Array.isArray(users) || users.length === 0) return;
    await window.LocalDB.ready();
    await Promise.all(users.filter(Boolean).map((user) => {
        const key = user.user_key || user.id;
        if (!key) return Promise.resolve();
        return window.LocalDB.put(STORE_NAME, {
            ...user,
            user_key: user.user_key || String(key),
            updatedAt: new Date().toISOString()
        });
    }));
    console.log(`[LocalDB] Saved ${users.length} users successfully.`);
}

export async function getAllUsers() {
    await window.LocalDB.ready();
    return window.LocalDB.getAll(STORE_NAME);
}

export async function getMaxId() {
    const users = await getAllUsers();
    return users.reduce((max, user) => Math.max(max, Number(user.id) || 0), 0);
}

export async function clearDatabase() {
    await window.LocalDB.clearStore(STORE_NAME);
    console.log("[LocalDB] Users store cleared.");
}

window.usersDB = {
    saveUsers,
    getAllUsers,
    getMaxId,
    clearDatabase
};

console.log("[ESM Load] js/db/usersDB.js: LocalDB bridge established.");
