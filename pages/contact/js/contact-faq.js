/**
 * @file pages/contact/js/contact-faq.js
 * @description FAQ toggle functionality for the contact page.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function contact_initFaq() {
    try {
        const sectionToggles = document.querySelectorAll(".contact_section-toggle");
        sectionToggles.forEach((toggle) => {
            toggle.addEventListener("click", () => {
                try {
                    const targetId = toggle.dataset.target;
                    if (!targetId) return;

                    const content = document.getElementById(targetId);
                    if (!content) return;

                    const isOpen = toggle.classList.contains("contact_section-toggle_active");
                    toggle.classList.toggle("contact_section-toggle_active", !isOpen);
                    toggle.setAttribute("aria-expanded", String(!isOpen));
                    content.classList.toggle("contact_section-content_open", !isOpen);

                    if (isOpen && targetId === "contact_faq_content") {
                        document.querySelectorAll(".contact_faq-item.contact_active").forEach((item) => {
                            item.classList.remove("contact_active");
                        });
                    }
                } catch (error) {
                    console.error("[Contact FAQ] Error toggling section:", error);
                }
            });
        });

        const questions = document.querySelectorAll(".contact_faq-question");
        if (questions.length === 0) return;

        questions.forEach((question) => {
            question.addEventListener("click", () => {
                try {
                    const faqContent = document.getElementById("contact_faq_content");
                    if (faqContent && !faqContent.classList.contains("contact_section-content_open")) {
                        return;
                    }

                    const faqItem = question.parentElement;
                    faqItem.classList.toggle("contact_active");

                    // Close other FAQ items
                    document.querySelectorAll(".contact_faq-item").forEach((item) => {
                        if (item !== faqItem) {
                            item.classList.remove("contact_active");
                        }
                    });
                } catch (error) {
                    console.error("[Contact FAQ] Error toggling item:", error);
                }
            });
        });
    } catch (error) {
        console.error("[Contact FAQ] Error initializing section:", error);
    }
}

window.contact_initFaq = contact_initFaq;
