/**
 * @file pages/register/js/register-elements.js
 * @description Centralized element retrieval for the register page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * Safely retrieves all necessary DOM elements for the register module.
 * @returns {Object} An object containing references to the register form elements.
 */
function registerGetElements() {
    return {
        // Form & Basic Inputs
        form: document.getElementById("register_form"),

        // Naming both versions to support different script files during transition
        username: document.getElementById("register_username"),
        usernameInput: document.getElementById("register_username"),

        phone: document.getElementById("register_phone"),
        phoneInput: document.getElementById("register_phone"),
        phonesList: document.getElementById("register_phones_list"),
        addPhoneBtn: document.getElementById("register_add_phone_btn"),

        password: document.getElementById("register_password"),
        passwordInput: document.getElementById("register_password"),
        currentPassword: document.getElementById("profile_current_password"),
        confirmPassword: document.getElementById("register_confirm_password"),

        address: document.getElementById("register_address"),
        addressInput: document.getElementById("register_address"),

        coordsInput: document.getElementById("register_coords"),

        // Error Messages
        usernameError: document.getElementById("register_username-error"),
        phoneError: document.getElementById("register_phone-error"),
        passwordError: document.getElementById("register_password-error"),
        confirmPasswordError: document.getElementById("register_confirm_password-error"),
        addressError: document.getElementById("register_address-error"),
        mapError: document.getElementById("register_map-error"),

        // Feedback & UI
        mapStatus: document.getElementById("register_map-status"),
        mapIframe: document.getElementById("register_location-iframe"),
        passwordToggleIcon: document.getElementById("register_toggle-password-icon"),
        confirmPasswordToggleIcon: document.getElementById("register_toggle-confirm-password-icon"),
        contactContainer: document.getElementById("index-contact-container"),

        // Avatar
        avatarInput: document.getElementById("register_avatar-input"),
        avatarTrigger: document.getElementById("register_avatar-trigger"),
        avatarPreview: document.getElementById("register_avatar-preview"),
        avatarPlaceholder: document.getElementById("register_avatar-placeholder"),
        avatarPickBtn: document.getElementById("register_avatar-pick-btn"),
        avatarCameraBtn: document.getElementById("register_avatar-camera-btn"),

        // Covers Management (3 Slots)
        coverMgmtItems: document.querySelectorAll('.cover-mgmt-item'),
        coverSlotInputs: document.querySelectorAll('.reg-cover-slot-input'),

        // Business Fields
        businessName: document.getElementById("register_business_name"),
        businessCategoryJson: document.getElementById("register_business_category_json"),
        businessCategoryBtn: document.getElementById("register_btn_select_categories"),
        businessCategoryDisplay: document.getElementById("register_selected_categories_display"),
        businessTagline: document.getElementById("register_business_tagline"),
        businessBio: document.getElementById("register_business_bio"),
        businessFacebook: document.getElementById("register_business_facebook"),
        businessInstagram: document.getElementById("register_business_instagram"),
        businessTiktok: document.getElementById("register_business_tiktok"),
        businessTelegram: document.getElementById("register_business_telegram"),
        businessX: document.getElementById("register_business_x"),
        businessWebsite: document.getElementById("register_business_website"),
        ratingEnabledInput: document.getElementById("register_rating_enabled"),
        ratingModeStarsOnly: document.getElementById("register_rating_mode_stars_only"),
        ratingModeStarsComments: document.getElementById("register_rating_mode_stars_comments"),
        ratingModeGroup: document.getElementById("register_rating_mode_group"),
        productRatingEnabledInput: document.getElementById("register_product_rating_enabled"),
        productRatingModeStarsOnly: document.getElementById("register_product_rating_mode_stars_only"),
        productRatingModeStarsComments: document.getElementById("register_product_rating_mode_stars_comments"),
        productRatingModeGroup: document.getElementById("register_product_rating_mode_group"),

        // Merchant Options
        isDeliveredInput: document.getElementById("register_is-delivered"),
        limitPackageInput: document.getElementById("register_limit-package"),
        discountPercentInput: document.getElementById("register_discount_percent"),

        // Wizard Elements
        wizardContainer: document.getElementById("reg-wizard-container"),
        steps: document.querySelectorAll(".reg-step"),
        prevBtn: document.getElementById("reg-prev-btn"),
        nextBtn: document.getElementById("reg-next-btn"),
        loginLink: document.getElementById("reg-login-link"),
        currentStepNum: document.getElementById("reg-current-step-num"),
        totalStepsNum: document.getElementById("reg-total-steps-num"),
        stepStatusLabel: document.getElementById("reg-step-status-label"),
        stepHint: document.getElementById("reg-step-hint"),
        progressBar: document.getElementById("reg-progress-bar"),
        stepsSequence: document.getElementById("reg-steps-sequence"),
        submitBtn: document.getElementById("reg-submit-btn"),

        // Locations UI (multi)
        locationsList: document.getElementById("reg-locations-list"),
        locationsAddBtn: document.getElementById("reg-location-add-btn"),
        locationsError: document.getElementById("reg-locations-error"),
        locationsCounter: document.getElementById("reg-locations-counter"),

        // Roles
        roleDescription: document.getElementById("reg-role-description"),
        roleCheckboxes: document.querySelectorAll('.role-checkbox'),

        // New Redesign Elements
        progressFill: document.getElementById("reg-progress-fill"),
        recoverBanner: document.getElementById("reg-recover-banner")
    };
}
