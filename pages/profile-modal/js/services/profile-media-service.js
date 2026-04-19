/**
 * @file pages/profile-modal/js/services/profile-media-service.js
 * @description Handles avatar and cover image uploads for the Profile Wizard.
 */

window.ProfileMediaService = (function () {
    'use strict';

    /**
     * Uploads the avatar and covers if they are in a pending blob state.
     * @param {string} userKey 
     * @returns {Promise<{ avatar: string|null, covers: string[] }>}
     */
    async function uploadPendingMedia(userKey) {
        let avatarFile = null;
        
        // 1. Handle Avatar
        if (window.registerPendingAvatar && typeof window.registerPendingAvatar !== 'string') {
            console.log("[ProfileMediaService] Uploading new avatar...");
            avatarFile = `avatar_${userKey}_${Date.now()}.webp`;
            await window.uploadFile2cf(window.registerPendingAvatar, avatarFile);
        }

        // 2. Handle Covers
        const uploadedCovers = [];
        if (Array.isArray(window.registerPendingCovers)) {
            for (let i = 0; i < window.registerPendingCovers.length; i++) {
                const blob = window.registerPendingCovers[i];
                if (blob && typeof blob !== 'string') {
                    console.log(`[ProfileMediaService] Uploading new cover [index:${i}]...`);
                    const fileName = `cover_${userKey}_${i}_${Date.now()}.webp`;
                    await window.uploadFile2cf(blob, fileName);
                    uploadedCovers.push(fileName);
                } else if (typeof blob === 'string') {
                    // Keep existing file name
                    uploadedCovers.push(blob);
                } else {
                    // Empty slot
                    uploadedCovers.push(null);
                }
            }
        }

        return {
            avatar: avatarFile,
            covers: uploadedCovers.filter(c => c !== null)
        };
    }

    return {
        uploadPendingMedia
    };
})();
