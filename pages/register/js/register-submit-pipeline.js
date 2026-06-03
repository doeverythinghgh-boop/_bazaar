/**
 * @file pages/register/js/register-submit-pipeline.js
 * @description Pipeline helpers for register submission flow.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export const RegisterSubmitPipeline = {
    log: (message, payload) => {
        if (window.RegisterDevLogger) {
            window.RegisterDevLogger.info("RegisterSubmit", message, payload);
            return;
        }
        if (payload === undefined) {
            console.log(`[RegisterSubmit] ${message}`);
            return;
        }
        console.log(`[RegisterSubmit] ${message}`, payload);
    },

    validateInputs: async () => {
        if (typeof window.registerValidateInputs === 'function') {
            return window.registerValidateInputs();
        }
        throw new Error("registerValidateInputs not found");
    },

    buildBaseContext: (validation, els) => {
        const { isBusinessAccount, businessState } = validation.data;
        const userKey = window.generateSerial ? window.generateSerial() : `user_${Date.now()}`;
        const accountType = window.registerGetSelectedAccountType ? window.registerGetSelectedAccountType() : 1;
        const { isDeliveryChecked, settings } = window.registerBuildSettingsPayload ? window.registerBuildSettingsPayload(els, isBusinessAccount) : { isDeliveryChecked: false, settings: {} };

        const newUser = {
            user_key: userKey,
            account_type: accountType
        };

        return {
            els,
            newUser,
            validationData: validation.data,
            userKey,
            accountType,
            isBusinessAccount,
            businessState,
            settings,
            isDeliveryChecked
        };
    },

    applySubmitBuilders: async (submitSectionContext) => {
        const submitSectionKeys = window.registerGetActiveSubmitSectionKeys ? window.registerGetActiveSubmitSectionKeys() : [];
        for (const submitSectionKey of submitSectionKeys) {
            const builder = window.registerSubmitBuilders?.[submitSectionKey];
            if (typeof builder !== "function") continue;
            Object.assign(submitSectionContext.newUser, await builder(submitSectionContext));
        }
        return submitSectionContext.newUser;
    },

    uploadPendingMedia: async (userKey) => {
        let avatarFile = null;
        const uploadedCovers = [];
        const uploadedFiles = [];

        if (window.registerPendingAvatar && typeof window.uploadFile2cf === 'function') {
            const fileName = `avatar_${userKey}_${Date.now()}.webp`;
            await window.uploadFile2cf(window.registerPendingAvatar, fileName);
            avatarFile = fileName;
            uploadedFiles.push(fileName);
        }

        if (window.registerPendingCovers && typeof window.uploadFile2cf === 'function') {
            for (let i = 0; i < window.registerPendingCovers.length; i++) {
                const blob = window.registerPendingCovers[i];
                if (!blob) continue;
                const fileName = `cover_${userKey}_${i}_${Date.now()}.webp`;
                await window.uploadFile2cf(blob, fileName);
                uploadedCovers.push(fileName);
                uploadedFiles.push(fileName);
            }
        }

        return {
            avatarFile,
            uploadedCovers,
            uploadedFiles
        };
    },

    attachUserImage: (newUser, mediaResult) => {
        newUser.user_image = JSON.stringify({
            avatar: mediaResult.avatarFile,
            covers: mediaResult.uploadedCovers,
            cover: mediaResult.uploadedCovers[0] || null
        });
    },

    submitNewUser: async (newUser) => {
        if (typeof window.addUser === 'function') {
            return window.addUser(newUser);
        }
        throw new Error("addUser not found");
    },

    cleanupUploadedFiles: (uploadedFiles) => {
        for (const fileName of uploadedFiles) {
            if (typeof window.deleteFile2cf === 'function') {
                window.deleteFile2cf(fileName).catch((error) => {
                    console.error("[RegisterSubmit] Failed to cleanup uploaded file.", {
                        fileName,
                        error: error?.message || error
                    });
                });
            }
        }
    },

    handleSuccess: async (newUser, result) => {
        if (window.RegisterDraftManager) {
            window.RegisterDraftManager.clearDraft();
        }
        const confirmedUser = window.UserService?.mergeUser
            ? window.UserService.mergeUser(newUser, result)
            : { ...newUser, ...result };
        
        if (window.SessionManager?.login) {
            await window.SessionManager.login(confirmedUser, false);
        }
    }
};

// Hybrid bridge
window.RegisterSubmitPipeline = RegisterSubmitPipeline;

export default RegisterSubmitPipeline;

console.log("[ESM Load] register-submit-pipeline.js: Hybrid bridge established.");
