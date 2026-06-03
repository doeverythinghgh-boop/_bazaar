/**
 * @file pages/profile-modal/js/services/profile-media-service.js
 * @description Handles avatar and cover image uploads for the Profile Wizard.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.ProfileMediaService = (function () {
    'use strict';

    /**
     * Uploads the avatar and covers if they are in a pending blob state.
     * @param {string} userKey
     * @returns {Promise<{ avatar: string|null, covers: string[] }>}
     */
    async function uploadPendingMedia(userKey) {
        console.group("📸 [ProfileMediaService] Media Upload Cycle Started");
        console.log(`[MediaService] UserKey targeting: ${userKey}`);

        const currentUserImage = window.UserService?.get()?.user_image || "{}";
        console.log(`[MediaService] Parsing existing images from local cache... Payload:`, currentUserImage);
        const oldImages = typeof currentUserImage === 'string' ? JSON.parse(currentUserImage) : currentUserImage;
        console.log(`[MediaService] Parsed old database images:`, oldImages);

        let avatarFile = null;

        // 1. Handle Avatar
        console.log(`[MediaService] ---> Analyzing Avatar State...`);
        if (window.registerPendingAvatar && typeof window.registerPendingAvatar !== 'string') {
            avatarFile = `avatar_${userKey}_${Date.now()}.webp`;
            console.log(`[MediaService] 🆕 New avatar blob detected. Preparing to upload to Cloudflare as: [${avatarFile}]`);
            console.time(`[MediaService] Avatar Upload Time`);
            await window.uploadFile2cf(window.registerPendingAvatar, avatarFile);
            console.timeEnd(`[MediaService] Avatar Upload Time`);
            console.log(`[MediaService] Avatar successfully persisted in cloud.`);

            if (oldImages.avatar && typeof window.deleteFile2cf === 'function') {
                console.log(`[MediaService] ️ Sweeping old avatar file from cloud storage to prevent bloat: [${oldImages.avatar}]`);
                window.deleteFile2cf(oldImages.avatar).then(() => {
                    console.log(`[MediaService] Old avatar deleted: [${oldImages.avatar}]`);
                }).catch(e => console.warn("[MediaService] ️ Failed to sweep old avatar:", e));
            } else if (oldImages.avatar) {
                console.warn(`[MediaService] ️ Old avatar found [${oldImages.avatar}] but delete function 'window.deleteFile2cf' is not accessible!`);
            } else {
                console.log(`[MediaService] No previous avatar found. Nothing to sweep.`);
            }
        } else {
            console.log(`[MediaService] No new avatar blob found. Action: Retention (User kept previous or has none).`);
        }

        // 2. Handle Covers
        const uploadedCovers = [];
        console.log(`[MediaService] ---> Analyzing Cover Slots State...`);
        if (Array.isArray(window.registerPendingCovers)) {
            console.log(`[MediaService] Found ${window.registerPendingCovers.length} active covers in memory slots.`);
            for (let i = 0; i < window.registerPendingCovers.length; i++) {
                const blob = window.registerPendingCovers[i];
                console.groupCollapsed(`[MediaService] Analyzing Slot [${i}]`);
                if (blob && typeof blob !== 'string') {
                    const fileName = `cover_${userKey}_${i}_${Date.now()}.webp`;
                    console.log(`Type: Blob. Action: [UPLOAD]. New filename: ${fileName}`);
                    console.time(`[MediaService] Cover ${i} Upload Time`);
                    await window.uploadFile2cf(blob, fileName);
                    console.timeEnd(`[MediaService] Cover ${i} Upload Time`);
                    uploadedCovers.push(fileName);

                    if (oldImages.covers && oldImages.covers[i] && typeof window.deleteFile2cf === 'function') {
                         console.log(`️ Sweeping old cover at slot [${i}] prior replaced by new upload: ${oldImages.covers[i]}`);
                         window.deleteFile2cf(oldImages.covers[i]).catch(e => console.warn("[MediaService] ️ Failed sweep:", e));
                    }
                } else if (typeof blob === 'string') {
                    console.log(`Type: String URL. Action: [PRESERVE]. Retaining: ${blob}`);
                    uploadedCovers.push(blob);
                } else {
                    console.log(`Type: Null/Falsy. Action: [DROP]. Slot is empty.`);
                    uploadedCovers.push(null);
                    if (oldImages.covers && oldImages.covers[i] && typeof window.deleteFile2cf === 'function') {
                         console.log(`️ Sweeping orphaned cover at slot [${i}] (User explicitly removed it): ${oldImages.covers[i]}`);
                         window.deleteFile2cf(oldImages.covers[i]).catch(e => console.warn("[MediaService] ️ Failed sweep:", e));
                    }
                }
                console.groupEnd();
            }
            console.log("[MediaService] Cover batch array execution finished. Computed array built.");
        } else {
            console.log("[MediaService] registerPendingCovers array is not defined. Skipping cover processing.");
        }

        const stats = {
            avatar: avatarFile,
            covers: uploadedCovers.filter(c => c !== null)
        };
        console.log(`[MediaService] Final Extracted Cloud Objects Reference => Avatar: [${stats.avatar}], Compressed Covers List: [${stats.covers.join(', ') || 'Empty'}]`);
        console.groupEnd();
        return stats;
    }

    return {
        uploadPendingMedia
    };
})();
