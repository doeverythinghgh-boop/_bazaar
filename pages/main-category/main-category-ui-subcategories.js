
/**
 * @description Render subcategory cards for the selected main category.
 * @function mainCategory_renderSubcategories
 * @param {Object} category - Main category object.
 * @returns {void}
 */
function mainCategory_renderSubcategories(category) {
    try {
        var container = document.getElementById('main-category-subcategories');
        if (!container) return;
        container.innerHTML = '';
        container.style.display = 'grid'; // Ensure it's visible

        var urlParams = new URLSearchParams(window.location.search);
        var isConsultationView = urlParams.get('view') === 'consultations';
        var filteredSubcategories = [];

        if (String(category.id) === '20') {
            if (isConsultationView) {
                // Show ONLY consultations
                filteredSubcategories = category.subcategories.filter(function(sub) { return sub.type === 'consultation'; });
                // Change header title
                var titleEl = document.getElementById('main-category-title');
                if (titleEl) {
                    titleEl.textContent = window.langu('doctors_examination');
                }
            } else {
                // Regular view, hide consultations
                filteredSubcategories = category.subcategories.filter(function(sub) { return sub.type !== 'consultation'; });
                
                var consultationCard = document.createElement('div');
                consultationCard.className = 'main-category-subcategory-card';
                consultationCard.style.animationDelay = '0s';
                var consAlt = window.langu('doctors_examination');
                consultationCard.innerHTML = `
                  <div class="main-category-subcategory-media"><img src="/images/subCategories/doctors_appointment.webp" alt="${consAlt}"></div>
                  <span class="main-category-subcategory-title">${consAlt}</span>
                `;
                consultationCard.addEventListener('click', function() {
                    window.location.href = '?id=20&view=consultations';
                });
                container.appendChild(consultationCard);
            }
        } else {
            filteredSubcategories = category.subcategories;
        }

        if (!filteredSubcategories || !filteredSubcategories.length) {
            // Only show empty state if we didn't just inject the consultation card
            if (String(category.id) !== '20' || isConsultationView) {
                mainCategory_renderEmptyState(window.langu('main_category_no_subcategories') || 'No subcategories available.');
            }
            return;
        }

        for (var i = 0; i < filteredSubcategories.length; i++) {
            var sub = filteredSubcategories[i];
            // Adjust animation delay index if consultation card was added
            var animIndex = i + (String(category.id) === '20' && !isConsultationView ? 1 : 0);
            var card = mainCategory_createSubcategoryCard(sub, category.id, animIndex);
            container.appendChild(card);
        }

        // Setup Search functionality
        var searchContainer = document.getElementById('main-category-search-container');
        if (searchContainer) {
            if (filteredSubcategories.length > 0 || (String(category.id) === '20' && !isConsultationView)) {
                searchContainer.style.display = 'block';
                var searchInput = document.getElementById('main-category-search-input');
                var searchClear = document.getElementById('main-category-search-clear');
                
                if (searchInput && searchClear) {
                    searchInput.value = '';
                    searchClear.style.display = 'none';

                    var newSearchInput = searchInput.cloneNode(true);
                    searchInput.parentNode.replaceChild(newSearchInput, searchInput);
                    searchInput = newSearchInput;
                    
                    var newSearchClear = searchClear.cloneNode(true);
                    searchClear.parentNode.replaceChild(newSearchClear, searchClear);
                    searchClear = newSearchClear;

                    searchInput.addEventListener('input', function(e) {
                        var rawValue = e.target.value;
                        searchClear.style.display = rawValue.trim().length > 0 ? 'block' : 'none';
                        
                        var searchTerm = typeof normalizeArabicText === 'function' ? normalizeArabicText(rawValue).toLowerCase() : rawValue.trim().toLowerCase();
                        
                        var allCards = container.querySelectorAll('.main-category-subcategory-card');
                        var visibleCount = 0;
                        allCards.forEach(function(c) {
                            var titleEl = c.querySelector('.main-category-subcategory-title');
                            if (titleEl) {
                                var cardTitle = typeof normalizeArabicText === 'function' ? normalizeArabicText(titleEl.textContent).toLowerCase() : titleEl.textContent.trim().toLowerCase();
                                if (cardTitle.includes(searchTerm)) {
                                    c.style.display = 'flex';
                                    visibleCount++;
                                } else {
                                    c.style.display = 'none';
                                }
                            }
                        });
                        
                        var existingEmpty = document.getElementById('main-category-empty-search');
                        if (visibleCount === 0 && searchTerm !== '') {
                            if (!existingEmpty) {
                                var emptyMsg = document.createElement('div');
                                emptyMsg.id = 'main-category-empty-search';
                                emptyMsg.className = 'main-category-empty-state';
                                emptyMsg.innerHTML = '<i class="fas fa-search" style="font-size: 2rem; color: var(--text-color-light, #ccc); margin-bottom: 10px;"></i><p>' + window.langu('search_no_results') + '</p>';
                                emptyMsg.style.gridColumn = '1 / -1';
                                emptyMsg.style.textAlign = 'center';
                                emptyMsg.style.padding = '40px 20px';
                                emptyMsg.style.color = 'var(--text-color-light)';
                                container.appendChild(emptyMsg);
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
    } catch (error) {
        console.error('[MainCategory] Failed to render subcategories:', error);
    }
}

/**
 * @description Create a subcategory card element.
 * @function mainCategory_createSubcategoryCard
 * @param {Object} subcategory - Subcategory object.
 * @param {string|number} mainId - Main category ID.
 * @returns {HTMLDivElement}
 */
function mainCategory_createSubcategoryCard(subcategory, mainId, index) {
    var item = document.createElement('div');
    item.className = 'main-category-subcategory-card'; // Fixed class name to match CSS
    item.id = 'subcategory-card-' + subcategory.id;
    item.style.animationDelay = (index * 0.05) + 's';
    item.setAttribute('data-main-id', String(mainId));
    if (subcategory && subcategory.targetMainCategoryId) {
        item.setAttribute('data-target-main-id', String(subcategory.targetMainCategoryId));
    } else if (subcategory && typeof subcategory.id !== 'undefined') {
        item.setAttribute('data-sub-id', String(subcategory.id));
    }

    var displayTitle = mainCategory_getDisplayTitle(subcategory.title);

    var iconHtml;
    if (subcategory.image) {
        var imageFolder = subcategory.imageBasePath || 'subCategories';
        var imagePath = `/images/${imageFolder}/${subcategory.image}`;
        iconHtml = `<div class="main-category-subcategory-media"><img src="${imagePath}" alt="${displayTitle}"></div>`;
    } else {
        var iconClass = subcategory.icon || "fas fa-tag";
        iconHtml = `<div class="main-category-subcategory-media"><i class="${iconClass}"></i></div>`;
    }

    item.innerHTML = `
      ${iconHtml}
      <span class="main-category-subcategory-title">${displayTitle}</span>
    `;

    item.addEventListener('click', mainCategory_onSubcategoryClick);

    return item;
}
