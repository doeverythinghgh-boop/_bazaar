/**
 * @file js/core-loader-bootstrap.js
 * @description Centralized bootstrapper for core application resources.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


(function () {
    'use strict';

    if (!window.LocalDB) document.write('<script src="/LocalDatabasesProject/local-db.js"></script>');
    document.write('<script src="/js/runtime-config.js"></script>');
    document.write('<script src="/js/core-loader-maintenance.js"></script>');
    document.write('<script src="/js/core-loader-resources.js"></script>');

    const loaderScript =
        "(function () {" +
        "  'use strict';" +
        "  const behavior = window.AppBehavior || { enableSecurityShield: true, enablePWA: true };" +
        "  const securityShieldEnabled = behavior.enableSecurityShield !== false;" +
        "  const pwaEnabled = behavior.enablePWA !== false;" +
        "  if (typeof window.coreLoaderRunMaintenanceGate === 'function' && window.coreLoaderRunMaintenanceGate()) return;" +
        "  const resources = Array.isArray(window.coreLoaderResources) ? window.coreLoaderResources : [];" +
        "  function resourceExists(resource) {" +
        "    const attr = resource.type === 'script' ? 'src' : (resource.type === 'link' ? 'href' : null);" +
        "    if (!attr) return false;" +
        "    const val = resource.attributes[attr];" +
        "    const tags = document.querySelectorAll(resource.type);" +
        "    for (let i = 0; i < tags.length; i++) {" +
        "      const tagValue = tags[i].getAttribute(attr);" +
        "      if (tagValue === val || (tagValue && tagValue.startsWith(val + '?'))) return true;" +
        "    }" +
        "    return false;" +
        "  }" +
        "  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';" +
        "  resources.forEach(function (res) {" +
        "    if (isLocal && (res.attributes.src === '/js/security-shield.js' || res.attributes.rel === 'manifest')) return;" +
        "    if (!securityShieldEnabled && res.attributes.src === '/js/security-shield.js') return;" +
        "    if (!pwaEnabled && (res.attributes.rel === 'manifest' || res.attributes.src === '/js/app-pwa-nav.js')) return;" +
        "    if (resourceExists(res)) return;" +
        "    let attrStr = '';" +
        "    Object.keys(res.attributes).forEach(function (k) { attrStr += ' ' + k + '=\\\"' + res.attributes[k] + '\\\"'; });" +
        "    if (res.defer) attrStr += ' defer';" +
        "    if (res.type === 'meta' || res.type === 'link') document.write('<' + res.type + attrStr + '>');" +
        "    else if (res.type === 'script') document.write('<' + res.type + attrStr + '></' + res.type + '>');" +
        "  });" +
        "  if (!document.title) document.title = 'Suez Bazaar';" +
        "  if (window.Android || isLocal || !pwaEnabled) document.write('<style>#pwa-splash-screen { display: none !important; }</style>');" +
        "})();";

    document.write('<script>' + loaderScript + '</script>');
})();
