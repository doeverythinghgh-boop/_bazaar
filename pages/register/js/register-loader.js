/**
 * @file pages/register/js/register-loader.js
 * @description Dynamically loads and injects registration wizard steps.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.RegisterLoader = (function () {
    'use strict';

    const STEPS_PATH = '/pages/register/steps/';
    const CACHE_PREFIX = `register_steps_cache_${window.REGISTER_STEPS_CACHE_VERSION || 'v2'}`;
    let inMemoryCacheKey = "";
    let inMemoryStepsHtml = "";

    function getCacheContext() {
        const mode = window.regWizard?.mode || "REGISTER";
        const roles = typeof registerGetSelectedAccountType === "function"
            ? registerGetSelectedAccountType()
            : (window.ACCOUNT_ROLES?.BUYER || 1);
        return { mode, roles };
    }

    function getCacheKey() {
        const context = getCacheContext();
        return `${CACHE_PREFIX}_${context.mode}_roles_${context.roles}`;
    }

    function getStepDefinitions() {
        const allDefinitions = typeof window.registerGetAllStepDefinitions === 'function'
            ? window.registerGetAllStepDefinitions()
            : [];

        const mode = window.regWizard?.mode || "REGISTER";
        const roles = typeof registerGetSelectedAccountType === "function"
            ? registerGetSelectedAccountType()
            : (window.ACCOUNT_ROLES?.BUYER || 1);
        const isBusinessAccount = roles > (window.ACCOUNT_ROLES?.BUYER || 1);

        const result = allDefinitions.filter((step) => {
            if (typeof step.isVisible !== "function") {
                if (step.audience === "business" && !isBusinessAccount) return false;
                return true;
            }

            try {
                return !!step.isVisible({ roles, isBusinessAccount, mode });
            } catch (error) {
                console.error(`[RegisterLoader] Step visibility failed for ${step.id}:`, error);
                return false;
            }
        });

        console.log(`[RegisterLoader] Resolved ${result.length} steps for roles=${roles}, isBusiness=${isBusinessAccount}, mode=${mode}`, result.map(s => s.id));
        return result;
    }

    function getStepFetchUrl(file) {
        const version = encodeURIComponent(window.REGISTER_STEPS_CACHE_VERSION || 'v2');
        return `${STEPS_PATH}${file}?v=${version}`;
    }

    function getCachedSteps() {
        const cacheKey = getCacheKey();
        if (inMemoryStepsHtml && inMemoryCacheKey === cacheKey) return inMemoryStepsHtml;

        try {
            const cached = LocalDBSession.getItem(cacheKey);
            if (cached) {
                inMemoryCacheKey = cacheKey;
                inMemoryStepsHtml = cached;
                return cached;
            }
        } catch (error) {
            console.warn('[RegisterLoader] Failed to read steps cache:', error);
        }

        return "";
    }

    function setCachedSteps(html) {
        const cacheKey = getCacheKey();
        inMemoryCacheKey = cacheKey;
        inMemoryStepsHtml = html;
        try {
            LocalDBSession.setItem(cacheKey, html);
        } catch (error) {
            console.warn('[RegisterLoader] Failed to persist steps cache:', error);
        }
    }

    /**
     * Loads all steps and injects them into the wizard container.
     * @returns {Promise<void>}
     */
    async function loadSteps() {
        const container = document.getElementById('reg-wizard-container');
        if (!container) {
            console.error('[RegisterLoader] Target container not found!');
            return;
        }

        console.log('[RegisterLoader] Loading steps...');

        try {
            const stepDefinitions = getStepDefinitions();
            if (typeof window.registerDebugLog === "function") {
                window.registerDebugLog("Loader", "Resolved step definitions before fetch.", stepDefinitions.map((step, index) => ({
                    index: index + 1,
                    id: step.id,
                    template: step.template,
                    audience: step.audience || "all"
                })));
            }
            if (!stepDefinitions.length) {
                throw new Error('No register step definitions found.');
            }

            const cachedHtml = getCachedSteps();
            if (cachedHtml) {
                container.innerHTML = cachedHtml;
                annotateLoadedSteps(container, stepDefinitions);
                if (typeof window.registerDebugLog === "function") {
                    window.registerDebugLog("Loader", "Loaded steps HTML from cache.", {
                        htmlLength: cachedHtml.length,
                        renderedSteps: container.querySelectorAll('.reg-step').length
                    });
                }
                console.log('[RegisterLoader] Loaded steps from cache.');
                return;
            }

            // Load all files in parallel
            const promises = stepDefinitions.map(step =>
                fetch(getStepFetchUrl(step.template), { cache: 'no-store' }).then(res => {
                    if (!res.ok) throw new Error(`Failed to load ${step.template}`);
                    if (typeof window.registerDebugLog === "function") {
                        window.registerDebugLog("Loader", `Fetched template successfully: ${step.template}`, {
                            url: getStepFetchUrl(step.template),
                            ok: res.ok,
                            status: res.status
                        });
                    }
                    return res.text();
                })
            );

            const contents = await Promise.all(promises);
            const finalHtml = contents.join('\n');

            // Clear container and inject
            container.innerHTML = finalHtml;
            annotateLoadedSteps(container, stepDefinitions);
            setCachedSteps(finalHtml);
            if (typeof window.registerDebugLog === "function") {
                window.registerDebugLog("Loader", "Injected all steps into wizard container.", {
                    htmlLength: finalHtml.length,
                    renderedSteps: container.querySelectorAll('.reg-step').length,
                    renderedStepIds: Array.from(container.querySelectorAll('.reg-step')).map((step) => step.dataset.stepId || step.id || "(missing-id)")
                });
            }

            console.log('[RegisterLoader] All steps loaded successfully.');
        } catch (error) {
            console.error('[RegisterLoader] Error loading steps:', error);
            // Fallback: Show a user-friendly error in the container
            container.innerHTML = `<div class="reg-critical-error">${window.langu("reg_err_steps_load")}</div>`;
        }
    }

    function annotateLoadedSteps(container, stepDefinitions) {
        const stepElements = Array.from(container.querySelectorAll('.reg-step'));
        if (typeof window.registerDebugLog === "function") {
            window.registerDebugLog("Loader", "Annotating loaded step elements.", {
                foundElements: stepElements.length,
                expectedDefinitions: stepDefinitions.length
            });
        }
        stepElements.forEach((element, index) => {
            const definition = stepDefinitions[index];
            if (!definition) return;

            element.dataset.stepId = definition.id;
            element.dataset.stepTemplate = definition.template;
            element.dataset.stepOrder = String(index + 1);

            if (typeof window.registerDebugLog === "function") {
                window.registerDebugLog("Loader", `Annotated step #${index + 1}.`, {
                    domId: element.id || "(no-dom-id)",
                    stepId: definition.id,
                    template: definition.template,
                    groups: element.querySelectorAll('.reg-form-group').length,
                    mediaBlocks: element.querySelectorAll('.reg-media-block').length,
                    optionalWrappers: element.querySelectorAll('.reg-optional-wrapper').length
                });
            }
        });
    }

    return {
        loadSteps
    };
})();
