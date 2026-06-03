/**
 * @file js/PRODUCT_SERVICE/category-ui-system.js
 * @description Category-driven UI configuration, profile resolution, and active page state.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initProductCategoryUi() {
    let configCache = null;
    let configCacheIsRemote = false;
    let configLoadPromise = null;
    const activeProfiles = {
        add: null,
        edit: null,
        view: null
    };
    const FIELD_REGISTRY = {
        add: ['images', 'productName', 'description', 'sellerMessage', 'notes', 'quantity', 'price', 'originalPrice', 'realPrice', 'heavyLoad', 'advancedOptions'],
        edit: ['images', 'productName', 'description', 'sellerMessage', 'notes', 'quantity', 'price', 'originalPrice', 'realPrice', 'heavyLoad', 'advancedOptions'],
        view: ['images', 'price', 'originalPrice', 'quantity', 'description', 'sellerMessage', 'share', 'cartActions', 'sellerCard', 'adminSellerInfo', 'realPrice', 'heavyLoad']
    };

    function trace(step, payload) {
        if (window.ProductCategoryLogger) {
            window.ProductCategoryLogger.info('UiSystem', step, payload);
            return;
        }
        if (typeof payload === 'undefined') {
            console.log(`[ProductCategoryUi] ${step}`);
            return;
        }
        console.log(`[ProductCategoryUi] ${step}`, payload);
    }

    function translate(spec, fallbackText = '') {
        if (!spec) return fallbackText;
        if (typeof spec === 'string') return spec;

        const key = spec.key || '';
        const fallback = spec.fallback || fallbackText || '';
        if (!key || typeof window.langu !== 'function') return fallback;

        const translated = window.langu(key);
        return !translated || translated === key ? fallback : translated;
    }

    function mergeDeep(base, extra) {
        const source = (base && typeof base === 'object') ? base : {};
        const target = (extra && typeof extra === 'object') ? extra : {};
        const result = Array.isArray(source) ? source.slice() : { ...source };

        Object.entries(target).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                result[key] = value.slice();
                return;
            }

            if (
                value &&
                typeof value === 'object' &&
                source[key] &&
                typeof source[key] === 'object' &&
                !Array.isArray(source[key])
            ) {
                result[key] = mergeDeep(source[key], value);
                return;
            }

            result[key] = value;
        });

        return result;
    }

    function getFallbackConfig() {
        return {
            version: 1,
            defaultProfileKey: 'default',
            submit: {
                serviceType: '0'
            },
            profiles: {
                default: {
                    meta: {
                        label: 'Standard Category'
                    },
                    summary: {
                        key: 'product_category_ui_default_summary',
                        fallback: 'Category selection controls labels, visibility, and validation across add, edit, and product view pages.'
                    },
                    submit: {
                        serviceType: '0'
                    },
                    pages: {
                        add: {
                            summaryTitle: {
                                key: 'product_category_ui_add_summary_title',
                                fallback: 'Selected category'
                            },
                            summaryFallback: {
                                key: 'product_category_ui_add_summary_fallback',
                                fallback: 'Choose a main and sub category to apply the page behavior.'
                            },
                            submitButton: {
                                key: 'add1_submit_btn_initial',
                                fallback: 'Add product now'
                            },
                            fields: {
                                images: { visible: true, required: true },
                                productName: { visible: true, required: true },
                                description: { visible: true, required: true, minLength: 10 },
                                sellerMessage: { visible: true, required: true, minLength: 10 },
                                notes: { visible: true, required: false },
                                quantity: { visible: true, required: true, min: 1 },
                                price: { visible: true, required: true, min: 0 },
                                originalPrice: { visible: true, required: false },
                                realPrice: { visible: true, required: false },
                                heavyLoad: { visible: true, required: false }
                            }
                        },
                        edit: {
                            summaryTitle: {
                                key: 'product_category_ui_edit_summary_title',
                                fallback: 'Editing category'
                            },
                            summaryFallback: {
                                key: 'product_category_ui_edit_summary_fallback',
                                fallback: 'Choose a main and sub category to apply the page behavior.'
                            },
                            submitButton: {
                                key: 'edit_btn_save',
                                fallback: 'Save changes'
                            },
                            fields: {
                                images: { visible: true, required: true },
                                productName: { visible: true, required: true },
                                description: { visible: true, required: true, minLength: 10 },
                                sellerMessage: { visible: true, required: true, minLength: 10 },
                                notes: { visible: true, required: false },
                                quantity: { visible: true, required: true, min: 1 },
                                price: { visible: true, required: true, min: 0 },
                                originalPrice: { visible: true, required: false },
                                realPrice: { visible: true, required: false },
                                heavyLoad: { visible: true, required: false }
                            }
                        },
                        view: {
                            summaryTitle: {
                                key: 'product_category_ui_view_summary_title',
                                fallback: 'Category behavior'
                            },
                            summaryFallback: {
                                key: 'product_category_ui_view_summary_fallback',
                                fallback: 'This product uses the standard category-driven layout.'
                            },
                            fields: {
                                images: { visible: true },
                                price: { visible: true },
                                originalPrice: { visible: true },
                                quantity: { visible: true },
                                description: { visible: true },
                                sellerMessage: { visible: true },
                                share: { visible: true },
                                cartActions: { visible: true },
                                sellerCard: { visible: true },
                                realPrice: { visible: true },
                                heavyLoad: { visible: true }
                            }
                        }
                    }
                }
            },
            mainCategoryProfiles: {},
            subCategoryProfiles: {}
        };
    }

    function buildProfile(config, profileKey, visited = new Set()) {
        const fallback = config.profiles[config.defaultProfileKey] || {};
        const key = profileKey && config.profiles[profileKey] ? profileKey : config.defaultProfileKey;
        const profile = config.profiles[key] || fallback;

        if (!profile || visited.has(key)) {
            return mergeDeep(fallback, {});
        }

        visited.add(key);

        let resolved = {};
        if (profile.extends) {
            resolved = buildProfile(config, profile.extends, visited);
        }

        const merged = mergeDeep(resolved, profile);
        delete merged.extends;
        return merged;
    }

    function normalizeConfig(rawConfig) {
        const fallback = getFallbackConfig();
        const input = rawConfig && typeof rawConfig === 'object' ? rawConfig : {};
        const config = mergeDeep(fallback, input);
        if (!config.profiles || !config.profiles[config.defaultProfileKey]) {
            config.defaultProfileKey = fallback.defaultProfileKey;
            config.profiles = mergeDeep(fallback.profiles, config.profiles || {});
        }
        return config;
    }

    async function loadConfig() {
        if (configCache && configCacheIsRemote) {
            trace('load-config-cache-hit', {
                defaultProfileKey: configCache.defaultProfileKey,
                profileCount: Object.keys(configCache.profiles || {}).length
            });
            return configCache;
        }
        if (configLoadPromise) {
            trace('load-config-await-inflight');
            return configLoadPromise;
        }

        configLoadPromise = (async () => {
            try {
            trace('load-config-start', { path: '/js/PRODUCT_SERVICE/category-ui-base.json' });
            const response = await fetch('/js/PRODUCT_SERVICE/category-ui-base.json');
            if (!response.ok) throw new Error(`Failed to load category UI base config: ${response.status}`);
            const rawConfig = await response.json();
            
            rawConfig.profiles = rawConfig.profiles || {};
            
            const profilesToFetch = new Set();
            profilesToFetch.add(rawConfig.defaultProfileKey || 'default');
            (rawConfig.profileIncludes || []).forEach(k => profilesToFetch.add(k));
            Object.values(rawConfig.mainCategoryProfiles || {}).forEach(k => profilesToFetch.add(k));
            Object.values(rawConfig.subCategoryProfiles || {}).forEach(k => profilesToFetch.add(k));

            const fetchQueue = new Set(profilesToFetch);
            
            while (fetchQueue.size > 0) {
                const keysToFetch = Array.from(fetchQueue);
                fetchQueue.clear();
                
                const promises = keysToFetch.map(async (key) => {
                    if (rawConfig.profiles[key]) return;
                    try {
                        const res = await fetch(`/js/PRODUCT_SERVICE/profiles/${key}.json`);
                        if (!res.ok) throw new Error(`Profile ${key} not found (${res.status})`);
                        const profileData = await res.json();
                        rawConfig.profiles[key] = profileData;
                        
                        if (profileData.extends && !rawConfig.profiles[profileData.extends]) {
                            fetchQueue.add(profileData.extends);
                        }
                    } catch (err) {
                        console.warn(`[ProductCategoryUi] Failed to load profile: ${key}`, err);
                    }
                });
                await Promise.all(promises);
            }

            configCache = normalizeConfig(rawConfig);
            configCacheIsRemote = true;
            trace('load-config-success', {
                defaultProfileKey: configCache.defaultProfileKey,
                profileCount: Object.keys(configCache.profiles || {}).length,
                mainMappings: Object.keys(configCache.mainCategoryProfiles || {}).length,
                subMappings: Object.keys(configCache.subCategoryProfiles || {}).length
            });
            return configCache;
            } catch (error) {
            console.warn('[ProductCategoryUi] Falling back to inline config:', error);
            configCache = normalizeConfig(getFallbackConfig());
            configCacheIsRemote = false;
            trace('load-config-fallback', {
                defaultProfileKey: configCache.defaultProfileKey,
                profileCount: Object.keys(configCache.profiles || {}).length
            });
            return configCache;
            } finally {
                configLoadPromise = null;
            }
        })();

        return configLoadPromise;
    }

    function getConfig() {
        if (!configCache) {
            configCache = normalizeConfig(getFallbackConfig());
            configCacheIsRemote = false;
            trace('get-config-bootstrap-fallback', {
                defaultProfileKey: configCache.defaultProfileKey,
                profileCount: Object.keys(configCache.profiles || {}).length
            });
        }
        return configCache;
    }

    function normalizeId(value) {
        if (value == null || value === '') return '';
        return String(value);
    }

    function resolveCategoryProfile(mainId, subId = null) {
        const config = getConfig();
        const normalizedMain = normalizeId(mainId);
        const normalizedSub = normalizeId(subId);
        const defaultProfile = buildProfile(config, config.defaultProfileKey);
        const mainProfileKey = normalizedMain ? config.mainCategoryProfiles[normalizedMain] : null;
        const subProfileKey = normalizedMain && normalizedSub ? config.subCategoryProfiles[`${normalizedMain}:${normalizedSub}`] : null;

        let resolved = mergeDeep({}, defaultProfile);
        if (mainProfileKey) {
            resolved = mergeDeep(resolved, buildProfile(config, mainProfileKey));
        }
        if (subProfileKey) {
            resolved = mergeDeep(resolved, buildProfile(config, subProfileKey));
        }

        const effectiveProfileKey = subProfileKey || mainProfileKey || config.defaultProfileKey;
        trace('resolve-category-profile', {
            mainId: normalizedMain || null,
            subId: normalizedSub || null,
            mainProfileKey: mainProfileKey || null,
            subProfileKey: subProfileKey || null,
            effectiveProfileKey
        });
        return {
            profileKey: effectiveProfileKey,
            mainProfileKey: mainProfileKey || null,
            subProfileKey: subProfileKey || null,
            mainId: normalizedMain,
            subId: normalizedSub,
            meta: resolved.meta || {},
            summary: resolved.summary || null,
            submit: mergeDeep(config.submit || {}, resolved.submit || {}),
            pages: resolved.pages || {}
        };
    }

    function resolveProductProfile(productData) {
        if (!productData || typeof productData !== 'object') {
            trace('resolve-product-profile-empty-input');
            return resolveCategoryProfile(null, null);
        }

        const mainId = productData.MainCategory ?? productData.mainCategory ?? productData.mainId ?? null;
        const subId = productData.SubCategory ?? productData.subCategory ?? productData.subId ?? null;
        trace('resolve-product-profile-from-product', {
            productKey: productData.product_key || productData.key || null,
            mainId,
            subId
        });
        return resolveCategoryProfile(mainId, subId);
    }

    function getPageProfile(profileOrPageType, maybePageType = null) {
        const pageType = maybePageType || profileOrPageType;
        const profile = maybePageType ? profileOrPageType : activeProfiles[pageType];
        const resolvedProfile = profile || resolveCategoryProfile(null, null);
        return resolvedProfile.pages?.[pageType] || {};
    }

    function getKnownFields(pageType) {
        return FIELD_REGISTRY[pageType] ? FIELD_REGISTRY[pageType].slice() : [];
    }

    function setActiveProfile(pageType, profile) {
        activeProfiles[pageType] = profile || null;
        trace('set-active-profile', {
            pageType,
            profileKey: profile?.profileKey || null,
            mainId: profile?.mainId || null,
            subId: profile?.subId || null
        });
    }

    function getActiveProfile(pageType) {
        return activeProfiles[pageType] || null;
    }

    function getFieldConfig(pageType, fieldKey, profile = null) {
        if (!FIELD_REGISTRY[pageType]?.includes(fieldKey)) {
            if (window.ProductCategoryLogger) {
                window.ProductCategoryLogger.warn('UiSystem', 'unknown-field-key-requested', { pageType, fieldKey });
            } else {
                console.warn('[ProductCategoryUi] Unknown field key requested:', { pageType, fieldKey });
            }
        }
        const pageProfile = getPageProfile(profile || activeProfiles[pageType], pageType);
        const fieldConfig = pageProfile.fields?.[fieldKey] || {};
        return {
            visible: fieldConfig.visible !== false,
            required: !!fieldConfig.required,
            min: fieldConfig.min,
            minLength: fieldConfig.minLength,
            label: fieldConfig.label || null,
            placeholder: fieldConfig.placeholder || null,
            hint: fieldConfig.hint || null,
            order: Number.isFinite(fieldConfig.order) ? fieldConfig.order : null,
            mode: fieldConfig.mode || null,
            style: fieldConfig.style || null,
            actionText: fieldConfig.actionText || null
        };
    }

    function isFieldVisible(pageType, fieldKey, profile = null) {
        return getFieldConfig(pageType, fieldKey, profile).visible !== false;
    }

    function isFieldRequired(pageType, fieldKey, profile = null) {
        const fieldConfig = getFieldConfig(pageType, fieldKey, profile);
        return fieldConfig.visible !== false && fieldConfig.required === true;
    }

    function getSubmitSettings(mainId, subId = null) {
        return resolveCategoryProfile(mainId, subId).submit || { serviceType: '0' };
    }

    function getProfileLabel(profile) {
        if (!profile) return 'Standard Category';
        return profile.meta?.label || profile.profileKey || 'Standard Category';
    }

    function isServiceProfile(profile) {
        return String(profile?.submit?.serviceType ?? '0') === '2';
    }

    function getProfileHints(profile, pageType = 'view') {
        const hints = [];
        if (!profile) return hints;
        const knownFields = FIELD_REGISTRY[pageType] || [];
        if (knownFields.includes('price') && !isFieldVisible(pageType, 'price', profile)) {
            hints.push('Price is hidden for this category flow.');
        }
        if (knownFields.includes('quantity') && !isFieldVisible(pageType, 'quantity', profile)) {
            hints.push('Quantity is not part of this category flow.');
        }
        if (knownFields.includes('cartActions') && !isFieldVisible(pageType, 'cartActions', profile) && pageType === 'view') {
            hints.push('Direct cart actions are disabled for this category.');
        }
        if (isServiceProfile(profile)) {
            hints.push('This category resolves to serviceType=2 during submit.');
        }
        return hints;
    }

    function shouldHidePriceForProduct(productData) {
        const profile = resolveProductProfile(productData);
        return !isFieldVisible('view', 'price', profile);
    }

    window.ProductCategoryUi = {
        buildProfile,
        getActiveProfile,
        getConfig,
        getFieldConfig,
        getKnownFields,
        getPageProfile,
        getProfileLabel,
        getProfileHints,
        getSubmitSettings,
        isFieldRequired,
        isFieldVisible,
        isServiceProfile,
        loadConfig,
        mergeDeep,
        normalizeConfig,
        normalizeId,
        resolveCategoryProfile,
        resolveProductProfile,
        setActiveProfile,
        shouldHidePriceForProduct,
        translate
    };

    window.ProductCategoryUi.loadConfig().catch((error) => {
        console.error('[ProductCategoryUi] Auto-load failed:', error);
    });
})();
