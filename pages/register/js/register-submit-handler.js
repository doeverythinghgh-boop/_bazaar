/**
 * @file pages/register/js/register-submit-handler.js
 * @description Final form submission logic.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

export async function registerHandleSubmit(e) {
    if (e) e.preventDefault();

    const pipeline = window.RegisterSubmitPipeline;
    if (!pipeline) {
        console.error("[Register][Submit] RegisterSubmitPipeline is not available.");
        return;
    }

    if (window.registerIsSubmitting) {
        return;
    }

    const els = window.registerGetElements ? window.registerGetElements() : null;
    const submitButton = els?.submitBtn;

    // 1. Validation
    pipeline.log("Starting final validation check.");
    const validation = await pipeline.validateInputs();
    if (!validation.isValid) {
        pipeline.log("Client-side validation failed; submission aborted.");
        return;
    }
    pipeline.log("Validation passed. Building user payload.");

    const submitSectionContext = pipeline.buildBaseContext(validation, els);
    const newUser = await pipeline.applySubmitBuilders(submitSectionContext);


    // 4. Submit to Backend
    pipeline.log("Final user object prepared for API.", {
        user_key: newUser.user_key,
        account_type: newUser.account_type
    });
    window.registerIsSubmitting = true;
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute("aria-disabled", "true");
    }
    if (window.AuthUI) {
        window.AuthUI.showLoading(window.langu("register_creating_account"));
    }

    let uploadedFiles = []; // Track to cleanup on failure

    try {
        pipeline.log("Uploading media assets.");
        const mediaResult = await pipeline.uploadPendingMedia(submitSectionContext.userKey);
        uploadedFiles = mediaResult.uploadedFiles;
        pipeline.attachUserImage(newUser, mediaResult);

        pipeline.log("Calling addUser API.");
        const result = await pipeline.submitNewUser(newUser);
        pipeline.log("API response received.");
        if (window.AuthUI) window.AuthUI.close();

        // ✅ Success check: logic usually returns user object with id or a message
        if (result && (result.message || result.id)) {
            pipeline.log("Account created successfully.");
            if (submitSectionContext.isBusinessAccount && window.RegisterDeliveryPartnerManager) {
                pipeline.log("Synchronizing delivery provider relation.");
                await window.RegisterDeliveryPartnerManager.syncSellerRelation(newUser.user_key);
            }
            await pipeline.handleSuccess(newUser, result);

            // Success UI
            if (window.Swal) {
                window.Swal.fire({
                    title: window.langu("register_success_title"),
                    html: `
                    <p style="font-size: 1rem; color: #666;">${window.langu("register_success_subtitle")}</p>
                    <div style="text-align: right; margin-top: 15px; font-size: 0.9em; color: #555;">
                        <p style="margin-bottom: 8px;"><i class="fas fa-check-circle" style="color: #10b981;"></i> ${window.langu("register_success_feature_1")}</p>
                        <p style="margin-bottom: 8px;"><i class="fas fa-check-circle" style="color: #10b981;"></i> ${window.langu("register_success_feature_2")}</p>
                        <p><i class="fas fa-check-circle" style="color: #10b981;"></i> ${window.langu("register_success_feature_3")}</p>
                    </div>
                    `,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    width: '320px',
                    padding: '1.5em',
                    confirmButtonText: window.langu("register_go_home_btn"),
                    buttonsStyling: false,
                    customClass: {
                        popup: 'swal-modern-mini-popup',
                        title: 'swal-modern-mini-title',
                        htmlContainer: 'swal-modern-mini-text',
                        confirmButton: 'swal-modern-mini-confirm'
                    }
                }).then((res) => {
                    if (res.isConfirmed) {
                        window.location.href = "/pages/home/home.html";
                    }
                });
            } else {
                window.location.href = "/pages/home/home.html";
            }

        } else if (result && result.error) {
            console.error("[Register][Submit] API Error Response:", result.error);
            pipeline.cleanupUploadedFiles(uploadedFiles);
            if (window.AuthUI) window.AuthUI.showError(window.langu('gen_swal_error_title'), result.error);
            // Also show inline error on phone as generic fallback?
            if (els?.phoneError) els.phoneError.textContent = result.error;
        } else {
            console.error("[Register][Submit] Unknown/Empty API response format:", result);
            pipeline.cleanupUploadedFiles(uploadedFiles);
            if (window.AuthUI) window.AuthUI.showError(window.langu('gen_swal_error_title'), window.langu('register_error_unexpected'));
        }
    } catch (error) {
        let normalized = { message: error?.message || window.langu('register_error_app') };
        if (window.RegisterErrorUtils?.logError) {
            normalized = window.RegisterErrorUtils.logError("RegisterSubmitHandler", "Exception during register submission.", error);
        } else {
            console.error("[Register][Submit] Exception during submission:", error);
        }
        pipeline.cleanupUploadedFiles(uploadedFiles);
        if (window.AuthUI) window.AuthUI.close();
        if (window.AuthUI) window.AuthUI.showError(window.langu('gen_swal_error_title'), normalized.message || window.langu('register_error_app'));
    } finally {
        window.registerIsSubmitting = false;
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.setAttribute("aria-disabled", "false");
        }
    }
}

export const registerSubmitBuilders = {
    async coreIdentity({ validationData }) {
        return {
            username: validationData.username,
            phone: validationData.phone,
            phones: validationData.phones,
            Password: validationData.password,
            Address: validationData.address,
            location: validationData.location
        };
    },

    async contactExtras({ validationData }) {
        const preferredWhatsapp = validationData.phones.find((item) => item.is_primary && item.has_whatsapp)
            || validationData.phones.find((item) => item.has_whatsapp);
        return {
            business_whatsapp: preferredWhatsapp?.number || "",
            phones: validationData.phones
        };
    },

    async businessSettings({ els, isBusinessAccount, settings, isDeliveryChecked }) {
        const discountPercent = window.UserFormService?.normalizeDiscountPercent
            ? window.UserFormService.normalizeDiscountPercent(els?.discountPercentInput?.value || 0)
            : (parseFloat(els?.discountPercentInput?.value || 0) || 0);
        return {
            isDelivered: isDeliveryChecked,
            limitPackage: parseFloat(els?.limitPackageInput?.value || 0),
            discountPercent,
            settings: JSON.stringify(isBusinessAccount ? settings : { isDelivered: isDeliveryChecked })
        };
    },

    async businessProfile({ els, isBusinessAccount, businessState }) {
        if (!isBusinessAccount) return {};
        return window.registerBuildBusinessPayload ? window.registerBuildBusinessPayload(els, businessState) : {};
    },

    async businessLinks({ els, isBusinessAccount }) {
        if (!isBusinessAccount) return {};
        return window.registerBuildBusinessLinksPayload ? window.registerBuildBusinessLinksPayload(els) : {};
    },

    async media() {
        return {};
    }
};

// Hybrid bridge
window.registerHandleSubmit = registerHandleSubmit;
window.registerSubmitBuilders = registerSubmitBuilders;

console.log("[ESM Load] register-submit-handler.js: Hybrid bridge established.");
