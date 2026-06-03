/**
 * @file pages/cardPackage/js/smartDeliveryRoute-permutations.js
 * @description Permutation helpers for smart delivery routing.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


function generatePermutations(array) {
    if (array.length === 0) return [[]];

    return array.flatMap((item, index) => {
        const remaining = array.filter((_, i) => i !== index);
        return generatePermutations(remaining).map((permutation) => [
            item,
            ...permutation
        ]);
    });
}
