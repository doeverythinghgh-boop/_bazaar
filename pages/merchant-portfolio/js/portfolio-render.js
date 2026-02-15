/**
 * @file pages/merchant-portfolio/js/portfolio-render.js
 * @description Handles rendering user profile and products.
 */

/**
 * Renders user profile information.
 * @param {Object} user 
 */
function portfolioRenderProfile(user) {
    console.log(`%c[Portfolio] 5. بدء عرض بيانات الملف الشخصي على الواجهة (Rendering)...`, "color: purple;");
    
    // 1. Avatar
    const avatarImg = document.getElementById('portfolio-avatar');
    if (user.user_image) {
        // Use existing helper if available or construct R2 URL
        // Trying global helper from index.html/core
        const imgUrl = typeof getPublicR2FileUrl === 'function' 
            ? getPublicR2FileUrl(user.user_image) 
            : `https://pub-e828389e2f1e484c89d8fb652c540c12.r2.dev/${user.user_image}`;
        avatarImg.src = imgUrl;
    }

    // 2. Name & Handle
    document.getElementById('portfolio-name').textContent = user.business_name || user.username;
    
    const usernameEl = document.createElement('div');
    usernameEl.className = 'profile-username';
    usernameEl.textContent = `@${user.username}`;
    document.getElementById('portfolio-name').after(usernameEl);

    // 3. Verification Badge
    if (user.is_seller === 1) { 
        const badge = document.getElementById('portfolio-verification-badge');
        if (badge) badge.style.display = 'block';
    }

    // 4. Bio & Info List
    const bioEl = document.getElementById('portfolio-bio');
    bioEl.textContent = user.business_bio || "";

    // Clear previous info list if re-rendering
    const existingInfo = document.querySelector('.profile-info-list');
    if (existingInfo) existingInfo.remove();

    const infoContainer = document.createElement('div');
    infoContainer.className = 'profile-info-list';
    
    let hasInfo = false;

    // Address
    if (user.address && user.address.trim() !== "") {
        hasInfo = true;
        console.log(`[Portfolio] - تم العثور على العنوان: ${user.address}`);
        infoContainer.innerHTML += `
            <div class="info-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${user.address}</span>
            </div>
        `;
    }

    // Location (Map Link)
    if (user.location && user.location.trim() !== "") {
        hasInfo = true;
        console.log(`[Portfolio] - تم العثور على إحداثيات الموقع`);
        const coords = user.location.replace(/\s/g, '');
        const mapUrl = `https://www.google.com/maps/search/?api=1&query=${coords}`;
        infoContainer.innerHTML += `
            <div class="info-item">
                <i class="fas fa-map-marked-alt"></i>
                <a href="${mapUrl}" target="_blank" style="color: inherit; text-decoration: underline;">الموقع على الخريطة</a>
            </div>
        `;
    }

    // Main Category
    if (user.business_category && user.business_category.trim() !== ""){
         hasInfo = true;
         console.log(`[Portfolio] - تم العثور على الفئة الرئيسية: ${user.business_category}`);
         // Attempt to translate or map if needed, otherwise show raw for now
         infoContainer.innerHTML += `
            <div class="info-item">
                <i class="fas fa-briefcase"></i>
                <span>${user.business_category}</span>
            </div>
        `;
    }

    // Sub Categories
    if (user.business_sub_categories && user.business_sub_categories.trim() !== "") {
        // Assume comma separated string
        const subs = user.business_sub_categories.split(',').filter(s => s.trim() !== '');
        if (subs.length > 0) {
             hasInfo = true;
             console.log(`[Portfolio] - تم العثور على ${subs.length} فئات فرعية`);
             const subHtml = subs.map(sub => `<span class="sub-cat-badge">${sub}</span>`).join(' ');
             infoContainer.innerHTML += `
                <div class="info-item" style="align-items: flex-start;">
                    <i class="fas fa-tags" style="margin-top: 5px;"></i>
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">${subHtml}</div>
                </div>
            `;
        }
    }

    if (hasInfo) {
        bioEl.after(infoContainer);
    }

    // 5. Ratings
    let ratings = [];
    try {
        if (user.ratings) {
            ratings = JSON.parse(user.ratings);
        }
    } catch (e) { console.error("Error parsing ratings", e); }

    let average = 0;
    if (ratings.length > 0) {
        const sum = ratings.reduce((a, b) => a + (b.rating || 0), 0);
        average = (sum / ratings.length).toFixed(1);
    }
    
    const starsContainer = document.getElementById('portfolio-stars');
    starsContainer.innerHTML = portfolioGenerateStars(average);
    document.getElementById('portfolio-rating-count').textContent = `(${ratings.length})`; // Simplified count

    // 6. Tags (Delivery)
    const tagsContainer = document.getElementById('portfolio-tags');
    tagsContainer.innerHTML = '';
    
    if (user.isDelivered == 1) {
        const tag = document.createElement('span');
        tag.className = 'tag';
        tag.innerHTML = '<i class="fas fa-truck"></i> يوفر توصيل';
        tagsContainer.appendChild(tag);
    }

    // 7. Contact Buttons Logic
    const waBtn = document.getElementById('btn-whatsapp');
    const callBtn = document.getElementById('btn-call');

    if (user.business_whatsapp || user.phone) {
        // WhatsApp
        if (user.business_whatsapp) {
            waBtn.href = `https://wa.me/${user.business_whatsapp}`;
            waBtn.style.display = 'inline-flex';
        } else if (user.phone) {
            // Fallback to phone for WA if needed, or just hide
            waBtn.href = `https://wa.me/${user.phone}`;
            waBtn.style.display = 'inline-flex';
        }

        // Call
        if (user.phone) {
            callBtn.href = `tel:${user.phone}`;
            callBtn.style.display = 'inline-flex';
        }
    } else {
        // Hide container if no contact methods
        const contactDiv = document.querySelector('.contact-actions');
        if (contactDiv) contactDiv.style.display = 'none';
        console.log(`[Portfolio] ⚠️ لا توجد وسائل تواصل متاحة للعرض.`);
    }
    
    console.log(`%c[Portfolio] ✅ تم عرض الملف الشخصي بنجاح.`, "color: green; font-weight: bold;");
}

/**
 * Generates HTML for star rating.
 * @param {number} rating 
 * @returns {string} HTML string
 */
function portfolioGenerateStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (rating >= i) {
            html += '<i class="fas fa-star"></i>';
        } else if (rating >= i - 0.5) {
            html += '<i class="fas fa-star-half-alt"></i>';
        } else {
            html += '<i class="far fa-star"></i>';
        }
    }
    return html;
}

/**
 * Renders products grid.
 * @param {Array} products 
 */
function portfolioRenderProducts(products) {
    const grid = document.getElementById('portfolio-products-grid');
    grid.innerHTML = '';

    products.forEach(product => {
        const card = document.createElement('div');
        card.className = 'portfolio-product-card';
        
        // Image
        const firstImage = product.ImageName ? product.ImageName.split(',')[0] : '';
        const imgUrl = firstImage && typeof getPublicR2FileUrl === 'function'
            ? getPublicR2FileUrl(firstImage)
            : '/assets/images/placeholder.png'; // Fallback

        card.innerHTML = `
            <img src="${imgUrl}" class="product-img" loading="lazy" alt="${product.productName}">
            <div class="product-info">
                <h3 class="product-title">${product.productName}</h3>
                <div class="product-price">${product.product_price} ج.م</div>
            </div>
        `;
        
        // Navigate to details on click
        card.onclick = () => {
            window.location.href = `/pages/product-details.html?id=${product.id}`;
        };

        grid.appendChild(card);
    });
}

// Make global
window.portfolioRenderProfile = portfolioRenderProfile;
window.portfolioRenderProducts = portfolioRenderProducts;
