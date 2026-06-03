/**
 * @file pages/register/js/register-config.js
 * @description Global configuration and state management for the registration page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * Global variable for storing the compressed avatar image before upload.
 * @type {File| Blob| null}
 */
window.registerPendingAvatar = null;
window.registerPendingCovers = [null, null, null];

/**
 * Preview object URLs are tracked so they can be revoked when replaced.
 */
window.registerPreviewUrls = {
    avatar: null,
    covers: [null, null, null]
};

/**
 * Small cache for phone duplication checks to keep UI responsive.
 */
window.registerPhoneCheckCache = new Map();
window.registerPhoneCheckInflight = new Map();
window.registerIsSubmitting = false;
window.REGISTER_DEBUG = window.REGISTER_DEBUG !== false;

window.registerDebugLog = function (scope, message, payload = null) {
    if (window.REGISTER_DEBUG === false) return;

    const prefix = `[RegisterDebug][${scope}] ${message}`;
    if (payload === null || payload === undefined) {
        console.log(prefix);
        return;
    }

    console.log(prefix, payload);
};

/**
 * Cache version for the dynamically loaded step partials.
 */
window.REGISTER_STEPS_CACHE_VERSION = window.REGISTER_STEPS_CACHE_VERSION || "v14";

/**
 * Central, extensible register wizard steps definition.
 */
window.REGISTER_STEP_DEFINITIONS = [
    {
        id: "identity",
        template: "step-identity.html",
        icon: "fas fa-id-card",
        titleKey: "register_step_identity_title",
        hintKey: "register_step_identity_hint",
        fallbackTitle: "الهوية والاتصال",
        fallbackHint: "أدخل اسمك ورقم هاتفك الأساسي لتأكيد هويتك.",
        validatorKey: "identity",
        setupKey: "phones",
        liveValidationFieldKeys: ["username", "phones"],
        finalValidationKeys: ["username", "phone"],
        submitSectionKeys: ["coreIdentity", "contactExtras"],
        required: true,
        audience: "all"
    },
    {
        id: "password",
        template: "step4-password.html",
        icon: "fas fa-lock",
        titleKey: "reg_step_name_4",
        hintKey: "reg_hint_step4",
        validatorKey: "password",
        liveValidationFieldKeys: ["password", "confirmPassword"],
        finalValidationKeys: ["password"],
        submitSectionKeys: ["coreIdentity"],
        required: true,
        audience: "all",
        isVisible: ({ mode }) => mode !== "PROFILE"
    },
    {
        id: "security",
        template: "step-security.html",
        icon: "fas fa-shield-halved",
        titleKey: "profile_security_step_title",
        hintKey: "profile_security_step_hint",
        fallbackTitle: "الأمان والحساب",
        validatorKey: "security",
        liveValidationFieldKeys: ["currentPassword", "password", "confirmPassword"],
        finalValidationKeys: ["password"],
        submitSectionKeys: ["coreIdentity"],
        required: true,
        audience: "all",
        isVisible: ({ mode }) => mode === "PROFILE"
    },
    {
        id: "location",
        template: "step5-location-media.html",
        icon: "fas fa-location-crosshairs",
        titleKey: "register_step_location_address_title",
        hintKey: "register_step_location_address_hint",
        fallbackTitle: "الموقع والعنوان والصور",
        fallbackHint: "حدد موقعك على الخريطة ثم أضف تفاصيل العنوان. يمكنك أيضًا إضافة صور (اختياري).",
        validatorKey: "locationAddress",
        setupKey: "location",
        liveValidationFieldKeys: ["address"],
        finalValidationKeys: ["location", "address"],
        submitSectionKeys: ["coreIdentity", "businessSettings", "media"],
        required: ({ isBusinessAccount }) => !!isBusinessAccount,
        audience: "all"
    },
    {
        id: "business",
        template: "step6-business-setup.html",
        icon: "fas fa-store",
        titleKey: "register_step_business_setup_title",
        hintKey: "register_step_business_setup_hint",
        fallbackTitle: "بيانات النشاط",
        fallbackHint: "أكمل بيانات نشاطك والتوصيل والحد الأدنى والتخصصات في خطوة واحدة.",
        validatorKey: "businessSetup",
        liveValidationFieldKeys: ["businessName", "businessTagline"],
        finalValidationKeys: ["businessName", "businessTagline", "categories", "delivery"],
        submitSectionKeys: ["businessProfile", "businessSettings"],
        setupKey: "categories",
        required: true,
        audience: "business"
    },
    {
        id: "social",
        template: "step13-social.html",
        icon: "fas fa-share-nodes",
        titleKey: "reg_step_name_13",
        hintKey: "reg_hint_step13",
        validatorKey: "social",
        finalValidationKeys: ["links"],
        submitSectionKeys: ["businessLinks"],
        required: false,
        audience: "business"
    },
    {
        id: "rating",
        template: "step14-rating.html",
        icon: "fas fa-star",
        titleKey: "reg_step_name_14",
        hintKey: "reg_hint_step14",
        fallbackTitleKey: "rating_settings_title",
        validatorKey: "rating",
        setupKey: "rating",
        submitSectionKeys: ["businessSettings"],
        required: false,
        audience: "business"
    }
];

window.registerGetAllStepDefinitions = function () {
    return Array.isArray(window.REGISTER_STEP_DEFINITIONS)
        ? window.REGISTER_STEP_DEFINITIONS.slice()
        : [];
};

window.registerGetActiveStepDefinitions = function (roles = null) {
    const resolvedRoles = roles == null
        ? ((typeof registerGetSelectedAccountType === 'function')
            ? registerGetSelectedAccountType()
            : (window.ACCOUNT_ROLES?.BUYER || 1))
        : roles;

    const isBusinessAccount = resolvedRoles > (window.ACCOUNT_ROLES?.BUYER || 1);
    const mode = window.regWizard?.mode || "REGISTER";

    return window.registerGetAllStepDefinitions().filter((step) => {
        if (typeof step.isVisible === "function") {
            try {
                return !!step.isVisible({ roles: resolvedRoles, isBusinessAccount, mode });
            } catch (error) {
                console.error(`[Register] Step visibility failed for ${step.id}:`, error);
                return false;
            }
        }

        if (step.audience === "business") return isBusinessAccount;
        return true;
    });
};

window.registerGetStepDefinitionByIndex = function (index, roles = null) {
    const steps = window.registerGetActiveStepDefinitions(roles);
    return steps[index - 1] || null;
};

window.registerGetStepDefinitionById = function (stepId) {
    return window.registerGetAllStepDefinitions().find((step) => step.id === stepId) || null;
};
