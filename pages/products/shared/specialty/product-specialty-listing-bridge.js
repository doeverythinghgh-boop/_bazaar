/**
 * @file pages/products/shared/specialty/product-specialty-listing-bridge.js
 * @description Bridge for rendering and saving legacy car and real-estate listings through unified product pages.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */

(function initProductSpecialtyListingBridge(global) {
    const PREFIX = 'productSpecialty_';
    const TYPE_CONFIG = {
        car: {
            profileKey: 'car_listing_profile',
            itemType: 'car',
            flag: 'is_car_listing',
            queryKey: 'car_key',
            apiPath: '/api/cars',
            title: 'بيانات السيارة',
            icon: 'fas fa-car',
            mainCategory: '7',
            defaultSubCategory: '1',
            imageField: 'car_image_names',
            dataBase: '/pages/cars/',
            selectGroups: [
                { id: 'brands', label: 'ماركة السيارة', file: 'data/brands.json', icon: 'fa-car', tight: true },
                { id: 'body_types', label: 'نوع الهيكل', file: 'data/body_types.json', icon: 'fa-car-side', tight: true },
                { id: 'fuel_types', label: 'نوع الوقود', file: 'data/fuel_types.json', icon: 'fa-gas-pump', compact: true },
                { id: 'transmission_types', label: 'ناقل الحركة', file: 'data/transmission_types.json', icon: 'fa-cogs', compact: true },
                { id: 'car_conditions', label: 'حالة السيارة', file: 'data/car_conditions.json', icon: 'fa-star', compact: true },
                { id: 'special_types', label: 'تصنيفات خاصة', file: 'data/special_types.json', icon: 'fa-tag', compact: true }
            ],
            fields: [
                { id: 'year', label: 'سنة الصنع', type: 'number', placeholder: '2024', required: true },
                { id: 'price', source: 'productPrice' },
                { id: 'notes', source: 'description' }
            ]
        },
        real_estate: {
            profileKey: 'real_estate_listing_profile',
            itemType: 'real_estate',
            flag: 'is_real_estate_listing',
            queryKey: 'real_estate_key',
            apiPath: '/api/real-estate',
            title: 'بيانات العقار',
            icon: 'fas fa-building',
            mainCategory: '16',
            defaultSubCategory: '1',
            imageField: 'image_names',
            dataBase: '/pages/real-estate/',
            selectGroups: [
                { id: 'property_types', label: 'نوع العقار', file: 'data/property_types.json', icon: 'fa-building', tight: true },
                { id: 'offer_types', label: 'نوع العرض', file: 'data/offer_types.json', icon: 'fa-tag', compact: true },
                { id: 'finishing_types', label: 'التشطيب', file: 'data/finishing_types.json', icon: 'fa-paint-roller', compact: true }
            ],
            fields: [
                { id: 'area_sqm', label: 'المساحة (م²)', type: 'number', placeholder: '100', required: true },
                { id: 'rooms', label: 'عدد الغرف', type: 'number', placeholder: '3' },
                { id: 'bathrooms', label: 'عدد الحمامات', type: 'number', placeholder: '2' },
                { id: 'floor_level', label: 'الطابق (للمباني)', type: 'number', placeholder: '1' },
                { id: 'address', label: 'العنوان', type: 'text', placeholder: 'العنوان التفصيلي للعقار', full: true },
                { id: 'location_lat', label: 'خط العرض', type: 'hidden', hidden: true },
                { id: 'location_lng', label: 'خط الطول', type: 'hidden', hidden: true },
                { id: 'price', source: 'productPrice' },
                { id: 'notes', source: 'description' }
            ]
        }
    };

    const optionCache = {};

    function log(step, payload, level = 'log') {
        const method = console[level] || console.log;
        if (typeof payload === 'undefined') method.call(console, `[ProductSpecialtyBridge] ${step}`);
        else method.call(console, `[ProductSpecialtyBridge] ${step}`, payload);
    }

    function params() {
        return new URLSearchParams(global.location.search);
    }

    function normalizeType(value) {
        const raw = String(value || '').trim().toLowerCase();
        if (raw === 'cars' || raw === 'car') return 'car';
        if (raw === 'real-estate' || raw === 'real_estate' || raw === 'realestate') return 'real_estate';
        return '';
    }

    function getRouteType() {
        return normalizeType(params().get('listing') || params().get('listing_type') || params().get('source'));
    }

    function getProductType(productData = null) {
        if (productData?._source === 'car' || productData?.is_car_listing || productData?.item_type === 'car' || productData?.car_key) return 'car';
        if (productData?._source === 'real_estate' || productData?.is_real_estate_listing || productData?.item_type === 'real_estate' || productData?.real_estate_key) return 'real_estate';
        return getRouteType();
    }

    function getConfig(typeOrProduct = null) {
        const type = typeof typeOrProduct === 'string' ? normalizeType(typeOrProduct) : getProductType(typeOrProduct);
        return TYPE_CONFIG[type] || null;
    }

    function isSpecialtyRoute() {
        return !!getRouteType();
    }

    function isSpecialtyProduct(productData = null) {
        const activeProduct = productData || global.ProductStateManager?.getCurrentProduct?.() || null;
        return !!getConfig(activeProduct);
    }

    function isSpecialtyProfile(profile = null) {
        if (isSpecialtyRoute()) return true;
        return profile?.profileKey === 'car_listing_profile'
            || profile?.profileKey === 'real_estate_listing_profile'
            || profile?.meta?.domain === 'cars'
            || profile?.meta?.domain === 'real_estate';
    }

    function getSpecialtyProfileKey(profile = null, productData = null) {
        const cfg = getConfig(productData) || getConfig(getRouteType());
        return cfg?.profileKey || profile?.profileKey || null;
    }

    function ensureStyles() {
        if (document.getElementById('productSpecialty_styles')) return;
        const style = document.createElement('style');
        style.id = 'productSpecialty_styles';
        style.textContent = `
            .productSpecialty_panel{margin-top:16px}
            .productSpecialty_title{margin:0 0 12px;font-weight:800;color:var(--primary-color,#0b5ed7);display:flex;align-items:center;gap:8px}
            .productSpecialty_grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
            .productSpecialty_field_full{grid-column:1/-1}
            .productSpecialty_label{display:block;margin-bottom:6px;font-weight:700;color:var(--text-color,#1f2937);font-size:.9rem}
            .productSpecialty_input{width:100%;box-sizing:border-box;border:1px solid rgba(0,0,0,.16);border-radius:10px;padding:10px 12px;background:var(--input-bg,#fff);color:var(--text-color,#111827)}
            .productSpecialty_details_section,.productSpecialty_category_section{background:rgba(255,255,255,.8);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);padding:15px;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.03);border:1px solid rgba(255,255,255,.3);margin-bottom:10px}
            .productSpecialty_category_section.is-collapsed .productSpecialty_items_grid{display:none}
            .productSpecialty_category_title{font-size:1rem;font-weight:700;margin:0;color:#1a2a44;display:flex;justify-content:space-between;align-items:center;cursor:pointer;user-select:none;padding:5px 0}
            .productSpecialty_title_content{display:flex;align-items:center;gap:12px;min-width:0}
            .productSpecialty_category_icon{width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:var(--primary-color-light,rgba(11,94,215,.08));color:var(--primary-color,#0b5ed7);border-radius:8px;font-size:.9rem}
            .productSpecialty_preview{font-size:.75rem;font-weight:500;color:var(--primary-color,#0b5ed7);background:var(--primary-color-light,rgba(11,94,215,.08));padding:2px 10px;border-radius:20px;opacity:0;transform:scale(.8);pointer-events:none;white-space:nowrap}
            .productSpecialty_preview.visible{opacity:1;transform:scale(1);margin-right:8px}
            .productSpecialty_category_title::after{content:'\\f107';font-family:'Font Awesome 5 Free';font-weight:900;font-size:.9rem;color:#888;transition:transform .3s ease}
            .productSpecialty_category_section:not(.is-collapsed) .productSpecialty_category_title::after{transform:rotate(180deg)}
            .productSpecialty_items_grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-height:235px;overflow-y:auto;padding:15px 5px 5px 5px;scrollbar-width:thin;scrollbar-color:var(--primary-color,#0b5ed7) transparent}
            .productSpecialty_items_grid::-webkit-scrollbar{width:4px}
            .productSpecialty_items_grid::-webkit-scrollbar-thumb{background-color:var(--primary-color,#0b5ed7);border-radius:10px}
            .productSpecialty_items_grid.tight-grid{max-height:220px}
            .productSpecialty_item_card{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 5px;border:1px solid rgba(0,0,0,.05);border-radius:12px;background:#fff;cursor:pointer;transition:all .2s ease;gap:6px;text-align:center;min-height:100px}
            .productSpecialty_item_card.selected{border-color:var(--primary-color,#0b5ed7);background-color:var(--primary-color-light,rgba(11,94,215,.08));box-shadow:var(--shadow-interactive,0 4px 14px rgba(11,94,215,.12))}
            .productSpecialty_item_card img{width:40px;height:40px;object-fit:contain;flex-shrink:0}
            .productSpecialty_item_card input[type="radio"]{width:12px;height:12px;cursor:pointer;accent-color:var(--primary-color,#0b5ed7);flex-shrink:0;margin:0}
            .productSpecialty_item_name{font-size:.65rem;font-weight:600;color:var(--text-color-dark,#1a2a44);width:100%;word-break:break-word;line-height:1.2}
            .productSpecialty_item_card.fuel-card{flex-direction:row;min-height:auto;padding:5px 10px;width:fit-content;justify-self:start;gap:8px}
            .productSpecialty_item_card.tight-card{padding:4px 2px;gap:2px;min-height:80px}
            .productSpecialty_item_card.fuel-card .productSpecialty_item_name{text-align:right;white-space:nowrap;width:auto}
            .productSpecialty_meta_grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:12px}
            .productSpecialty_meta_item{padding:10px 12px;border-radius:10px;background:rgba(11,94,215,.06);border:1px solid rgba(11,94,215,.1)}
            .productSpecialty_meta_label{font-size:.78rem;font-weight:800;color:#0b5ed7;margin-bottom:4px}
            @media (min-width:600px){.productSpecialty_items_grid{grid-template-columns:repeat(auto-fill,minmax(110px,1fr));max-height:450px}.productSpecialty_items_grid.tight-grid{max-height:260px}}
            @media (max-width:700px){.productSpecialty_grid{grid-template-columns:1fr}}
        `;
        document.head.appendChild(style);
    }

    async function loadOptions(cfg, group) {
        const cacheKey = `${cfg.itemType}:${group.id}`;
        if (optionCache[cacheKey]) return optionCache[cacheKey];
        const url = `${cfg.dataBase}${group.file}`;
        try {
            const response = await fetch(url);
            const data = response.ok ? await response.json() : [];
            const list = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : Object.entries(data || {}).map(([id, value]) => ({ id, ...value })));
            optionCache[cacheKey] = list;
            return list;
        } catch (error) {
            console.warn('[ProductSpecialtyBridge] Failed to load options:', { url, error });
            optionCache[cacheKey] = [];
            return [];
        }
    }

    function optionLabel(item) {
        if (!item) return '';
        return item.title_ar || item.name_ar || item.ar || item.title || item.name || item.title_en || item.name_en || item.en || String(item.id || '');
    }

    function optionImage(cfg, item) {
        const image = item?.image || item?.icon_image || '';
        if (!image) return '';
        if (/^(https?:)?\/\//i.test(image) || image.startsWith('/')) return image;
        return `${cfg.dataBase}${image}`;
    }

    function createField(field, cfg) {
        const id = `${PREFIX}${field.id}`;
        const full = field.full ? ' productSpecialty_field_full' : '';
        const step = field.step ? ` step="${field.step}"` : '';
        return `
            <div class="productSpecialty_field${full}" id="${id}_group">
                <label class="productSpecialty_label" for="${id}">${field.label}</label>
                <input id="${id}" class="productSpecialty_input" type="${field.type || 'text'}" placeholder="${field.placeholder || ''}"${step}>
            </div>
        `;
    }

    async function ensureFormFields(pageType, profile = null) {
        const cfg = getConfig();
        if (!cfg) return;
        ensureStyles();

        const host = document.getElementById(pageType === 'add' ? 'add1_product_form' : 'edit-product-form');
        if (!host || document.getElementById('productSpecialty_panel')) return;

        const panel = document.createElement('div');
        panel.id = 'productSpecialty_panel';
        panel.className = 'productSpecialty_panel';
        const fieldsHtml = cfg.fields
            .filter((field) => !field.source && !field.hidden)
            .map((field) => createField(field, cfg))
            .join('');
        const hiddenFieldsHtml = cfg.fields
            .filter((field) => field.hidden)
            .map((field) => `<input id="${PREFIX}${field.id}" type="hidden">`)
            .join('');
        const mapHtml = cfg.itemType === 'real_estate'
            ? `
                <div class="productSpecialty_field productSpecialty_field_full" id="productSpecialty_map_group">
                    <label class="productSpecialty_label" for="productSpecialty_location_iframe">اختر موقعاً</label>
                    <div style="height:250px;width:100%;border-radius:8px;overflow:hidden;border:1px solid rgba(0,0,0,.16);margin-top:5px;">
                        <iframe id="productSpecialty_location_iframe" src="/location/LOCATION.html?embedded=true&hideSave=true&v=initial" style="width:100%;height:100%;border:none;"></iframe>
                    </div>
                    ${hiddenFieldsHtml}
                </div>
            `
            : hiddenFieldsHtml;
        const sectionsHtml = cfg.selectGroups.map((group, index) => `
            <section class="productSpecialty_category_section ${index === 0 ? '' : 'is-collapsed'}" id="${PREFIX}${group.id}_group">
                <h2 class="productSpecialty_category_title" data-group="${group.id}">
                    <span class="productSpecialty_title_content">
                        <i class="fas ${group.icon || 'fa-folder'} productSpecialty_category_icon"></i>
                        <span>${group.label}</span>
                        <span class="productSpecialty_preview" id="${PREFIX}${group.id}_preview"></span>
                    </span>
                </h2>
                <div id="${PREFIX}${group.id}_grid" class="productSpecialty_items_grid ${group.tight ? 'tight-grid' : ''}"></div>
                <input id="${PREFIX}${group.id}" type="hidden">
            </section>
        `).join('');

        panel.innerHTML = `
            <h3 class="productSpecialty_title"><i class="${cfg.icon}"></i>${cfg.title}</h3>
            <div class="productSpecialty_details_section">
                <div class="productSpecialty_grid">${fieldsHtml}${mapHtml}</div>
            </div>
            ${sectionsHtml}
        `;
        const anchor = document.getElementById(pageType === 'add' ? 'add1_advanced_options_container' : 'edit_advanced_options_container');
        if (anchor && anchor.parentElement === host) host.insertBefore(panel, anchor);
        else host.appendChild(panel);
        expandAdvancedOptions(pageType);
        attachLocationListener();
        panel.querySelectorAll('.productSpecialty_category_title').forEach((title) => {
            title.addEventListener('click', () => {
                const section = title.closest('.productSpecialty_category_section');
                const shouldOpen = section?.classList.contains('is-collapsed');
                panel.querySelectorAll('.productSpecialty_category_section').forEach((item) => {
                    if (item !== section) item.classList.add('is-collapsed');
                });
                section?.classList.toggle('is-collapsed', !shouldOpen);
            });
        });

        await Promise.all(cfg.selectGroups.map(async (group) => {
            const grid = document.getElementById(`${PREFIX}${group.id}_grid`);
            if (!grid) return;
            const options = await loadOptions(cfg, group);
            options.forEach((item) => {
                const value = item.id || item.value || item.key || optionLabel(item);
                const label = optionLabel(item);
                const card = document.createElement('label');
                card.className = `productSpecialty_item_card ${group.compact ? 'fuel-card' : ''} ${group.tight ? 'tight-card' : ''}`;
                card.id = `${PREFIX}card_${group.id}_${value}`;
                card.dataset.groupId = group.id;
                card.dataset.value = value;

                const image = optionImage(cfg, item);
                if (image && !group.compact) {
                    const img = document.createElement('img');
                    img.src = image;
                    img.loading = 'lazy';
                    img.onerror = () => { img.style.display = 'none'; };
                    card.appendChild(img);
                } else if (item.icon) {
                    const icon = document.createElement('i');
                    icon.className = `fas ${item.icon}`;
                    card.appendChild(icon);
                }

                const radio = document.createElement('input');
                radio.type = 'radio';
                radio.name = `${PREFIX}${group.id}`;
                radio.value = value;
                radio.addEventListener('change', () => selectGroupValue(group.id, value, label, card));
                card.appendChild(radio);

                const name = document.createElement('span');
                name.className = 'productSpecialty_item_name';
                name.textContent = label;
                card.appendChild(name);
                grid.appendChild(card);

                if (item.default) {
                    radio.checked = true;
                    selectGroupValue(group.id, value, label, card);
                }
            });
        }));

        if (cfg.itemType === 'real_estate') {
            const propertySelect = document.getElementById(`${PREFIX}property_types`);
            if (propertySelect) syncRealEstateBuildingFields();
        }
    }

    function expandAdvancedOptions(pageType) {
        const container = document.getElementById(pageType === 'add' ? 'add1_advanced_options_container' : 'edit_advanced_options_container');
        if (!container) return;
        container.classList.add('is-expanded');
    }

    function selectGroupValue(groupId, value, label, card = null) {
        const input = document.getElementById(`${PREFIX}${groupId}`);
        if (input) input.value = value == null ? '' : value;
        const section = document.getElementById(`${PREFIX}${groupId}_group`);
        if (section) {
            section.querySelectorAll('.productSpecialty_item_card').forEach((item) => item.classList.remove('selected'));
            card?.classList.add('selected');
        }
        const preview = document.getElementById(`${PREFIX}${groupId}_preview`);
        if (preview) {
            preview.textContent = label || value || '';
            preview.classList.toggle('visible', !!preview.textContent);
        }
        if (groupId === 'property_types') syncRealEstateBuildingFields();
    }

    function attachLocationListener() {
        if (global.__productSpecialtyLocationListenerAttached) return;
        global.__productSpecialtyLocationListenerAttached = true;
        global.addEventListener('message', (event) => {
            if (!event.data || event.data.type !== 'LOCATION_SELECTED') return;
            const coordsStr = event.data.coordinates;
            if (!coordsStr || !coordsStr.includes(',')) return;
            const [lat, lng] = coordsStr.split(',').map((item) => item.trim());
            setValue('location_lat', lat);
            setValue('location_lng', lng);
            log('location-selected', { lat, lng });
        });
    }

    function syncRealEstateBuildingFields() {
        const value = getValue('property_types');
        const isLand = value === 'land';
        ['rooms', 'bathrooms', 'floor_level'].forEach((id) => {
            const group = document.getElementById(`${PREFIX}${id}_group`);
            const input = document.getElementById(`${PREFIX}${id}`);
            if (group) group.style.display = isLand ? 'none' : '';
            if (isLand && input) input.value = '';
        });
    }

    function getValue(id) {
        const el = document.getElementById(`${PREFIX}${id}`);
        return el ? String(el.value || '').trim() : '';
    }

    function setValue(id, value) {
        const el = document.getElementById(`${PREFIX}${id}`);
        if (!el) return;
        el.value = value == null ? '' : value;
        const radio = document.querySelector(`input[name="${PREFIX}${id}"][value="${CSS.escape(String(el.value))}"]`);
        if (radio) {
            radio.checked = true;
            const card = radio.closest('.productSpecialty_item_card');
            const label = card?.querySelector('.productSpecialty_item_name')?.textContent || el.value;
            selectGroupValue(id, el.value, label, card);
        }
    }

    async function fetchListing(type, key) {
        const cfg = getConfig(type);
        if (!cfg || !key || typeof global.apiFetch !== 'function') return null;
        const result = await global.apiFetch(`${cfg.apiPath}?${cfg.queryKey}=${encodeURIComponent(key)}`, {
            specialHandlers: { 404: () => null }
        });
        if (Array.isArray(result)) return result[0] || null;
        return result && !result.error ? result : null;
    }

    function getListingKey(productData = null) {
        const cfg = getConfig(productData);
        if (!cfg) return '';
        return params().get(cfg.queryKey) || params().get('product_key') || params().get('key') || params().get('id') || productData?.[cfg.queryKey] || productData?.product_key || '';
    }

    function normalizeImageNames(productData, cfg) {
        return String(productData?.ImageName || productData?.image_names || productData?.car_image_names || productData?.[cfg.imageField] || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .join(',');
    }

    function buildImageSrc(imageNames) {
        return String(imageNames || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .map((name) => (typeof global.getPublicR2FileUrl === 'function' ? global.getPublicR2FileUrl(name) : name))
            .filter(Boolean);
    }

    function mergeListingIntoProduct(productData, listing, cfg) {
        if (!productData || !listing || !cfg) return productData;
        const imageNames = normalizeImageNames(listing, cfg);
        const currentImages = normalizeImageNames(productData, cfg);
        if (imageNames && !currentImages) {
            productData.ImageName = imageNames;
            productData.image_name = imageNames;
            productData.imageSrc = buildImageSrc(imageNames);
            productData.image = productData.imageSrc[0] || productData.image || null;
        }

        productData.product_key = productData.product_key || listing.product_key || listing[cfg.queryKey];
        productData[cfg.queryKey] = productData[cfg.queryKey] || listing[cfg.queryKey] || listing.product_key || productData.product_key;
        productData.item_type = cfg.itemType;
        productData[cfg.flag] = true;
        productData.MainCategory = productData.MainCategory || listing.MainCategory || cfg.mainCategory;
        productData.SubCategory = productData.SubCategory || listing.SubCategory || listing.sub_category_id || cfg.defaultSubCategory;
        productData.product_price = productData.product_price ?? listing.product_price ?? listing.price ?? 0;
        productData.pricePerItem = productData.pricePerItem ?? productData.product_price;
        productData.product_quantity = productData.product_quantity ?? 1;
        productData.availableQuantity = productData.availableQuantity ?? 1;
        productData.product_description = productData.product_description || listing.product_description || listing.notes || '';
        productData.description = productData.description || productData.product_description;
        productData.year = productData.year || listing.year || '';
        productData.selections = productData.selections || listing.selections || {};
        productData.area_sqm = productData.area_sqm || listing.area_sqm || '';
        productData.rooms = productData.rooms || listing.rooms || '';
        productData.bathrooms = productData.bathrooms || listing.bathrooms || '';
        productData.floor_level = productData.floor_level || listing.floor_level || '';
        productData.address = productData.address || listing.address || '';
        productData.location_lat = productData.location_lat || listing.location_lat || '';
        productData.location_lng = productData.location_lng || listing.location_lng || '';
        return productData;
    }

    function collectPayload(productData) {
        const cfg = getConfig(productData);
        if (!cfg) return null;
        const payload = {
            [cfg.queryKey]: productData.product_key,
            user_key: productData.user_key,
            status: 1
        };

        if (cfg.itemType === 'car') {
            payload.year = getValue('year');
            payload.price = productData.product_price ?? productData.pricePerItem ?? 0;
            payload.notes = productData.product_description || productData.description || '';
            payload.car_image_names = normalizeImageNames(productData, cfg);
            payload.selections = {};
            cfg.selectGroups.forEach((group) => {
                payload.selections[group.id] = getValue(group.id);
            });
            return payload;
        }

        payload.sub_category_id = productData.SubCategory || params().get('SubCategory') || params().get('sub_category_id') || cfg.defaultSubCategory;
        payload.price = productData.product_price ?? productData.pricePerItem ?? 0;
        payload.area_sqm = getValue('area_sqm');
        payload.rooms = getValue('rooms');
        payload.bathrooms = getValue('bathrooms');
        payload.floor_level = getValue('floor_level');
        payload.address = getValue('address');
        payload.location_lat = getValue('location_lat');
        payload.location_lng = getValue('location_lng');
        payload.notes = productData.product_description || productData.description || '';
        payload.image_names = normalizeImageNames(productData, cfg);
        payload.selections = {};
        cfg.selectGroups.forEach((group) => {
            payload.selections[group.id] = getValue(group.id);
        });
        return payload;
    }

    function validateForm(clearError, showError) {
        const cfg = getConfig();
        if (!cfg) return true;
        let isValid = true;
        cfg.fields.forEach((field) => {
            if (!field.required || field.source) return;
            const el = document.getElementById(`${PREFIX}${field.id}`);
            if (!el) return;
            if (clearError) clearError(el);
            if (!String(el.value || '').trim()) {
                if (showError) showError(el, `${field.label} مطلوب.`);
                isValid = false;
            }
        });
        cfg.selectGroups.forEach((group) => {
            const section = document.getElementById(`${PREFIX}${group.id}_group`);
            const value = getValue(group.id);
            if (clearError && section) clearError(section);
            if (!value) {
                if (showError && section) showError(section, 'هذا القسم مطلوب.');
                isValid = false;
            }
        });
        if (cfg.itemType === 'real_estate') {
            const mapGroup = document.getElementById('productSpecialty_map_group');
            if (clearError && mapGroup) clearError(mapGroup);
            if (!getValue('location_lat') || !getValue('location_lng')) {
                if (showError && mapGroup) showError(mapGroup, 'يرجى تحديد الموقع على الخريطة.');
                isValid = false;
            }
        }
        return isValid;
    }

    async function saveListing(productData, mode = 'POST') {
        const cfg = getConfig(productData);
        if (!cfg) return null;
        const payload = collectPayload(productData);
        if (!payload) return null;
        log('save-listing-start', { type: cfg.itemType, key: payload[cfg.queryKey], mode });
        const response = await global.apiFetch(cfg.apiPath, { method: mode, body: payload });
        if (response?.error) throw new Error(response.error);
        log('save-listing-complete', { type: cfg.itemType, key: payload[cfg.queryKey] });
        return response;
    }

    async function deleteListing(productData) {
        const cfg = getConfig(productData);
        const key = getListingKey(productData);
        if (!cfg || !key) return null;
        return global.apiFetch(`${cfg.apiPath}?${cfg.queryKey}=${encodeURIComponent(key)}`, { method: 'DELETE' });
    }

    async function prefillForm(productData) {
        const cfg = getConfig(productData);
        if (!cfg) return;
        const key = getListingKey(productData);
        const listing = await fetchListing(cfg.itemType, key);
        if (!listing) return;
        mergeListingIntoProduct(productData, listing, cfg);
        await ensureFormFields(document.body?.id === 'product-add-page' ? 'add' : 'edit');

        if (cfg.itemType === 'car') {
            setValue('year', listing.year || '');
            cfg.selectGroups.forEach((group) => setValue(group.id, listing.selections?.[group.id] || ''));
            // Dynamically change the description label to "وصف" specifically for cars in productEdit
            const descLabel = document.querySelector('#edit_label_description_wrapper span[data-lkey="edit_label_description"]');
            if (descLabel) {
                descLabel.textContent = 'وصف';
            }
            return;
        }

        ['area_sqm', 'rooms', 'bathrooms', 'floor_level', 'address', 'location_lat', 'location_lng'].forEach((id) => setValue(id, listing[id] || ''));
        cfg.selectGroups.forEach((group) => setValue(group.id, listing.selections?.[group.id] || listing[group.id] || ''));
        syncRealEstateBuildingFields();

        if (cfg.itemType === 'real_estate' && listing.location_lat && listing.location_lng) {
            const iframe = document.getElementById('productSpecialty_location_iframe');
            if (iframe) {
                const lat = encodeURIComponent(listing.location_lat);
                const lng = encodeURIComponent(listing.location_lng);
                const timestamp = Date.now();
                iframe.src = `/location/LOCATION.html?lat=${lat}&lng=${lng}&embedded=true&hideSave=true&v=${timestamp}`;
                log('prefill-form-map-updated', { lat, lng });
            }
        }
    }

    function labelForSelection(cfg, groupId, value) {
        const list = optionCache[`${cfg.itemType}:${groupId}`] || [];
        const found = list.find((item) => String(item.id || item.value || item.key || '') === String(value));
        return optionLabel(found) || String(value || '');
    }

    /**
     * Renders a specialty selection value, embedding its associated image/icon if available.
     * This is particularly used for displaying car brand and body type logos in productView.
     */
    function renderValueForSelection(cfg, groupId, value) {
        const list = optionCache[`${cfg.itemType}:${groupId}`] || [];
        const found = list.find((item) => String(item.id || item.value || item.key || '') === String(value));
        if (!found) return String(value || '');
        
        const label = optionLabel(found);
        const image = optionImage(cfg, found);
        const group = cfg.selectGroups.find((g) => g.id === groupId);

        // Show image logo for non-compact groups like brand or body type
        if (image && group && !group.compact) {
            return `
                <div style="display:flex;align-items:center;gap:8px;justify-content:flex-start;">
                    <img src="${image}" style="width:24px;height:24px;object-fit:contain;border-radius:4px;" onerror="this.style.display='none';">
                    <span>${label}</span>
                </div>
            `;
        } else if (found.icon) {
            return `
                <div style="display:flex;align-items:center;gap:8px;justify-content:flex-start;">
                    <i class="fas ${found.icon}" style="color:var(--primary-color,#0b5ed7);font-size:1rem;"></i>
                    <span>${label}</span>
                </div>
            `;
        }
        return label;
    }

    async function renderView(productData) {
        const cfg = getConfig(productData);
        if (!cfg) return;
        ensureStyles();

        // Dynamically change the description header text to "وصف" specifically for cars in productView
        if (cfg.itemType === 'car') {
            const descHeader = document.getElementById('productView_description_header_text');
            if (descHeader) {
                descHeader.textContent = 'وصف';
            }
        }

        const key = getListingKey(productData);
        const listing = await fetchListing(cfg.itemType, key);
        const data = listing || productData;
        if (listing) mergeListingIntoProduct(productData, listing, cfg);
        const host = document.getElementById('productView_info_grid');
        if (!host || document.getElementById('productSpecialty_view_panel')) return;

        await Promise.all(cfg.selectGroups.map((group) => loadOptions(cfg, group)));
        const rows = [];
        if (cfg.itemType === 'car') {
            rows.push(['سنة الصنع', data.year]);
            // Use renderValueForSelection to support rendering car brand and body type icons
            cfg.selectGroups.forEach((group) => rows.push([group.label, renderValueForSelection(cfg, group.id, data.selections?.[group.id])]));
        } else {
            rows.push(['المساحة', data.area_sqm ? `${data.area_sqm} م²` : '']);
            rows.push(['الغرف', data.rooms]);
            rows.push(['الحمامات', data.bathrooms]);
            rows.push(['الطابق', data.floor_level]);
            rows.push(['العنوان', data.address]);
            // Use renderValueForSelection for real estate options as well
            cfg.selectGroups.forEach((group) => rows.push([group.label, renderValueForSelection(cfg, group.id, data.selections?.[group.id] || data[group.id])]));
        }

        const visibleRows = rows.filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '');
        if (!visibleRows.length) return;
        const panel = document.createElement('div');
        panel.id = 'productSpecialty_view_panel';
        panel.className = 'productView_info_item';
        panel.innerHTML = `
            <div class="productView_info_label"><i class="${cfg.icon}"></i><span>${cfg.title}</span></div>
            <div class="productSpecialty_meta_grid">
                ${visibleRows.map(([label, value]) => `<div class="productSpecialty_meta_item"><div class="productSpecialty_meta_label">${label}</div><div>${value}</div></div>`).join('')}
            </div>
        `;
        host.appendChild(panel);
    }

    async function buildLegacyProduct(type, key, providerKey = '') {
        const cfg = getConfig(type);
        const listing = await fetchListing(type, key);
        if (!cfg || !listing) return null;
        const imageNames = normalizeImageNames(listing, cfg);
        return {
            ...listing,
            product_key: listing.product_key || listing[cfg.queryKey] || key,
            productName: listing.productName || (cfg.itemType === 'car' ? `سيارة ${listing.year || ''}` : 'عقار'),
            product_description: listing.product_description || listing.notes || '',
            description: listing.product_description || listing.notes || '',
            product_price: listing.product_price ?? listing.price ?? 0,
            pricePerItem: listing.product_price ?? listing.price ?? 0,
            product_quantity: 1,
            availableQuantity: 1,
            ImageName: imageNames,
            user_key: listing.user_key || providerKey,
            MainCategory: listing.MainCategory || cfg.mainCategory,
            SubCategory: listing.SubCategory || listing.sub_category_id || cfg.defaultSubCategory,
            serviceType: '0',
            item_type: cfg.itemType,
            [cfg.flag]: true
        };
    }

    async function enrichProduct(productData) {
        const cfg = getConfig(productData);
        if (!cfg) return productData;
        const key = getListingKey(productData);
        const listing = await fetchListing(cfg.itemType, key);
        if (listing) return mergeListingIntoProduct(productData, listing, cfg);
        return productData;
    }

    global.ProductSpecialtyListingBridge = {
        buildLegacyProduct,
        deleteListing,
        enrichProduct,
        ensureFormFields,
        fetchListing,
        getConfig,
        getListingKey,
        getProductType,
        getSpecialtyProfileKey,
        isSpecialtyProduct,
        isSpecialtyProfile,
        isSpecialtyRoute,
        prefillForm,
        renderView,
        saveListing,
        validateForm
    };
})(window);
