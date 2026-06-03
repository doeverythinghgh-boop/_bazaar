/**
 * @file pages/contact/js/contact-tabs.js
 * @description Unified tab switching logic for Form, Services, and Legal frames.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function contact_initTabs() {
    try {
        const section = document.getElementById("contact_form_services_section");
        const tabs = document.querySelectorAll(".contact_legal-tab");
        const contents = {
            form: document.getElementById("contact_form_div"),
            services: document.getElementById("contact_services_section"),
            privacy: document.getElementById("contact_legal_iframe_privacy"),
            delete: document.getElementById("contact_legal_iframe_delete")
        };

        if (!section || tabs.length === 0) return;

        tabs.forEach((tab) => {
            tab.addEventListener("click", () => {
                try {
                    const tabName = tab.getAttribute("data-tab");
                    const isActive = tab.classList.contains("contact_active");

                    // If already active and expanded, collapse the section
                    if (isActive && section.classList.contains("contact_expanded")) {
                        tab.classList.remove("contact_active");
                        Object.values(contents).forEach((content) => {
                            if (content) {
                                content.classList.remove("contact_tab_visible");
                                if (content.classList.contains("contact_legal-iframe")) {
                                    content.classList.add("contact_hidden");
                                    content.classList.remove("contact_visible");
                                }
                            }
                        });
                        section.classList.remove("contact_expanded");
                        return;
                    }

                    // Expand section if collapsed
                    if (!section.classList.contains("contact_expanded")) {
                        section.classList.add("contact_expanded");
                    }

                    // Reset all tabs and contents
                    tabs.forEach((t) => t.classList.remove("contact_active"));
                    tab.classList.add("contact_active");

                    Object.values(contents).forEach((content) => {
                        if (content) {
                            content.classList.remove("contact_tab_visible");
                            content.classList.add("contact_hidden");
                            content.classList.remove("contact_visible");
                        }
                    });

                    // Show selected content
                    const selectedContent = contents[tabName];
                    if (selectedContent) {
                        if (selectedContent.tagName === 'IFRAME') {
                            if (!selectedContent.src && selectedContent.hasAttribute("data-src")) {
                                selectedContent.src = selectedContent.getAttribute("data-src");
                            }
                        }

                        // Delay slightly for smoother transition
                        setTimeout(() => {
                            selectedContent.classList.remove("contact_hidden");
                            selectedContent.classList.add("contact_visible");
                            selectedContent.classList.add("contact_tab_visible");
                        }, 100);
                    }
                } catch (error) {
                    console.error("[Contact Tabs] Error switching tabs:", error);
                }
            });
        });
    } catch (error) {
        console.error("[Contact Tabs] Error during initialization:", error);
    }
}

window.contact_initTabs = contact_initTabs;
