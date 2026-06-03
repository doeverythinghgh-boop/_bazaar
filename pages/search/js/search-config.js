/**
 * @file search-config.js
 * @description Shared constants and state for the search module.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


const ADMIN_KEY_SEARCH = window.SUPER_ADMIN_KEY || '';
const SEARCH_SESSION_KEY = 'search_page_state';
const SEARCH_LIMIT = 10;

let selectedSearchProducts = new Set();
let isAdminForSearch = false;
let currentResults = [];
let searchOffset = 0;

// Shared DOM references (will be populated in init)
let searchElements = {};
let merchantContext = null;

console.log(' [Search Module] - search-config.js loaded');
