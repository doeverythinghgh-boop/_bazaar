/**
 * @file analyzer-logic.js
 * @description Computation and pattern analysis logic for the Image Analyzer.
 */
/**
 * DEVELOPER NOTICE:
 * All terminal/console messages must be in pure English without emojis or translation keys.
 * Technical errors (exceptions) should only be logged to the console and not displayed via Swal.
 * Every developer must ensure that the terminal reflects code execution step by step,
 * logging each significant operation in sequence so the execution flow is fully traceable.
 */


window.computeAnalyzerResults = function () {
    const state = window.AnalyzerState;
    state.results = [];

    // 1. Create a Normalized Map for R2 Files (Path-Aware)
    console.log("[Logic] Starting Normalization: Preserving R2 keys and checking for base-name collisions...");
    const r2NormalizationMap = new Map();
    state.r2Files.forEach(key => {
        // We keep the full key for exact matching, but monitor base-name collisions
        const normalizedKey = key.split('?')[0].toLowerCase().trim();
        const baseName = normalizedKey.split(/[/\\]/).pop();

        if (normalizedKey) {
            if (r2NormalizationMap.has(normalizedKey)) {
                console.warn(`[Logic] ️ Exact Key Collision (Unexpected): ${normalizedKey}`);
            }
            r2NormalizationMap.set(normalizedKey, key);
        }
    });
    console.log(`[Logic] R2 Normalization complete. ${r2NormalizationMap.size} unique paths indexed.`);

    // 2. Create a Normalized Set for all keys to check (Normalized Paths)
    const allUniquePaths = new Set([
        ...r2NormalizationMap.keys(),
        ...state.dbRefs.keys()
    ]);
    console.log(`[Logic] Comparison Universe: Analyzing ${allUniquePaths.size} unique paths/locations.`);

    // 3. Perform Analysis on Unique Paths
    console.log("[Logic] Cross-Referencing: Running Path-Aware Audit...");
    allUniquePaths.forEach(pathKey => {
        const inR2 = r2NormalizationMap.has(pathKey);
        const inDB = state.dbRefs.has(pathKey);
        const originalR2Name = r2NormalizationMap.get(pathKey);
        const dbMeta = state.dbRefs.get(pathKey);

        if (!inR2 && inDB && dbMeta?.optionalPresence) {
            return;
        }

        let status;
        if (inR2 && inDB) status = 'ACTIVE';
        else if (inR2 && !inDB) status = 'DEAD';
        else if (!inR2 && inDB) status = 'BROKEN';
        else return;

        // Determine display type
        let displayType = 'Unknown/Custom';
        if (dbMeta && dbMeta.type) {
            displayType = dbMeta.type;
        }

        // Deep Pattern Analysis for DEAD files
        if (status === 'DEAD') {
            const baseName = pathKey.split(/[/\\]/).pop();
            if (baseName.includes('avatar')) displayType = 'Deleted User Avatar';
            else if (baseName.includes('cover')) displayType = 'Deleted Shop Cover';
            else if (baseName.split('_').length >= 4) displayType = 'Old Order Photo';
            else if (baseName.length > 20 && !baseName.includes('_')) displayType = 'Possible Old Product';
        }

        state.results.push({
            name: originalR2Name || pathKey,
            baseName: pathKey, // Now contains path if applicable
            type: displayType,
            status: status,
            metadata: dbMeta || null
        });
    });

    // Sort: DEAD -> BROKEN -> ACTIVE
    state.results.sort((a, b) => {
        const order = { 'DEAD': 0, 'BROKEN': 1, 'ACTIVE': 2 };
        return order[a.status] - order[b.status];
    });

    console.log(`[Logic] Verification Audit Summary: >> Total Entries: ${state.results.length} >> [Green] Active/Verified: ${state.results.filter(r => r.status === 'ACTIVE').length} >> [Red] Dead/Unlinked (R2 only): ${state.results.filter(r => r.status === 'DEAD').length} >> [Yellow] Broken/Missing (DB only): ${state.results.filter(r => r.status === 'BROKEN').length}`);
};
