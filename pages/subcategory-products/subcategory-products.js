/**
 * @file subcategory-products.js
 * @description Logic for the new dedicated subcategory products page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


async function initSubProductsPage() {
    console.log("[SubProducts] Page initialization started.");

    const grid = document.getElementById('sub-products-grid');
    const header = document.getElementById('sub-products-header');
    const categoryNameEl = document.getElementById('sub-products-category-name');
    const iconBox = document.getElementById('sub-products-icon-box');
    const iconEl = document.getElementById('sub-products-icon');

    // 1. Get params from the URL first, with LocalDBStorage kept as a legacy fallback.
    const urlParams = new URLSearchParams(window.location.search);
    let parsedParams = null;
    const urlMainId = urlParams.get('mainId') || urlParams.get('main_id');
    const urlSubId = urlParams.get('subId') || urlParams.get('sub_id');

    if (urlMainId || urlSubId) {
        parsedParams = {
            mainId: urlMainId || '',
            subId: urlSubId || '',
            timestamp: Date.now()
        };
        LocalDBStorage.setItem('pendingCategorySearch', JSON.stringify(parsedParams));
    } else {
        const rawParams = LocalDBStorage.getItem('pendingCategorySearch');
        if (rawParams) {
            try {
                parsedParams = JSON.parse(rawParams);
            } catch (error) {
                console.error('[SubProducts] Failed to parse stored category params:', error);
            }
        }
    }

    if (!parsedParams || !parsedParams.mainId) {
        grid.innerHTML = `<div id="sub-products-no-search-params" class="empty-results"><i id="sub-products-no-search-icon" class="fas fa-search"></i> ${window.langu('subcat_no_pending_search')}</div>`;
        return;
    }

    try {
        const normalizedSelection = typeof window.normalizeCategorySelection === 'function'
            ? window.normalizeCategorySelection(parsedParams.mainId, parsedParams.subId || '')
            : { mainId: parsedParams.mainId, subId: parsedParams.subId || '' };
        const { mainId, subId } = normalizedSelection;
        console.log(`[SubProducts] Fetching products for Sub: ${subId} under Main: ${mainId}`);

        // 2. Fetch Category Info for UI
        const categoriesData = window.appCategoriesList || await fetchAppCategories();
        const mainCat = categoriesData.categories.find(c => String(c.id) === String(mainId));
        const subCat = mainCat ? mainCat.subcategories.find(s => String(s.id) === String(subId)) : null;

        if (subCat) {
            const title = subCat.title[window.app_language] || subCat.title['ar'] || '...';
            categoryNameEl.textContent = title;

            // ✅ New: Show Subcategory Image instead of Icon Box
            if (subCat.image) {
                const imagePath = `/images/subCategories/${subCat.image}`;
                iconBox.innerHTML = `<img id="sub-products-category-image" src="${imagePath}" alt="${title}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">`;
                iconBox.style.background = 'transparent';
                iconBox.style.boxShadow = 'none';
            } else if (subCat.icon) {
                iconEl.className = subCat.icon;
            }
            header.style.display = 'flex';
        }

        // 3. Fetch Merchants (Specialized Directory Mode)
        grid.innerHTML = '<div id="sub-products-loading-spinner" class="loader" style="grid-column: 1 / -1; margin: 40px auto;"></div>';

        // Cache Key based on current search params
        const cacheKey = `merchant_search_${mainId}_${subId || 'all'}`;
        const cachedData = LocalDBSession.getItem(cacheKey);

        let usersData;

        if (cachedData) {
            console.log(`[SubProducts] Using cached data for ${cacheKey}`);
            usersData = JSON.parse(cachedData);
        } else {
            const targets = (mainId && typeof window.getCompatibleCategorySelections === 'function')
                ? window.getCompatibleCategorySelections(mainId, subId || '')
                : [{ mainId: mainId || '', subId: subId || '' }];

            const results = await Promise.all(targets.map((target) => {
                let apiUrl = `/api/users?mode=category_search`;
                if (target.mainId) apiUrl += `&main_id=${target.mainId}`;
                if (target.subId) apiUrl += `&sub_id=${target.subId}`;
                return apiFetch(apiUrl);
            }));

            const seen = new Set();
            usersData = [];
            results.forEach((list) => {
                if (!Array.isArray(list)) return;
                list.forEach((user) => {
                    const userKey = String(user?.user_key || user?.id || '');
                    if (!userKey || seen.has(userKey)) return;
                    seen.add(userKey);
                    usersData.push(user);
                });
            });

            // Save to session storage if valid result
            if (usersData && Array.isArray(usersData)) {
                LocalDBSession.setItem(cacheKey, JSON.stringify(usersData));
            }
        }

        grid.innerHTML = '';

        if (!usersData || usersData.length === 0) {
            grid.innerHTML = `
                <div id="sub-products-no-merchants" class="empty-results">
                    <i id="sub-products-no-merchants-icon" class="fas fa-store-slash"></i>
                    <p id="sub-products-no-merchants-text">${window.langu('subcat_no_merchants')}</p>
                </div>`;
            // Update header count
            const countEl = document.getElementById('sub-products-count-text');
            if (countEl) countEl.textContent = window.langu('service_providers_count_zero');
            return;
        }

        // Update header count
        const countEl = document.getElementById('sub-products-count-text');
        if (countEl) countEl.textContent = window.langu('service_providers_count', { count: usersData.length });

        // Render Merchant Cards
        usersData.forEach(user => {
            const card = createMerchantCard(user, mainId, subId);
            grid.appendChild(card);
        });

        // Setup Search functionality
        const searchContainer = document.getElementById('sub-products-search-container');
        if (searchContainer) {
            if (usersData && usersData.length > 0) {
                searchContainer.style.display = 'block';
                let searchInput = document.getElementById('sub-products-search-input');
                let searchClear = document.getElementById('sub-products-search-clear');
                
                if (searchInput && searchClear) {
                    searchInput.value = '';
                    searchClear.style.display = 'none';

                    // Replace input to clear old listeners
                    const newSearchInput = searchInput.cloneNode(true);
                    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
                    searchInput = newSearchInput;
                    
                    const newSearchClear = searchClear.cloneNode(true);
                    searchClear.parentNode.replaceChild(newSearchClear, searchClear);
                    searchClear = newSearchClear;

                    searchInput.addEventListener('input', function(e) {
                        const rawValue = e.target.value;
                        searchClear.style.display = rawValue.trim().length > 0 ? 'block' : 'none';
                        
                        const searchTerm = typeof normalizeArabicText === 'function' ? normalizeArabicText(rawValue).toLowerCase() : rawValue.trim().toLowerCase();
                        
                        const allCards = grid.querySelectorAll('.merchant-card-directory');
                        let visibleCount = 0;
                        allCards.forEach(function(c) {
                            const nameEl = c.querySelector('.merchant-card-name');
                            
                            let textContent = '';
                            if (nameEl) textContent += nameEl.textContent + ' ';

                            if (textContent) {
                                const cardText = typeof normalizeArabicText === 'function' ? normalizeArabicText(textContent).toLowerCase() : textContent.trim().toLowerCase();
                                if (cardText.includes(searchTerm)) {
                                    c.style.display = 'flex';
                                    visibleCount++;
                                } else {
                                    c.style.display = 'none';
                                }
                            }
                        });
                        
                        const existingEmpty = document.getElementById('sub-products-empty-search');
                        if (visibleCount === 0 && searchTerm !== '') {
                            if (!existingEmpty) {
                                const emptyMsg = document.createElement('div');
                                emptyMsg.id = 'sub-products-empty-search';
                                emptyMsg.className = 'empty-results';
                                emptyMsg.innerHTML = '<i class="fas fa-search" style="font-size: 2rem; color: var(--text-color-light, #ccc); margin-bottom: 10px;"></i><p>' + window.langu('search_no_results') + '</p>';
                                emptyMsg.style.gridColumn = '1 / -1';
                                emptyMsg.style.textAlign = 'center';
                                emptyMsg.style.padding = '40px 20px';
                                emptyMsg.style.color = 'var(--text-color-light)';
                                grid.appendChild(emptyMsg);
                            }
                        } else {
                            if (existingEmpty) {
                                existingEmpty.remove();
                            }
                        }
                    });

                    searchClear.addEventListener('click', function() {
                        searchInput.value = '';
                        searchInput.dispatchEvent(new Event('input'));
                        searchInput.focus();
                    });
                }
            } else {
                searchContainer.style.display = 'none';
            }
        }


    } catch (e) {
        console.error("[SubProducts] Error:", e);
        const grid = document.getElementById('sub-products-grid');
        grid.innerHTML = `<div id="sub-products-error" class="empty-results"><i id="sub-products-error-icon" class="fas fa-exclamation-triangle"></i> ${window.langu('subcat_fetch_error')}</div>`;
    }
}

/**
 * Creates a specialized merchant card for the directory.
 * Design: Minimalist (Avatar + Name + Bio + Action).
 */
function createMerchantCard(user, mainId = '', subId = '') {
    const card = document.createElement('div');
    const userKey = user.user_key || user.id || 'unknown';
    card.id = `merchant-card-${userKey}`;
    card.className = 'merchant-card-directory';

    // Make entire card clickable
    card.onclick = () => window.location.href = `/pages/merchant-portfolio/merchant-portfolio.html?user_key=${user.user_key}&mainId=${mainId}&subId=${subId}`;

    // Avatar
    const images = (typeof parseProfileImages === 'function')
        ? parseProfileImages(user.user_image)
        : { avatar: user.user_image, cover: null };

    const avatarUrl = images.avatar ? getPublicR2FileUrl(images.avatar) : '';

    // Name (Business Name preferred, else Username)
    const displayName = user.business_name || user.username || window.langu('subcat_merchant_default_name');
    const bio = user.business_bio || window.langu('subcat_no_description');
    const specialtyProfile = user.specialty_profile || (
        typeof window.buildBusinessSpecialtyProfile === 'function'
            ? window.buildBusinessSpecialtyProfile(user)
            : null
    );
    const specialtyDisplayMeta = typeof window.resolveBusinessSpecialtyDisplayMeta === 'function'
        ? window.resolveBusinessSpecialtyDisplayMeta(specialtyProfile || user)
        : null;
    const specialtyAccent = typeof window.resolveBusinessSpecialtyAccent === 'function'
        ? window.resolveBusinessSpecialtyAccent(specialtyProfile || user)
        : null;
    const specialtyTags = Array.isArray(specialtyProfile?.titles)
        ? specialtyProfile.titles.slice(0, 3).map((item) => String(item?.label || '').trim()).filter(Boolean)
        : [];
    const matchBadgeText = user.specialty_match_type === 'exact_subcategory'
        ? (window.langu('subcat_exact_specialty_match') || 'مطابقة دقيقة')
        : (user.specialty_match_type === 'main_category'
            ? (window.langu('subcat_main_specialty_match') || 'مطابقة حسب القسم')
            : '');

    const avatarMarkup = avatarUrl
        ? `<img id="merchant-card-avatar-${userKey}" src="${avatarUrl}" alt="${displayName}" class="merchant-card-avatar" loading="lazy" onerror="this.closest('.merchant-card-avatar-wrapper').classList.add('is-fallback'); this.remove();">`
        : `<div id="merchant-card-avatar-fallback-${userKey}" class="merchant-card-avatar-fallback" aria-hidden="true"><i id="merchant-card-avatar-icon-${userKey}" class="fas fa-store"></i></div>`;

    const tagsMarkup = specialtyTags.length
        ? `<div id="merchant-card-tags-${userKey}" class="merchant-card-tags">${specialtyTags.map((label, i) => `<span id="merchant-card-tag-${userKey}-${i}" class="merchant-card-tag">${label}</span>`).join('')}</div>`
        : '';

    const badgeMarkup = '';

    if (specialtyProfile?.primaryMainCategoryId) {
        card.dataset.primaryCategory = String(specialtyProfile.primaryMainCategoryId);
    }
    if (specialtyAccent?.color) {
        card.style.setProperty('--merchant-accent', specialtyAccent.color);
        card.style.setProperty('--merchant-accent-soft', specialtyAccent.soft || '');
        card.style.setProperty('--merchant-accent-border', specialtyAccent.border || '');
    }

    card.innerHTML = `
        <div id="merchant-card-avatar-wrapper-${userKey}" class="merchant-card-avatar-wrapper">
            ${avatarMarkup}
        </div>
        <div id="merchant-card-info-${userKey}" class="merchant-card-info">
            <h3 id="merchant-card-name-${userKey}" class="merchant-card-name">${displayName}</h3>
            <p id="merchant-card-bio-${userKey}" class="merchant-card-bio">${bio}</p>
            ${tagsMarkup}
        </div>
        <button id="merchant-card-action-${userKey}" class="merchant-card-action">
            ${window.langu('subcat_visit_store')} <i id="merchant-card-action-icon-${userKey}" class="fas fa-arrow-left" style="margin-right: 5px;"></i>
        </button>
    `;

    return card;
}

// Start
// initSubProductsPage();
