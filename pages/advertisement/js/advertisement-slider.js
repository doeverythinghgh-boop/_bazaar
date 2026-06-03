/**
 * @file pages/advertisement/js/advertisement-slider.js
 * @description UI Slider logic for advertisements.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


/**
 * @description Builds and displays ad image slider inside specified container.
 *   Creates slides, dots, and navigation buttons, handles auto-play and manual interactions.
 * @function buildSlider
 * @param {HTMLElement} container - DOM element to contain the slider.
 * @param {Object[]} adImages - Array of ad image objects {url, query}.
 * @returns {void}
 */
function buildSlider(container, adImages) {
    // If no images, show message
    if (adImages.length === 0) {
        container.innerHTML = '<p class="no-ads-message">لا توجد إعلانات حالياً تاكد من الاتصال بالانترنت</p>';
        container.style.height = 'auto'; // Adjust height
        return;
    }

    // Build slider structure
    container.innerHTML = `
    <div class="ad-slider-track"></div>
    <div class="ad-slider-dots"></div>
    <!-- ✅ NEW: Navigation Buttons -->
    <button class="ad-slider-nav prev" aria-label="Previous Slide"><i class="fas fa-chevron-left"></i></button>
    <button class="ad-slider-nav next" aria-label="Next Slide"><i class="fas fa-chevron-right"></i></button>
  `;

    const track = container.querySelector('.ad-slider-track');
    const dotsContainer = container.querySelector('.ad-slider-dots');
    const slides = [];
    const dots = [];
    let currentIndex = 0;
    let autoPlayInterval = null;

    const prevButton = container.querySelector('.ad-slider-nav.prev');
    const nextButton = container.querySelector('.ad-slider-nav.next');

    // Create slides and dots
    adImages.forEach((imageData, index) => {
        const slide = document.createElement('div');
        slide.className = 'ad-slide';
        slide.style.backgroundImage = `url(${imageData.url})`;
        slide.dataset.query = imageData.query || '';
        track.appendChild(slide);

        slide.addEventListener('click', () => {
            const query = slide.dataset.query;
            if (query && query.trim() !== '') {
                console.log(`[AdverModule] User clicked on ad. Setting pending search query: "${query}" and redirecting to search page.`);
                LocalDBStorage.setItem('pendingSearchQuery', query);
                window.location.href = '/pages/search/search.html';
            }
        });

        let touchStartX = 0;
        let touchEndX = 0;

        slide.addEventListener('mousedown', pauseAutoPlay);
        slide.addEventListener('mouseup', startAutoPlay);

        slide.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
            pauseAutoPlay();
        }, { passive: true });

        slide.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            startAutoPlay();
            handleGesture();
        }, { passive: true });

        function handleGesture() {
            const deltaX = touchEndX - touchStartX;
            const threshold = 50;
            if (deltaX > threshold) {
                goToSlide(currentIndex - 1);
            } else if (deltaX < -threshold) {
                goToSlide(currentIndex + 1);
            }
        }

        slides.push(slide);

        const dot = document.createElement('div');
        dot.className = 'ad-slider-dot';
        dot.addEventListener('click', () => goToSlide(index));
        dotsContainer.appendChild(dot);
        dots.push(dot);
    });

    function goToSlide(index) {
        const newIndex = (index + slides.length) % slides.length;
        currentIndex = newIndex;

        slides.forEach((slide, i) => {
            const totalSlides = slides.length;
            const directOffset = i - currentIndex;
            const wrapOffset = directOffset > 0 ? directOffset - totalSlides : directOffset + totalSlides;
            const offset = Math.abs(directOffset) < Math.abs(wrapOffset) ? directOffset : wrapOffset;

            const isActive = offset === 0;
            const translateX = offset * 55;
            const scale = isActive ? 1 : 0.7;
            const translateZ = -Math.abs(offset) * 50;

            slide.style.transform = `translateX(${translateX}%) translateZ(${translateZ}px) scale(${scale})`;
            slide.classList.toggle('active', isActive);

            slide.onclick = () => goToSlide(i);
        });

        dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
        LocalDBSession.setItem('adver_last_slide_index', currentIndex);

        if (slides.length > 1) {
            resetAutoPlay();
        }
    }

    function startAutoPlay() {
        if (autoPlayInterval) clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(() => goToSlide(currentIndex + 1), 4000);
    }

    function pauseAutoPlay() {
        clearInterval(autoPlayInterval);
    }

    function resetAutoPlay() {
        pauseAutoPlay();
        startAutoPlay();
    }

    if (slides.length > 0) {
        let savedIndex = parseInt(LocalDBSession.getItem('adver_last_slide_index')) || 0;
        if (savedIndex >= slides.length) savedIndex = 0;
        goToSlide(savedIndex);

        if (slides.length > 1) {
            startAutoPlay();
            prevButton.style.display = 'flex';
            nextButton.style.display = 'flex';

            prevButton.addEventListener('click', () => {
                goToSlide(currentIndex - 1);
            });

            nextButton.addEventListener('click', () => {
                goToSlide(currentIndex + 1);
            });
        } else {
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
            dotsContainer.style.display = 'none';
        }
    }
}
