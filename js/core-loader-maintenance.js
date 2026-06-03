/**
 * @file js/core-loader-maintenance.js
 * @description Maintenance gate logic for core loader bootstrap.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.coreLoaderRunMaintenanceGate = function () {
    const behavior = window.AppBehavior || { isUnderMaintenance: false };
    const maintenanceConfig = typeof window.getBazaarMaintenanceConfig === 'function'
        ? window.getBazaarMaintenanceConfig()
        : {};
    const bypassKey = maintenanceConfig.bypassStorageKey || 'maint_bypass_auth_default';
    const bypassValue = maintenanceConfig.bypassCode || '';
    const hasBypass = bypassValue && LocalDBStorage.getItem(bypassKey) === bypassValue;
    const isUnderMaintenance = behavior.isUnderMaintenance && !hasBypass;

    if (!isUnderMaintenance) return false;

    const lang = LocalDBStorage.getItem('app_language') || 'ar';
    const renderUI = (translate) => {
        window.validateMaintBypass = function () {
            const input = document.getElementById('maint-bypass-input').value;
            if (input === bypassValue) {
                LocalDBStorage.setItem(bypassKey, bypassValue);
                window.location.reload();
            } else {
                alert(translate('maint_error_pwd'));
            }
        };

        const dir = lang === 'ar' ? 'rtl' : 'ltr';
        document.documentElement.innerHTML =
            '<div style="height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#0a192f; color:white; font-family:sans-serif; text-align:center; padding:20px; direction:' + dir + ';">' +
            '<div style="font-size:60px; margin-bottom:20px;">🛠️</div>' +
            '<h1 style="color:#64ffda; margin: 0 0 10px 0;">' + translate('maint_title') + '</h1>' +
            '<p style="opacity:0.8; font-size: 18px; margin-bottom: 30px;">' + translate('maint_desc') + '</p>' +
            '<div style="background: rgba(255,255,255,0.05); padding: 25px; border-radius: 15px; border: 1px solid rgba(100, 255, 218, 0.2); backdrop-filter: blur(10px);">' +
            '<input type="password" id="maint-bypass-input" placeholder="' + translate('maint_input_placeholder') + '" style="padding: 12px; border-radius: 8px; border: 1px solid #64ffda; background: transparent; color: white; text-align: center; outline: none; width: 220px; font-size: 16px; margin-bottom: 15px; display: block;">' +
            '<button onclick="window.validateMaintBypass()" style="padding: 12px; width: 100%; border-radius: 8px; border: none; background: #64ffda; color: #0a192f; font-weight: bold; cursor: pointer; font-size: 16px; transition: all 0.3s ease;">' +
            translate('maint_bypass_btn') +
            '</button>' +
            '</div>' +
            '<div style="margin-top: 40px; font-size: 12px; opacity: 0.5; letter-spacing: 1px;">SUEZ BAZAAR &bull; CORE SYSTEM</div>' +
            '</div>';

        setTimeout(() => {
            const inputEl = document.getElementById('maint-bypass-input');
            if (inputEl) {
                inputEl.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') window.validateMaintBypass();
                });
            }
        }, 0);
    };

    fetch('/lang/core.json')
        .then((res) => res.json())
        .then((data) => {
            renderUI((key) => (data[key] && data[key][lang]) ? data[key][lang] : (data[key] ? data[key].ar : key));
        })
        .catch(() => {
            const fallbacks = {
                ar: {
                    maint_title: 'التطبيق قيد التحديث',
                    maint_desc: 'نحن نقوم ببعض التحسينات الآن، سنعود قريباً جداً.',
                    maint_input_placeholder: 'كلمة مرور الإدارة',
                    maint_bypass_btn: 'تجاوز النظام',
                    maint_error_pwd: 'كلمة المرور غير صحيحة'
                },
                en: {
                    maint_title: 'Application Updating',
                    maint_desc: 'Work in progress, back soon.',
                    maint_input_placeholder: 'Admin Password',
                    maint_bypass_btn: 'Bypass',
                    maint_error_pwd: 'Wrong password'
                }
            };
            renderUI((key) => (fallbacks[lang] && fallbacks[lang][key]) ? fallbacks[lang][key] : (fallbacks.ar[key] || key));
        });

    if (window.stop) window.stop();
    throw new Error('Application suspended: Maintenance Mode.');
};
