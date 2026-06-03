/**
 * @file pages/register/js/register-whatsapp-auth.js
 * @description Premium WhatsApp Verification Flow
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function generateFourDigitRandomCode() {
    let code = '';
    for(let i=0; i<4; i++) {
        code += Math.floor(Math.random() * 9) + 1;
    }
    return code;
}

function injectPremiumStyles() {
    if (!document.getElementById('whatsapp-premium-styles')) {
        const style = document.createElement('style');
        style.id = 'whatsapp-premium-styles';
        style.textContent = `
            
            @keyframes wa-pop { 
                0% { transform: scale(0.9); opacity: 0; } 
                100% { transform: scale(1); opacity: 1; } 
            }
            
            @keyframes wa-shake {
                0%, 100% { transform: translateX(0); }
                20%, 60% { transform: translateX(-5px); }
                40%, 80% { transform: translateX(5px); }
            }

            .wa-overlay {
                position: fixed; inset: 0;
                background: rgba(17, 24, 39, 0.6);
                backdrop-filter: blur(8px);
                display: flex; align-items: center; justify-content: center;
                z-index: 999999;
                font-family: 'Tajawal', system-ui, -apple-system, sans-serif;
                direction: rtl;
            }

            .wa-modal {
                background: #ffffff;
                border-radius: 24px;
                width: calc(100% - 48px); max-width: 360px;
                margin: 0 auto; box-sizing: border-box;
                padding: 32px 24px;
                text-align: center;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                animation: wa-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

            .wa-icon-container {
                width: 72px; height: 72px;
                background: #ebfbf0;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                margin: 0 auto 20px auto;
                color: #25D366;
                font-size: 36px;
            }

            .wa-title {
                font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 10px 0;
            }

            .wa-desc {
                font-size: 15px; font-weight: 500; color: #6b7280; margin: 0 0 24px 0;
                line-height: 1.6;
            }

            .wa-btn {
                background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
                color: white;
                border: none;
                padding: 14px 24px;
                border-radius: 12px;
                font-family: inherit;
                font-weight: 700; font-size: 16px;
                cursor: pointer; width: 100%;
                transition: transform 0.2s, box-shadow 0.2s;
                box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
            }

            .wa-btn:active {
                transform: translateY(1px);
            }

            .wa-btn-cancel {
                background: transparent;
                color: #6b7280;
                border: 2px solid #e5e7eb;
                padding: 12px 24px;
                border-radius: 12px;
                font-family: inherit; font-weight: 700; font-size: 15px;
                cursor: pointer; width: 100%;
                margin-top: 12px;
                transition: all 0.2s;
            }


            .wa-otp-container {
                display: flex; justify-content: center; gap: 12px; margin-bottom: 24px;
                direction: ltr; /* OTP Typed LTR */
            }

            .wa-otp-input {
                width: 54px; height: 60px;
                border: 2px solid #e5e7eb;
                border-radius: 14px;
                font-size: 28px; font-weight: 700;
                text-align: center; color: #111827;
                background: #f9fafb;
                transition: all 0.2s;
                font-family: inherit;
                outline: none;
                box-sizing: border-box;
            }
            
            .wa-otp-input:focus {
                border-color: #25D366;
                background: #ffffff;
                box-shadow: 0 0 0 4px rgba(37, 211, 102, 0.1);
            }
            
            .wa-otp-input.error {
                border-color: #ef4444; background: #fef2f2;
                animation: wa-shake 0.4s ease-in-out;
            }

            .wa-error-msg {
                color: #ef4444; font-size: 14px; font-weight: 600;
                margin-top: -12px; margin-bottom: 16px;
                display: none; opacity: 0; transition: opacity 0.3s;
            }

            /* Responsive Adjustments for very small screens (like iPhone SE) */
            @media (max-width: 380px) {
                .wa-modal {
                    padding: 24px 16px;
                }
                .wa-otp-container {
                    gap: 8px; margin-bottom: 20px;
                }
                .wa-otp-input {
                    width: 44px; height: 52px;
                    font-size: 24px; border-radius: 10px;
                }
                .wa-icon-container {
                    width: 60px; height: 60px; font-size: 30px;
                    margin-bottom: 16px;
                }
                .wa-title { font-size: 18px; }
                .wa-desc { font-size: 14px; }
            }
        `;
        document.head.appendChild(style);
    }
}

window.showWhatsappInfoModal = function(phone) {
    injectPremiumStyles();
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'wa-overlay';

        const modal = document.createElement('div');
        modal.className = 'wa-modal';

        const iconContainer = document.createElement('div');
        iconContainer.className = 'wa-icon-container';
        iconContainer.innerHTML = '<i class="fab fa-whatsapp"></i>';

        const title = document.createElement('h3');
        title.className = 'wa-title';
        title.textContent = window.langu('wa_verify_title');

        const desc = document.createElement('p');
        desc.className = 'wa-desc';
        desc.innerHTML = window.langu('wa_verify_desc');

        const btn = document.createElement('button');
        btn.className = 'wa-btn';
        btn.textContent = window.langu('wa_verify_btn_go');

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'wa-btn-cancel';
        cancelBtn.textContent = window.langu('wa_verify_btn_cancel');

        btn.onclick = () => {
            document.body.removeChild(overlay);
            resolve(true);
        };

        cancelBtn.onclick = () => {
            document.body.removeChild(overlay);
            resolve(false);
        };

        modal.appendChild(iconContainer);
        modal.appendChild(title);
        modal.appendChild(desc);
        modal.appendChild(btn);
        modal.appendChild(cancelBtn);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    });
};

window.sendWhatsappVerificationCode = async function(phone, code) {
    const textMsg = window.langu('wa_msg_template', { code: code });
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMsg)}`;

    // فتح التطبيق الخاص بالواتساب في نافذة/تبويب جديد
    window.open(waUrl, '_blank');
    console.log(`[WhatsApp Link] Done Attempt : ${waUrl}`);
};

window.showWhatsappCodeModal = function(expectedCode) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'wa-overlay';

        const modal = document.createElement('div');
        modal.className = 'wa-modal';

        const iconContainer = document.createElement('div');
        iconContainer.className = 'wa-icon-container';
        iconContainer.style.color = '#3b82f6';
        iconContainer.style.background = '#eff6ff';
        iconContainer.innerHTML = '<i class="fas fa-shield-alt"></i>';

        const title = document.createElement('h3');
        title.className = 'wa-title';
        title.textContent = window.langu('wa_code_modal_title');

        const desc = document.createElement('p');
        desc.className = 'wa-desc';
        desc.textContent = window.langu('wa_code_modal_desc');

        const otpContainer = document.createElement('div');
        otpContainer.className = 'wa-otp-container';

        const inputs = [];
        for (let i = 0; i < 4; i++) {
            const input = document.createElement('input');
            input.type = 'tel'; // Shows numeric keyboard on mobile
            input.maxLength = 1;
            input.className = 'wa-otp-input no-voice';
            inputs.push(input);
            otpContainer.appendChild(input);

            // Handle typing
            input.addEventListener('input', (e) => {
                input.value = input.value.replace(/[^0-9]/g, '');

                // Clear errors on typing
                inputs.forEach(inp => inp.classList.remove('error'));
                msg.style.display = 'none';

                if (input.value && i < 3) {
                    inputs[i + 1].focus();
                }
            });

            // Handle backspace properly
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace') {
                    if (!input.value && i > 0) {
                        inputs[i - 1].focus();
                        inputs[i - 1].value = '';
                    }
                } else if (e.key === 'Enter') {
                    btn.click();
                }
            });
        }

        const msg = document.createElement('p');
        msg.className = 'wa-error-msg';
        msg.textContent = window.langu('wa_code_error_incorrect');

        const btn = document.createElement('button');
        btn.className = 'wa-btn';
        btn.style.background = 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
        btn.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
        btn.textContent = window.langu('wa_code_btn_confirm');

        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'wa-btn-cancel';
        cancelBtn.textContent = window.langu('wa_code_btn_edit');

        btn.onclick = () => {
            const code = inputs.map(inp => inp.value).join('');
            if (code === expectedCode) {
                // Success logic
                btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${window.langu('wa_verifying_loader')}`;
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    resolve(true); // Verified
                }, 400); // 400ms for smoothness
            } else {
                // Error Trigger
                inputs.forEach(inp => inp.classList.add('error'));
                msg.style.display = 'block';
                setTimeout(() => msg.style.opacity = '1', 10);

                if (navigator.vibrate) navigator.vibrate(200);
            }
        };

        cancelBtn.onclick = () => {
            document.body.removeChild(overlay);
            resolve(false);
        };

        modal.appendChild(iconContainer);
        modal.appendChild(title);
        modal.appendChild(desc);
        modal.appendChild(otpContainer);
        modal.appendChild(msg);
        modal.appendChild(btn);
        modal.appendChild(cancelBtn);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);

        // Autofocus first input when the animation settles
        setTimeout(() => inputs[0].focus(), 400);
    });
};

function clearUserPhoneInput(phone) {
    // Find all phone inputs on the page
    const inputs = document.querySelectorAll('.register-phone-number-input, input[type="tel"]');
    inputs.forEach(inp => {
        // Clear if it loosely matches the digits of the searched phone
        if (inp.value && phone && inp.value.replace(/\\D/g, '') === phone.replace(/\\D/g, '')) {
            inp.value = '';
            // Dispatch event to trigger frontend validation to remove green marks
            inp.dispatchEvent(new Event('input', { bubbles: true }));
            inp.dispatchEvent(new Event('change', { bubbles: true }));
        }
    });

    // Also clear error text if present
    const els = typeof registerGetElements === 'function' ? registerGetElements() : null;
    if (els && els.phoneError) {
        els.phoneError.textContent = "";
    }
}

window.startWhatsappVerificationFlow = async function(phone) {
    if (!phone) return false;

    // 1. Info Modal -> If canceled, clear phone and abort
    const proceed = await window.showWhatsappInfoModal(phone);
    if (!proceed) {
        clearUserPhoneInput(phone);
        return false;
    }

    // Tiny delay ensures first modal is cleanly destroyed
    await new Promise(r => setTimeout(r, 100));

    // 2. Generate and Send Code
    const secureCode = generateFourDigitRandomCode();
    await window.sendWhatsappVerificationCode(phone, secureCode);
    console.info(`[DEV Whatsapp Code] ${secureCode}`);

    // 3. Verification Modal -> If canceled, clear phone and abort
    const isVerified = await window.showWhatsappCodeModal(secureCode);

    if (!isVerified) {
        clearUserPhoneInput(phone);
        return false;
    }

    return true;
};
