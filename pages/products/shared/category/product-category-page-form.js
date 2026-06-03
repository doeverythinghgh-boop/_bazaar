/**
 * @file pages/products/shared/category/product-category-page-form.js
 * @description Form-specific logic for category-driven UI behavior.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function initProductCategoryPageForm() {
    const internal = window.__ProductCategoryInternal;

    function ensureSummaryElement(containerId, summaryId) {
        const container = document.getElementById(containerId);
        if (!container) return null;

        let summaryEl = document.getElementById(summaryId);
        if (!summaryEl) {
            summaryEl = document.createElement('div');
            summaryEl.id = summaryId;
            summaryEl.style.cssText = 'margin-top:10px;padding:12px 14px;border-radius:16px;background:rgba(11,94,215,.08);border:1px solid rgba(11,94,215,.12);line-height:1.6;';
            container.appendChild(summaryEl);
        }

        return summaryEl;
    }

    function applyRequiredAttribute(input, required) {
        if (!input) return;
        if (required) input.setAttribute('required', 'required');
        else input.removeAttribute('required');
    }

    function clearHiddenFieldValue(input) {
        if (!input) return;
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
            return;
        }
        if (input.tagName === 'SELECT') {
            input.selectedIndex = -1;
            return;
        }
        input.value = '';
    }

    function sortMappings(pageType, mappings, profile) {
        return mappings.slice().sort((a, b) => {
            const orderA = window.ProductCategoryUi.getFieldConfig(pageType, a.fieldKey, profile).order;
            const orderB = window.ProductCategoryUi.getFieldConfig(pageType, b.fieldKey, profile).order;
            const normalizedA = orderA == null ? Number.MAX_SAFE_INTEGER : orderA;
            const normalizedB = orderB == null ? Number.MAX_SAFE_INTEGER : orderB;
            return normalizedA - normalizedB;
        });
    }

    function applyFormField({ pageType, fieldKey, groupEl, inputEl, labelEl, hintEl, profile }) {
        if (!window.ProductCategoryUi) return;
        const fieldConfig = window.ProductCategoryUi.getFieldConfig(pageType, fieldKey, profile);
        internal.trace('apply-form-field', {
            pageType,
            fieldKey,
            visible: fieldConfig.visible !== false,
            required: fieldConfig.required === true,
            profileKey: profile?.profileKey || null
        });

        internal.setVisible(groupEl || inputEl, fieldConfig.visible !== false);
        internal.setDisabled(inputEl, fieldConfig.visible === false);

        // Global Overrides for Requirement Logic
        let isFieldRequired = fieldConfig.required === true;
        if (fieldKey === 'description') isFieldRequired = true; // Always required per user request
        if (fieldKey === 'price' || fieldKey === 'quantity') isFieldRequired = false; // Always optional per user request

        applyRequiredAttribute(inputEl, isFieldRequired);
        if (fieldConfig.visible === false) clearHiddenFieldValue(inputEl);

        const labelText = internal.resolveText(fieldConfig.label);
        if (labelText) internal.setText(labelEl, labelText);

        const placeholderText = internal.resolveText(fieldConfig.placeholder);
        if (placeholderText) internal.setPlaceholder(inputEl, placeholderText);

        const hintText = internal.resolveText(fieldConfig.hint);
        if (hintEl) {
            if (hintText) {
                internal.setText(hintEl, hintText);
                internal.setVisible(hintEl, true);
            } else {
                internal.setVisible(hintEl, false);
            }
        }
    }

    function applyFormPageFields(pageType, profile) {
        const mappings = sortMappings(pageType, internal.FORM_FIELD_MAPS[pageType] || [], profile);
        mappings.forEach((mapping) => {
            const groupEl = mapping.groupId ? document.getElementById(mapping.groupId) : null;
            const inputEl = mapping.inputId ? document.getElementById(mapping.inputId) : null;
            const labelEl = mapping.labelSelector ? document.querySelector(mapping.labelSelector) : null;
            const hintEl = mapping.hintSelector ? document.querySelector(mapping.hintSelector) : null;

            if (!groupEl && !inputEl) {
                const payload = {
                    pageType,
                    fieldKey: mapping.fieldKey,
                    groupId: mapping.groupId || null,
                    inputId: mapping.inputId || null
                };
                if (window.ProductCategoryLogger) window.ProductCategoryLogger.warn('PageCore', 'missing-dom-hook-for-field-mapping', payload);
                else console.warn('[ProductCategoryPageCore] Missing DOM hook for field mapping:', payload);
            }

            if (groupEl?.parentElement) {
                groupEl.parentElement.appendChild(groupEl);
            }

            applyFormField({
                pageType,
                fieldKey: mapping.fieldKey,
                groupEl,
                inputEl,
                labelEl,
                hintEl,
                profile
            });
        });
    }

    async function renderFormSummary({ pageType, containerId, summaryId, profile, mainId, subId }) {
        if (!window.ProductCategoryUi) return;
        const pageProfile = window.ProductCategoryUi.getPageProfile(profile, pageType);
        const summaryEl = ensureSummaryElement(containerId, summaryId);
        if (!summaryEl) return;

        let user = window.userSession;
        if (!user && window.UserService && typeof window.UserService.get === 'function') {
            user = window.UserService.get();
        }

        const capabilities = typeof window.resolveUserCapabilities === 'function' ? window.resolveUserCapabilities(user) : null;
        const isSuperAdmin = capabilities?.isSuperAdmin === true;

        if (!isSuperAdmin) {
            summaryEl.style.display = 'none';
            return;
        }

        summaryEl.style.display = 'block';
        const names = await internal.getCategoryNames(mainId, subId);
        const categoryText = names.sub || names.main || '';
        const titleText = internal.resolveText(pageProfile.summaryTitle, 'Selected category');
        const summaryText = categoryText
            ? internal.resolveText(profile.summary, '')
            : internal.resolveText(pageProfile.summaryFallback, 'Choose a main and sub category to apply the page behavior.');
        const profileLabel = window.ProductCategoryUi.getProfileLabel(profile);
        const hints = window.ProductCategoryUi.getProfileHints(profile, pageType);

        const noticeText = typeof window.langu === 'function' ? window.langu('pv_super_admin_notice') : 'Notice: This section is visible only to Super Admin';

        summaryEl.innerHTML = `
            <div id="${summaryId}_toggle_trigger" style="cursor:pointer; display:flex; align-items:center; justify-content:space-between; user-select:none;">
                <div style="font-size:0.75rem; color:#dc3545; font-weight:bold;">
                    <i class="fas fa-shield-alt"></i> ${noticeText}
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:0.7rem; color:#0b5ed7; font-weight:bold; text-transform:uppercase; letter-spacing:0.5px;">أدوات المشرف</span>
                    <i class="fas fa-chevron-down" id="${summaryId}_toggle_icon" style="transition:transform 0.3s ease; color:#0b5ed7;"></i>
                </div>
            </div>
            
            <div id="${summaryId}_content_body" style="display:none; margin-top:12px; border-top:1px dashed rgba(11,94,215,0.1); padding-top:10px;">
                <div id="${summaryId}_title" style="font-weight:700;color:#0b5ed7;">${titleText}${categoryText ? `: ${categoryText}` : ''}</div>
                <div id="${summaryId}_text" style="color:#495057;">${summaryText || profileLabel}</div>
                ${hints.length ? `<div id="${summaryId}_hints" style="margin-top:6px;color:#6c757d;font-size:.9rem;">${hints.join(' | ')}</div>` : ''}
                <div id="${summaryId}_profile" style="margin-top:6px;color:#6c757d;font-size:.9rem;">Profile: ${profileLabel}</div>

                <div id="${summaryId}_simulator_wrapper" style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(11,94,215,0.1);">
                    <div style="font-size:0.7rem; color:#0b5ed7; font-weight:bold; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">
                        <i class="fas fa-flask"></i> محاكي واجهة التصنيفات (تفاعلي)
                    </div>
                    <div id="${summaryId}_simulator_panel_host"></div>
                </div>
            </div>
        `;

        const trigger = document.getElementById(`${summaryId}_toggle_trigger`);
        const body = document.getElementById(`${summaryId}_content_body`);
        const icon = document.getElementById(`${summaryId}_toggle_icon`);
        
        if (trigger && body && icon) {
            trigger.onclick = () => {
                const isHidden = body.style.display === 'none';
                body.style.display = isHidden ? 'block' : 'none';
                icon.style.transform = isHidden ? 'rotate(180deg)' : 'rotate(0deg)';
            };
        }

        // Render the simulator selector
        if (window.ProductCategoryScope && typeof window.ProductCategoryScope.renderSelector === 'function') {
            await window.ProductCategoryScope.renderSelector({
                containerId: `${summaryId}_simulator_panel_host`,
                itemType: 'product',
                inputClass: pageType === 'add' ? 'add1_product_modal__input' : 'edit-product-modal__input',
                mainLabel: 'محاكاة القسم الرئيسي',
                subLabel: 'محاكاة القسم الفرعي',
                preferredMainId: mainId,
                preferredSubId: subId,
                emptyMessage: 'لا توجد أقسام متاحة للمحاكاة.',
                skipGlobalState: true, // Don't overwrite actual ProductStateManager yet
                bypassFilter: true, // Show all categories for simulation
                onSync: async (simMainId, simSubId) => {
                    if (simMainId === mainId && simSubId === subId) return;
                    
                    const logMsg = `Simulating Category UI: ${simMainId} > ${simSubId}`;
                    if (window.ProductCategoryLogger) window.ProductCategoryLogger.info('Simulator', logMsg);
                    else console.log(`[ProductCategorySimulator] ${logMsg}`);

                    // Re-apply the page UI with the simulated IDs
                    if (pageType === 'add' && window.ProductCategoryPageCore?.applyAddPage) {
                        await window.ProductCategoryPageCore.applyAddPage(simMainId, simSubId);
                    } else if (pageType === 'edit' && window.ProductCategoryPageCore?.applyEditPage) {
                        await window.ProductCategoryPageCore.applyEditPage(simMainId, simSubId);
                    }
                }
            });
        }
    }

    internal.applyFormPageFields = applyFormPageFields;
    internal.renderFormSummary = renderFormSummary;
    internal.applyRequiredAttribute = applyRequiredAttribute;
    internal.clearHiddenFieldValue = clearHiddenFieldValue;
    internal.sortMappings = sortMappings;
})();
