/**
 * @file pages/contact/js/contact-form.js
 * @description Handles contact form submission via mailto.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function contact_initForm() {
    try {
        const form = document.getElementById("contact_contactForm");
        if (!form) return;

        const L = function (key, fallback) {
            if (typeof window.langu === 'function') {
                return window.langu(key) || fallback;
            }
            return fallback;
        };

        form.addEventListener("submit", function (e) {
            try {
                e.preventDefault();

                const name = document.getElementById("contact_name").value.trim();
                const email = document.getElementById("contact_email").value.trim();
                const phone = document.getElementById("contact_phone").value.trim();
                const service = document.getElementById("contact_service").value;
                const message = document.getElementById("contact_message").value.trim();

                if (!name || !email || !message) {
                    alert(L('contact_form_required_alert', 'Please fill in the required fields (name, email, message)'));
                    return;
                }

                const subjectTemplate = L('contact_mail_subject', 'Message from {name} - Contact Form');
                const subject = subjectTemplate.replace('{name}', name);

                let body = `${L('contact_mail_name', 'Name')}: ${name}\n`;
                body += `${L('contact_mail_email', 'Email')}: ${email}\n`;
                if (phone) body += `${L('contact_mail_phone', 'Phone')}: ${phone}\n`;

                if (service) {
                    const serviceNames = {
                        consulting: L('contact_option_consulting', 'Marketing Consulting'),
                        digital: L('contact_option_digital', 'Digital Marketing'),
                        branding: L('contact_option_branding', 'Brand Identity Design'),
                        other: L('contact_option_other', 'Other Service')
                    };
                    body += `${L('contact_mail_service', 'Service Type')}: ${serviceNames[service] || service}\n`;
                }

                body += `\n${L('contact_mail_message', 'Message')}:\n${message}`;

                const mailtoLink = `mailto:suezbazaar@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                window.location.href = mailtoLink;

                setTimeout(function () {
                    form.reset();
                }, 500);
            } catch (error) {
                console.error("[Contact Form] Submission error:", error);
            }
        });
    } catch (error) {
        console.error("[Contact Form] Initialization error:", error);
    }
}

window.contact_initForm = contact_initForm;
