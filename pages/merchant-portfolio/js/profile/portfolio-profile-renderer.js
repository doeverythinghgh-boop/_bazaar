/**
 * @file pages/merchant-portfolio/js/portfolio-profile-renderer.js
 * @description Coordinates merchant profile rendering.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function portfolioRenderProfile(user) {
    const settings = window.portfolioResolveProfileSettings(user);
    const specialtyData = window.portfolioResolveSpecialtyProfileData(user);

    console.log('[Portfolio] 5. Starting (Rendering)...');

    window.portfolioRenderProfileImages(user);
    window.portfolioRenderProfileHeaderActions(user);
    window.portfolioRenderProfileInfo(user);
    window.portfolioRenderProfileRatings(user, {
        settings: settings,
        specialtyViewModel: specialtyData.specialtyViewModel
    });
    window.portfolioRenderProfileTags(user, specialtyData);
    window.portfolioRenderProfileContacts(user, {
        specialtyViewModel: specialtyData.specialtyViewModel
    });

    console.log('[Portfolio] Done successfully.');
}

window.portfolioRenderProfile = portfolioRenderProfile;
