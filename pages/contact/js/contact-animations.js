/**
 * @file pages/contact/js/contact-animations.js
 * @description Scroll animations for service cards on the contact page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function contact_initAnimations() {
    try {
        if (!('IntersectionObserver' in window)) {
            // Fallback for older browsers
            document.querySelectorAll(".contact_service-card").forEach(card => card.style.opacity = "1");
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                    observer.unobserve(entry.target); // Trigger once
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll(".contact_service-card").forEach((card) => {
            card.style.opacity = "0";
            card.style.transform = "translateY(15px)";
            card.style.transition = "opacity 0.6s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)";
            observer.observe(card);
        });
    } catch (error) {
        console.error("[Contact Animations] Error setting up observer:", error);
    }
}

window.contact_initAnimations = contact_initAnimations;
