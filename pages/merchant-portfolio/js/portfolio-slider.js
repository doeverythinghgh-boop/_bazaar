/**
 * @file pages/merchant-portfolio/js/portfolio-slider.js
 * @description Slider logic for merchant portfolio cover images.
 */

window.portfolioActiveSlideIndex = 0;
window.portfolioSliderAutoPlayInterval = null;

function portfolioCleanupTrackListeners(track) {
    if (!track || !track._portfolioSwipeHandlers) return;

    const { touchstart, touchend } = track._portfolioSwipeHandlers;
    if (touchstart) track.removeEventListener('touchstart', touchstart);
    if (touchend) track.removeEventListener('touchend', touchend);
    delete track._portfolioSwipeHandlers;
}

function portfolioBindSwipe(track) {
    if (!track) return;

    portfolioCleanupTrackListeners(track);

    let touchStartX = 0;
    let touchEndX = 0;

    const touchstart = (e) => {
        touchStartX = e.changedTouches[0].screenX;
        clearInterval(window.portfolioSliderAutoPlayInterval);
    };

    const touchend = (e) => {
        touchEndX = e.changedTouches[0].screenX;
        const swipeDistance = touchEndX - touchStartX;
        const threshold = 50;
        const isRTL = document.documentElement.dir === 'rtl';

        // 💡 Natural Physical Logic:
        // LTR: Swipe Left (dist < 0) -> Next | Swipe Right (dist > 0) -> Prev
        // RTL: Swipe Left (dist < 0) -> Prev | Swipe Right (dist > 0) -> Next
        if (Math.abs(swipeDistance) > threshold) {
            if (swipeDistance > 0) {
                // Dragging Right
                isRTL ? portfolioNextSlide() : portfolioPrevSlide();
            } else {
                // Dragging Left
                isRTL ? portfolioPrevSlide() : portfolioNextSlide();
            }
        } else {
            portfolioStartAutoPlay();
        }
    };

    track.addEventListener('touchstart', touchstart, { passive: true });
    track.addEventListener('touchend', touchend, { passive: true });
    track._portfolioSwipeHandlers = { touchstart, touchend };
}

function portfolioApplySingleSlideLayout(slide) {
    if (!slide) return;

    slide.classList.add('active');
    slide.style.position = 'relative';
    slide.style.insetInlineStart = 'auto';
    slide.style.insetInlineEnd = 'auto';
    slide.style.left = 'auto';
    slide.style.right = 'auto';
    slide.style.width = 'min(88%, 920px)';
    slide.style.maxWidth = '920px';
    slide.style.marginInline = 'auto';
    slide.style.transform = 'none';
    slide.style.opacity = '1';
    slide.style.zIndex = '2';
    slide.style.filter = 'none';
}

function portfolioBuildEmptyCoverMarkup() {
    return `<div class="portfolio-cover-placeholder portfolio-cover-brand-empty"></div>`;
}

function portfolioInitializeSlider(covers) {
    const track = document.getElementById('portfolio-cover-track');
    const dotsContainer = document.getElementById('portfolio-cover-dots');
    const prevBtn = document.getElementById('portfolio-cover-prev');
    const nextBtn = document.getElementById('portfolio-cover-next');

    if (!track) return;

    clearInterval(window.portfolioSliderAutoPlayInterval);
    portfolioCleanupTrackListeners(track);
    window.portfolioActiveSlideIndex = 0;

    const activeCovers = covers.filter(c => c && c.trim() !== "");
    track.innerHTML = "";
    track.classList.remove('single-slide-mode');
    dotsContainer.innerHTML = "";

    if (activeCovers.length === 0) {
        track.innerHTML = `
            <div class="ad-slide active placeholder-slide">
                ${portfolioBuildEmptyCoverMarkup()}
            </div>
        `;
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        return;
    }

    activeCovers.forEach((cover, index) => {
        const slide = document.createElement("div");
        slide.className = `ad-slide`;
        const coverUrl = getPublicR2FileUrl(cover);
        slide.style.backgroundImage = `url('${coverUrl}')`;
        track.appendChild(slide);

        if (activeCovers.length > 1) {
            const dot = document.createElement("div");
            dot.className = `ad-dot`;
            dot.onclick = () => portfolioGoToSlide(index);
            dotsContainer.appendChild(dot);
        }
    });

    if (activeCovers.length > 1) {
        if (prevBtn) {
            prevBtn.style.display = "flex";
            prevBtn.onclick = () => portfolioPrevSlide();
        }
        if (nextBtn) {
            nextBtn.style.display = "flex";
            nextBtn.onclick = () => portfolioNextSlide();
        }

        portfolioBindSwipe(track);
        portfolioStartAutoPlay();
    } else {
        if (prevBtn) prevBtn.style.display = "none";
        if (nextBtn) nextBtn.style.display = "none";

        track.classList.add('single-slide-mode');
        const singleSlide = track.querySelector('.ad-slide');
        if (singleSlide) {
            portfolioApplySingleSlideLayout(singleSlide);
        }
    }

    portfolioGoToSlide(0);
}

function portfolioGoToSlide(index) {
    const slides = document.querySelectorAll("#portfolio-cover-track .ad-slide");
    const dots = document.querySelectorAll("#portfolio-cover-dots .ad-dot");
    if (slides.length === 0) return;
    if (slides.length === 1) {
        portfolioApplySingleSlideLayout(slides[0]);
        return;
    }

    const totalSlides = slides.length;
    const newIndex = (index + totalSlides) % totalSlides;
    window.portfolioActiveSlideIndex = newIndex;

    slides.forEach((slide, i) => {
        const directOffset = i - window.portfolioActiveSlideIndex;
        const wrapOffset = directOffset > 0 ? directOffset - totalSlides : directOffset + totalSlides;
        const offset = Math.abs(directOffset) < Math.abs(wrapOffset) ? directOffset : wrapOffset;

        const isActive = offset === 0;
        const dirMultiplier = (document.documentElement.dir === 'rtl' ? -1 : 1);
        const translateX = offset * 55 * dirMultiplier;
        const scale = isActive ? 1 : 0.75;
        const translateZ = -Math.abs(offset) * 100;
        const opacity = isActive ? 1 : 0.6;

        slide.style.transform = `translateX(${translateX}%) translateZ(${translateZ}px) scale(${scale})`;
        slide.style.opacity = opacity;
        slide.style.zIndex = isActive ? 2 : 1;
        slide.classList.toggle('active', isActive);

        // Optional Blur for non-active
        slide.style.filter = isActive ? 'none' : 'blur(2px) brightness(0.8)';
    });

    dots.forEach((dot, i) => dot.classList.toggle('active', i === window.portfolioActiveSlideIndex));
    portfolioStartAutoPlay();
}

function portfolioNextSlide() {
    portfolioGoToSlide(window.portfolioActiveSlideIndex + 1);
}

function portfolioPrevSlide() {
    portfolioGoToSlide(window.portfolioActiveSlideIndex - 1);
}

function portfolioStartAutoPlay() {
    clearInterval(window.portfolioSliderAutoPlayInterval);
    window.portfolioSliderAutoPlayInterval = setInterval(() => {
        portfolioNextSlide();
    }, 5000);
}
