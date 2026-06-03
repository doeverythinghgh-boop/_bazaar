/**
 * @file pages/products/shared/pharmacy/product-pharmacy-bridge.js
 * @description Pharmacy metadata bridge for the unified product add/edit/view pages.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function initProductPharmacyBridge(global) {
    const FIELD_PREFIX = 'productPharmacy_';
    let referenceDataPromise = null;

    function log(step, payload, level = 'log') {
        const method = console[level] || console.log;
        if (typeof payload === 'undefined') method.call(console, `[ProductPharmacyBridge] ${step}`);
        else method.call(console, `[ProductPharmacyBridge] ${step}`, payload);
    }

    function getParams() {
        return new URLSearchParams(global.location.search);
    }

    function isPharmacyRoute() {
        const params = getParams();
        return params.get('pharmacy') === '1' || params.get('source') === 'pharmacy' || !!params.get('pharmacy_product_id');
    }

    function normalizeCategoryId(value) {
        if (value == null || value === '') return '';
        return String(value);
    }

    function isPharmacyCategory(mainId, subId) {
        return normalizeCategoryId(mainId) === '20' && normalizeCategoryId(subId) === '204';
    }

    function getSelectedCategoryIds(productData = null) {
        const params = getParams();
        const stateSelection = global.ProductStateManager?.getSelectedCategories?.() || {};
        const mainSelect = document.getElementById('edit_category_display_main_select') || document.getElementById('add1_category_display_main_select');
        const subSelect = document.getElementById('edit_category_display_sub_select') || document.getElementById('add1_category_display_sub_select');

        const mainId = mainSelect?.value
            || params.get('MainCategory')
            || params.get('mainCategory')
            || productData?.MainCategory
            || productData?.mainCategory
            || stateSelection.mainId
            || null;
        const subId = subSelect?.value
            || params.get('SubCategory')
            || params.get('subCategory')
            || productData?.SubCategory
            || productData?.subCategory
            || stateSelection.subId
            || null;

        return {
            mainId: normalizeCategoryId(mainId),
            subId: normalizeCategoryId(subId)
        };
    }

    function hasExplicitNonPharmacyCategory(productData = null) {
        const category = getSelectedCategoryIds(productData);
        return !!(category.mainId && category.subId) && !isPharmacyCategory(category.mainId, category.subId);
    }

    function isPharmacyProfile(profile = null) {
        const category = getSelectedCategoryIds(profile);
        if (category.mainId || category.subId) {
            return isPharmacyCategory(category.mainId, category.subId);
        }
        return isPharmacyRoute()
            || profile?.meta?.domain === 'pharmacy'
            || profile?.submit?.pharmacyMetadata === true
            || profile?.profileKey === 'pharmacy_product_profile';
    }

    function isPharmacyProduct(productData = null) {
        // URL param pharmacy=1 is an explicit override — always trust it.
        // This check must come FIRST, before hasExplicitNonPharmacyCategory().
        // Root cause: when a pharmacy merchant product (e.g. PHARM_PROD_*) is fetched
        // from Firestore, its stored MainCategory/SubCategory values may differ from
        // the canonical pharmacy IDs (20/204). Without this guard, hasExplicitNonPharmacyCategory
        // would return true and cause isPharmacyRoute() to be skipped entirely, making
        // the product appear as a non-pharmacy item even though the URL explicitly says otherwise.
        if (isPharmacyRoute()) return true;
        // If the product has an explicit, non-pharmacy category, skip pharmacy treatment.
        if (hasExplicitNonPharmacyCategory(productData)) return false;
        const category = getSelectedCategoryIds(productData);
        if (category.mainId || category.subId) {
            return isPharmacyCategory(category.mainId, category.subId);
        }
        // Fall back to metadata flags when no category selection is available.
        return productData?.pharmacy_metadata === true
            || productData?.pharmacyMetadata === true
            || productData?.categoryProfileKey === 'pharmacy_product_profile'
            || productData?.itemTypeKey === 'pharmacy_product_profile';
    }

    function text(key, fallback) {
        if (typeof global.langu !== 'function') return fallback;
        const translated = global.langu(key);
        return translated && translated !== key ? translated : fallback;
    }

    function getValue(id) {
        const el = document.getElementById(`${FIELD_PREFIX}${id}`);
        if (!el) return '';
        if (el.type === 'checkbox') return el.checked;
        return String(el.value || '').trim();
    }

    function setValue(id, value) {
        const el = document.getElementById(`${FIELD_PREFIX}${id}`);
        if (!el) return;
        if (el.type === 'checkbox') {
            el.checked = value === true || value === 1 || value === '1';
            return;
        }
        el.value = value == null ? '' : value;
    }

    function parseMaybeJson(value, fallback = []) {
        if (Array.isArray(value)) return value;
        if (!value) return fallback;
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : fallback;
        } catch (_) {
            return fallback;
        }
    }

    function splitImageNames(value) {
        if (Array.isArray(value)) return value;
        if (!value) return [];
        return String(value).split(',');
    }

    function normalizeImageNames(value) {
        return splitImageNames(value)
            .map((item) => String(item || '').trim())
            .filter(Boolean)
            .join(',');
    }

    function buildImageSrc(imageNames) {
        return splitImageNames(imageNames)
            .map((name) => String(name || '').trim())
            .filter(Boolean)
            .map((name) => (typeof global.getPublicR2FileUrl === 'function' ? global.getPublicR2FileUrl(name) : name))
            .filter(Boolean);
    }

    function normalizeRefValue(value) {
        if (!value) return '';
        if (typeof value === 'string') return value;
        return value.ar || value.en || value.name_ar || value.name_en || '';
    }

    async function loadReferenceData() {
        if (!referenceDataPromise) {
            referenceDataPromise = fetch('/shared/pharmList/reference_data.json')
                .then((response) => response.ok ? response.json() : {})
                .catch((error) => {
                    console.warn('[ProductPharmacyBridge] Failed to load reference data:', error);
                    return {};
                });
        }
        return referenceDataPromise;
    }

    function getPharmacyProductKey(productData = null) {
        const params = getParams();
        return params.get('pharmacy_product_id') || params.get('product_key') || params.get('key') || params.get('id') || productData?.product_key || productData?.id || null;
    }

    function getCachedCatalogProduct(productId, merchantKey = '') {
        if (!productId || typeof LocalDBSession === 'undefined') return null;
        let cached = null;
        try {
            cached = JSON.parse(LocalDBSession.getItem(`pharmacy_view_${productId}`) || 'null');
        } catch (_) {
            cached = null;
        }

        const item = cached?.item || null;
        const merchant = cached?.merchant || null;
        if (!item) return null;

        const name = item.name_ar || item.title_ar || item.name_en || item.title_en || item.title || '';
        const description = item.description_ar || item.description_en || item.description || '';
        return {
            product_key: item.id || productId,
            productName: name,
            product_description: description,
            description,
            product_price: Number(item.price || 0),
            pricePerItem: Number(item.price || 0),
            product_quantity: Number(item.stock_quantity || 100),
            availableQuantity: Number(item.stock_quantity || 100),
            ImageName: item.renderedImgUrl || item.image_url || item.image || item.image_names || '',
            user_key: merchantKey || merchant?.user_key,
            sellerName: merchant?.username || merchant?.full_name || merchant?.displayName || '',
            MainCategory: '20',
            SubCategory: '204',
            pharmacy_catalog_main_id: item.mainId || item.MainCategory || '',
            pharmacy_catalog_sub_id: item.subId || item.SubCategory || '',
            serviceType: '0',
            pharmacy_metadata: true,
            pharmacyMetadata: true,
            pharmacyCatalogItem: item
        };
    }

    function normalizeCatalogImagePath(path) {
        const imagePath = String(path || '').trim();
        if (!imagePath) return '';
        if (/^(https?:)?\/\//i.test(imagePath) || imagePath.startsWith('/')) return imagePath;
        return `/${imagePath}`;
    }

    function buildCatalogLegacyProduct(item, productId, merchantKey, mainCat, subCat) {
        if (!item || !productId) return null;
        const catalogItem = {
            ...item,
            id: String(productId),
            mainId: String(mainCat?.id || ''),
            subId: String(subCat?.id || ''),
            mainTitle: mainCat?.title || mainCat?.name_ar || mainCat?.name_en || '',
            subTitle: subCat?.title || subCat?.name_ar || subCat?.name_en || '',
            renderedImgUrl: normalizeCatalogImagePath(item.renderedImgUrl || item.image_url || item.image || item.image_names)
        };
        const name = item.name_ar || item.title_ar || item.name_en || item.title_en || item.title || '';
        const description = item.description_ar || item.description_en || item.description || '';
        return {
            product_key: String(productId),
            productName: name,
            product_description: description,
            description,
            product_price: Number(item.price || 0),
            pricePerItem: Number(item.price || 0),
            product_quantity: Number(item.stock_quantity || 100),
            availableQuantity: Number(item.stock_quantity || 100),
            ImageName: catalogItem.renderedImgUrl,
            user_key: merchantKey || '',
            sellerName: '',
            MainCategory: '20',
            SubCategory: '204',
            pharmacy_catalog_main_id: catalogItem.mainId,
            pharmacy_catalog_sub_id: catalogItem.subId,
            serviceType: '0',
            pharmacy_metadata: true,
            pharmacyMetadata: true,
            pharmacyCatalogItem: catalogItem
        };
    }

    async function getStaticCatalogProduct(productId, merchantKey = '') {
        const cleanId = String(Array.isArray(productId) ? productId[0] : productId || '').trim();
        if (!cleanId || typeof fetch !== 'function') return null;

        const mainFileId = cleanId.length > 5 ? cleanId.slice(0, -5) : '';
        if (!mainFileId) return null;

        try {
            const response = await fetch(`/shared/pharmList/${encodeURIComponent(mainFileId)}.json`);
            if (!response.ok) return null;
            const mainCat = await response.json();
            const subCategories = Array.isArray(mainCat?.sub) ? mainCat.sub : [];
            for (const subCat of subCategories) {
                const ingredients = Array.isArray(subCat?.active_ingredients) ? subCat.active_ingredients : [];
                const match = ingredients.find((item) => {
                    const ids = Array.isArray(item?.id) ? item.id : [item?.id];
                    return ids.some((id) => String(id) === cleanId);
                });
                if (match) return buildCatalogLegacyProduct(match, cleanId, merchantKey, mainCat, subCat);
            }
        } catch (error) {
            console.warn('[ProductPharmacyBridge] Failed to load static catalog product:', error);
        }

        return null;
    }

    async function fetchMetadata(productId = null) {
        const activeId = productId || getPharmacyProductKey();
        if (!activeId || typeof global.apiFetch !== 'function') return null;
        const result = await global.apiFetch(`/api/pharmacy/product-metadata?product_id=${encodeURIComponent(activeId)}`, {
            specialHandlers: {
                404: () => null
            }
        });
        return result && !result.error ? result : null;
    }

    function createField(id, label, inputHtml) {
        return `
            <div class="productPharmacy_field" id="${FIELD_PREFIX}${id}_group">
                <label class="productPharmacy_label" for="${FIELD_PREFIX}${id}">${label}</label>
                ${inputHtml}
            </div>
        `;
    }

    function renderCheckGrid(id, title) {
        return `
            <div class="productPharmacy_field productPharmacy_field_full" id="${FIELD_PREFIX}${id}_group">
                <div class="productPharmacy_label">${title}</div>
                <div class="productPharmacy_check_grid" id="${FIELD_PREFIX}${id}"></div>
            </div>
        `;
    }

    function ensureStyles() {
        if (document.getElementById('productPharmacy_styles')) return;
        const style = document.createElement('style');
        style.id = 'productPharmacy_styles';
        style.textContent = `
            .productPharmacy_panel{margin-top:16px;padding:14px;border:1px solid rgba(11,94,215,.14);border-radius:12px;background:rgba(11,94,215,.04)}
            .productPharmacy_title{margin:0 0 12px;font-weight:800;color:var(--primary-color,#0b5ed7);display:flex;align-items:center;gap:8px}
            .productPharmacy_grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
            .productPharmacy_field_full{grid-column:1/-1}
            .productPharmacy_label{display:block;margin-bottom:6px;font-weight:700;color:var(--text-color,#1f2937);font-size:.9rem}
            .productPharmacy_input{width:100%;box-sizing:border-box;border:1px solid rgba(0,0,0,.16);border-radius:10px;padding:10px 12px;background:var(--input-bg,#fff);color:var(--text-color,#111827)}
            .productPharmacy_check_grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px}
            .productPharmacy_check_item{display:flex;align-items:center;gap:6px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.65);border:1px solid rgba(0,0,0,.08)}
            .productPharmacy_meta_grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-top:12px}
            .productPharmacy_meta_item{padding:10px 12px;border-radius:10px;background:rgba(11,94,215,.06);border:1px solid rgba(11,94,215,.1)}
            .productPharmacy_meta_label{font-size:.78rem;font-weight:800;color:#0b5ed7;margin-bottom:4px}
            .productPharmacy_rx_badge{display:inline-flex;align-items:center;gap:6px;margin-top:10px;padding:8px 12px;border-radius:999px;background:#fff1f2;color:#be123c;font-weight:800}
            @media (max-width:700px){.productPharmacy_grid{grid-template-columns:1fr}}
        `;
        document.head.appendChild(style);
    }

    async function renderCheckboxes(containerId, itemsObj, selectedValues = []) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const selected = new Set((Array.isArray(selectedValues) ? selectedValues : [selectedValues]).map(String));
        container.innerHTML = '';
        Object.entries(itemsObj || {}).forEach(([key, val]) => {
            const label = normalizeRefValue(val) || key;
            const item = document.createElement('label');
            item.className = 'productPharmacy_check_item';
            item.innerHTML = `<input type="checkbox" value="${key}"><span>${label}</span>`;
            const input = item.querySelector('input');
            input.checked = selected.has(String(key));
            container.appendChild(item);
        });
    }

    async function ensureFormFields(pageType, profile = null) {
        if (!isPharmacyProfile(profile)) return;
        ensureStyles();
        const host = document.getElementById(pageType === 'add' ? 'add1_advanced_options_content' : 'edit_advanced_options_content');
        if (!host || document.getElementById('productPharmacy_panel')) return;

        const inputClass = 'productPharmacy_input';
        const panel = document.createElement('div');
        panel.id = 'productPharmacy_panel';
        panel.className = 'productPharmacy_panel';
        panel.innerHTML = `
            <h3 class="productPharmacy_title"><i class="fas fa-prescription-bottle-medical"></i>${text('pharmacy_ctrl_tab_add_product', 'بيانات الصيدلية')}</h3>
            <div class="productPharmacy_grid">
                ${createField('nameEn', text('pharmacy_add_name_en_label', 'اسم المنتج (إنجليزي)'), `<input id="${FIELD_PREFIX}nameEn" class="${inputClass}" type="text">`)}
                ${createField('discount', text('pharmacy_add_discount_label', 'نسبة الخصم %'), `<input id="${FIELD_PREFIX}discount" class="${inputClass}" type="number" min="0" step="0.5" value="0">`)}
                ${createField('brandAr', text('pharmacy_add_brand_ar_label', 'العلامة التجارية (عربي)'), `<input id="${FIELD_PREFIX}brandAr" class="${inputClass}" type="text">`)}
                ${createField('brandEn', text('pharmacy_add_brand_en_label', 'العلامة التجارية (إنجليزي)'), `<input id="${FIELD_PREFIX}brandEn" class="${inputClass}" type="text">`)}
                ${createField('manufacturer', text('pharmacy_add_manufacturer_label', 'الشركة المصنعة'), `<input id="${FIELD_PREFIX}manufacturer" class="${inputClass}" type="text">`)}
                ${createField('barcode', text('pharmacy_barcode_label_hint', 'الباركود'), `<input id="${FIELD_PREFIX}barcode" class="${inputClass}" type="text" autocomplete="off">`)}
                ${createField('status', text('pharmacy_add_status_label', 'حالة توفر المنتج'), `<select id="${FIELD_PREFIX}status" class="${inputClass}"><option value="1">${text('pharmacy_add_status_avail', 'متوفر ظاهرياً للبيع')}</option><option value="0">${text('pharmacy_add_status_hidden', 'مخفي غير متاح')}</option></select>`)}
                ${createField('rx', text('pharmacy_add_rx_label', 'هذا المنتج يحتاج إلى وصفة طبية'), `<input id="${FIELD_PREFIX}rx" type="checkbox">`)}
                ${renderCheckGrid('forms', text('pharmacy_add_form_label', 'شكل الدواء'))}
                ${renderCheckGrid('strengths', text('pharmacy_add_strength_label', 'التركيز'))}
                ${createField('ingredients', text('pharmacy_add_ingredients_label', 'المادة الفعالة'), `<input id="${FIELD_PREFIX}ingredients" class="${inputClass}" type="text" placeholder="${text('pharmacy_ingredients_placeholder', 'مثال: باراسيتامول (مفصولة بفاصلة)')}">`)}
            </div>
        `;
        host.appendChild(panel);

        const refs = await loadReferenceData();
        await renderCheckboxes(`${FIELD_PREFIX}forms`, refs.forms || {});
        await renderCheckboxes(`${FIELD_PREFIX}strengths`, refs.strengths || {});
    }

    function collectChecked(containerId) {
        return Array.from(document.querySelectorAll(`#${containerId} input:checked`)).map((item) => item.value);
    }

    function collectMetadata(productData) {
        const ingredients = getValue('ingredients')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((name) => ({ name_ar: name, name_en: name }));

        return {
            product_id: productData.product_key,
            merchant_key: productData.user_key,
            main_category_id: productData.MainCategory || null,
            sub_category_id: productData.SubCategory || null,
            name_ar: productData.productName || '',
            name_en: getValue('nameEn') || null,
            price: productData.product_price ?? productData.pricePerItem ?? 0,
            discount: getValue('discount') || 0,
            stock_quantity: productData.product_quantity ?? productData.availableQuantity ?? 100,
            status: getValue('status') || 1,
            description: productData.product_description || productData.description || null,
            is_prescription_required: getValue('rx') === true,
            image_names: productData.ImageName || null,
            form_ref: collectChecked(`${FIELD_PREFIX}forms`),
            strength_ref: collectChecked(`${FIELD_PREFIX}strengths`),
            active_ingredients: ingredients.length ? ingredients : null,
            brand_ar: getValue('brandAr') || null,
            brand_en: getValue('brandEn') || null,
            barcode: getValue('barcode') || null,
            manufacturer: getValue('manufacturer') || null
        };
    }

    async function saveMetadata(productData, mode = 'POST') {
        if (!isPharmacyProduct(productData)) return null;
        const payload = collectMetadata(productData);
        if (!payload.merchant_key || !payload.name_ar) return null;
        log('save-metadata-start', { productId: payload.product_id, mode });
        const response = await global.apiFetch('/api/pharmacy/product-metadata', {
            method: mode,
            body: payload
        });
        if (mode === 'PUT' && response?.error) {
            log('save-metadata-update-missing-fallback-create', { productId: payload.product_id }, 'warn');
            const fallbackResponse = await global.apiFetch('/api/pharmacy/product-metadata', {
                method: 'POST',
                body: payload
            });
            if (fallbackResponse?.error) throw new Error(fallbackResponse.error);
            log('save-metadata-complete', { productId: payload.product_id });
            return fallbackResponse;
        }
        if (response?.error) throw new Error(response.error);
        log('save-metadata-complete', { productId: payload.product_id });
        return response;
    }

    async function deleteMetadata(productData) {
        const productId = getPharmacyProductKey(productData);
        const merchantKey = productData?.user_key || getParams().get('provider_key') || getParams().get('m') || getParams().get('merchant_key');
        if (!productId || !merchantKey || typeof global.apiFetch !== 'function') return null;
        return global.apiFetch(`/api/pharmacy/product-metadata?product_id=${encodeURIComponent(productId)}&merchant_key=${encodeURIComponent(merchantKey)}`, {
            method: 'DELETE'
        });
    }

    async function prefillForm(productData) {
        if (!isPharmacyProduct(productData)) return;
        const metadata = await fetchMetadata(productData?.product_key);
        if (!metadata) return;
        await ensureFormFields(document.body?.id === 'product-add-page' ? 'add' : 'edit', { meta: { domain: 'pharmacy' } });
        setValue('nameEn', metadata.name_en || '');
        setValue('discount', metadata.discount || 0);
        setValue('brandAr', metadata.brand_ar || '');
        setValue('brandEn', metadata.brand_en || '');
        setValue('manufacturer', metadata.manufacturer || '');
        setValue('barcode', metadata.barcode || '');
        setValue('status', metadata.status ?? 1);
        setValue('rx', metadata.is_prescription_required);
        const activeIngredients = parseMaybeJson(metadata.active_ingredients, []);
        setValue('ingredients', activeIngredients.map((item) => typeof item === 'string' ? item : (item.name_ar || item.name_en || '')).filter(Boolean).join(', '));
        const refs = await loadReferenceData();
        await renderCheckboxes(`${FIELD_PREFIX}forms`, refs.forms || {}, parseMaybeJson(metadata.form_ref, []));
        await renderCheckboxes(`${FIELD_PREFIX}strengths`, refs.strengths || {}, parseMaybeJson(metadata.strength_ref, []));
    }

    async function renderView(productData, dom = {}) {
        const catalogItem = productData?.pharmacyCatalogItem || null;
        if (!catalogItem && !isPharmacyProduct(productData)) return;
        const metadata = catalogItem ? null : await fetchMetadata(productData?.product_key);
        if (!metadata && !catalogItem) return;
        if (productData) enrichProductWithMetadata(productData, metadata || catalogItem);
        if (metadata && productData) productData.pharmacy_metadata = true;
        ensureStyles();
        const data = metadata || catalogItem || {};
        const host = document.getElementById('productView_info_grid');
        if (!host || document.getElementById('productPharmacy_view_panel')) return;
        const refs = await loadReferenceData();
        const forms = parseMaybeJson(data.form_ref, []).map((key) => normalizeRefValue(refs.forms?.[key]) || key).join('، ');
        const strengths = parseMaybeJson(data.strength_ref, []).map((key) => normalizeRefValue(refs.strengths?.[key]) || key).join('، ');
        const ingredientsSource = data.active_ingredients_list || data.active_ingredients || [];
        const ingredients = parseMaybeJson(ingredientsSource, Array.isArray(ingredientsSource) ? ingredientsSource : [])
            .map((item) => typeof item === 'string' ? item : (item.name_ar || item.name_en || item.ar || item.en || ''))
            .filter(Boolean)
            .join('، ');
        // Render all available metadata fields dynamically. They will only be displayed if
        // the field contains a valid truthy/non-empty value (due to the filter below).
        const rows = [
            // Description / usage — shown when the metadata or catalog item carries a description field.
            [text('pharmacy_view_meta_description', 'وصف المنتج (الاستخدام والجرعة)'), data.description || data.description_ar || data.description_en || productData?.description || ''],
            [text('pharmacy_view_meta_name_en', 'الاسم بالإنجليزية'), data.name_en],
            [text('pharmacy_view_meta_active', 'المادة الفعالة'), ingredients],
            [text('pharmacy_view_meta_brand', 'العلامة التجارية'), data.brand_ar || data.brand_en],
            [text('pharmacy_view_meta_manufacturer', 'الشركة المصنعة'), data.manufacturer],
            [text('pharmacy_view_meta_form', 'شكل الدواء'), forms],
            [text('pharmacy_view_meta_strength', 'التركيز'), strengths],
            [text('pharmacy_view_meta_barcode', 'الباركود'), data.barcode],
            [text('pharmacy_view_meta_discount', 'نسبة الخصم'), (data.discount && Number(data.discount) > 0) ? `${data.discount}%` : ''],
            [text('pharmacy_view_meta_stock', 'الكمية المتاحة'), (data.stock_quantity !== undefined && data.stock_quantity !== null && data.stock_quantity !== '') ? `${data.stock_quantity}` : ''],
            [text('pharmacy_view_meta_status', 'حالة التوفر'), (data.status !== undefined && data.status !== null && data.status !== '') ? (Number(data.status) === 1 ? text('pharmacy_add_status_avail', 'متوفر ظاهرياً للبيع') : text('pharmacy_add_status_hidden', 'مخفي غير متاح')) : '']
        ].filter(([, value]) => value);
        if (!rows.length && !data.is_prescription_required) return;
        const panel = document.createElement('div');
        panel.id = 'productPharmacy_view_panel';
        panel.className = 'productView_info_item';
        // The productView_info_label header is intentionally omitted here.
        // Pharmacy metadata is injected directly into the product info grid without
        // a section title to keep the view clean and avoid showing an irrelevant label.
        panel.innerHTML = `
            ${data.is_prescription_required ? `<div class="productPharmacy_rx_badge"><i class="fas fa-file-prescription"></i>${text('pharmacy_view_rx_required', 'يحتاج إلى وصفة طبية')}</div>` : ''}
            <div class="productPharmacy_meta_grid">
                ${rows.map(([label, value]) => `<div class="productPharmacy_meta_item"><div class="productPharmacy_meta_label">${label}</div><div>${value}</div></div>`).join('')}
            </div>
        `;
        host.appendChild(panel);
    }

    function enrichProductWithMetadata(productData, metadata = null) {
        if (!productData || !metadata) return productData;
        const imageNames = normalizeImageNames(metadata.image_names || metadata.ImageName || metadata.image_url || metadata.image || '');
        if (imageNames && !normalizeImageNames(productData.ImageName || productData.image_names || productData.imageSrc).length) {
            productData.ImageName = imageNames;
            productData.image_name = imageNames;
            productData.imageSrc = buildImageSrc(imageNames);
            productData.image = productData.imageSrc[0] || productData.image || null;
        }
        productData.pharmacy_metadata = true;
        productData.pharmacyMetadata = true;
        productData.pharmacyCatalogItem = productData.pharmacyCatalogItem || null;
        productData.MainCategory = metadata.custom_main_cat_id || metadata.main_category_id || productData.MainCategory || '20';
        productData.SubCategory = metadata.custom_sub_cat_id || metadata.sub_category_id || productData.SubCategory || '204';
        if (productData.pharmacyCatalogItem || metadata.id || metadata.mainId || metadata.subId) {
            productData.MainCategory = '20';
            productData.SubCategory = '204';
            productData.pharmacy_catalog_main_id = productData.pharmacy_catalog_main_id || metadata.mainId || metadata.MainCategory || '';
            productData.pharmacy_catalog_sub_id = productData.pharmacy_catalog_sub_id || metadata.subId || metadata.SubCategory || '';
        }
        productData.pharmacy_name_en = productData.pharmacy_name_en || metadata.name_en || '';
        productData.pharmacy_brand_ar = productData.pharmacy_brand_ar || metadata.brand_ar || '';
        productData.pharmacy_brand_en = productData.pharmacy_brand_en || metadata.brand_en || '';
        productData.pharmacy_barcode = productData.pharmacy_barcode || metadata.barcode || '';
        productData.pharmacy_manufacturer = productData.pharmacy_manufacturer || metadata.manufacturer || '';
        productData.pharmacy_discount = productData.pharmacy_discount ?? metadata.discount ?? 0;
        productData.pharmacy_status = productData.pharmacy_status ?? metadata.status ?? 1;
        productData.pharmacy_rx_required = productData.pharmacy_rx_required ?? metadata.is_prescription_required ?? false;
        productData.pharmacy_form_ref = productData.pharmacy_form_ref || metadata.form_ref || [];
        productData.pharmacy_strength_ref = productData.pharmacy_strength_ref || metadata.strength_ref || [];
        productData.pharmacy_active_ingredients = productData.pharmacy_active_ingredients || metadata.active_ingredients || metadata.active_ingredients_list || [];
        if (!productData.productName && (metadata.name_ar || metadata.name_en)) productData.productName = metadata.name_ar || metadata.name_en;
        if (!productData.description && metadata.description) productData.description = metadata.description;
        if (!productData.product_description && metadata.description) productData.product_description = metadata.description;
        return productData;
    }

    async function enrichProduct(productData) {
        if (!isPharmacyProduct(productData)) return productData;
        if (productData?.pharmacyCatalogItem) return enrichProductWithMetadata(productData, productData.pharmacyCatalogItem);
        const metadata = await fetchMetadata(productData?.product_key);
        if (metadata) return enrichProductWithMetadata(productData, metadata);
        return productData;
    }

    async function buildLegacyProduct(productId, merchantKey) {
        const cachedCatalogProduct = getCachedCatalogProduct(productId, merchantKey);
        if (cachedCatalogProduct) return cachedCatalogProduct;

        const staticCatalogProduct = await getStaticCatalogProduct(productId, merchantKey);
        if (staticCatalogProduct) return staticCatalogProduct;

        const metadata = await fetchMetadata(productId);
        if (!metadata) {
            return null;
        }
        return {
            product_key: metadata.product_id,
            productName: metadata.name_ar || metadata.name_en || '',
            product_description: metadata.description || '',
            description: metadata.description || '',
            product_price: Number(metadata.price || 0),
            pricePerItem: Number(metadata.price || 0),
            product_quantity: Number(metadata.stock_quantity || 0),
            availableQuantity: Number(metadata.stock_quantity || 0),
            ImageName: metadata.image_names || '',
            user_key: merchantKey || metadata.user_key,
            MainCategory: metadata.custom_main_cat_id || metadata.main_category_id || '20',
            SubCategory: metadata.custom_sub_cat_id || metadata.sub_category_id || '204',
            serviceType: '0',
            pharmacy_metadata: true
        };
    }

    global.ProductPharmacyBridge = {
        buildLegacyProduct,
        deleteMetadata,
        ensureFormFields,
        fetchMetadata,
        enrichProduct,
        getSelectedCategoryIds,
        isPharmacyCategory,
        isPharmacyProduct,
        isPharmacyProfile,
        prefillForm,
        renderView,
        saveMetadata
    };
})(window);
