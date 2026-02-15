/**
 * @file pages/cardPackage/js/smartDeliveryRoute.js
 * @description Smart Delivery Route Optimizer
 * 
 * This module provides an intelligent algorithm to calculate the shortest
 * possible delivery route that:
 * 1. Starts from the delivery office
 * 2. Visits all sellers to collect items
 * 3. Ends at the customer's location
 * 4. Never revisits the same location twice
 * 
 * ALGORITHM APPROACH:
 * - Uses brute-force permutation generation
 * - Tests all possible seller visit orders
 * - Selects the route with minimum total distance
 * 
 * COMPLEXITY:
 * - Time: O(n!) where n = number of sellers
 * - Space: O(n!)
 * 
 * PERFORMANCE NOTE:
 * This solution is optimal for small numbers of sellers (≤ 7).
 * For larger numbers, consider using approximation algorithms like:
 * - Nearest Neighbor
 * - Genetic Algorithm
 * - Simulated Annealing
 * - Ant Colony Optimization
 * 
 * REAL-WORLD APPLICATION:
 * This is a variant of the Traveling Salesman Problem (TSP) with
 * fixed start (office) and end (customer) points.
 */

/**
 * Coordinate object representing a geographic location.
 * 
 * @typedef {Object} Coordinate
 * @property {number} lat - Latitude (decimal degrees, -90 to +90)
 * @property {number} lng - Longitude (decimal degrees, -180 to +180)
 * 
 * @example
 * const location = { lat: 30.0444, lng: 31.2357 }; // Cairo, Egypt
 */

/* ============================================================
   1️⃣ DISTANCE CALCULATION (EUCLIDEAN DISTANCE)
   ============================================================ */

/**
 * Calculates the Euclidean distance between two geographic points.
 * 
 * FORMULA:
 * distance = √[(lat₂ - lat₁)² + (lng₂ - lng₁)²]
 * 
 * NOTES:
 * - This is a simplified distance calculation suitable for short distances
 * - For more accurate results over long distances, use Haversine formula
 * - Assumes flat Earth approximation (acceptable for city-scale distances)
 * - Does not account for actual road networks or obstacles
 * 
 * WHEN TO USE:
 * ✓ Short distances (< 100 km)
 * ✓ Quick approximations
 * ✓ Performance-critical applications
 * 
 * WHEN NOT TO USE:
 * ✗ Long distances (> 100 km)
 * ✗ High-precision navigation
 * ✗ Cross-continental calculations
 * 
 * @function calculateDistance
 * @param {Coordinate} pointA - First location (starting point)
 * @param {Coordinate} pointB - Second location (ending point)
 * @returns {number} Euclidean distance between the two points
 * 
 * @example
 * const office = { lat: 30.0444, lng: 31.2357 };
 * const seller = { lat: 30.0500, lng: 31.2400 };
 * const distance = calculateDistance(office, seller);
 * // Returns: ~0.0067 (in coordinate units)
 * 
 * @example
 * // To convert to approximate kilometers (rough estimate):
 * const distanceKm = distance * 111; // 1 degree ≈ 111 km
 */
function calculateDistance(pointA, pointB) {
    // Calculate the difference in latitude
    // This represents the vertical distance component
    const latDiff = pointB.lat - pointA.lat;

    // Calculate the difference in longitude
    // This represents the horizontal distance component
    const lngDiff = pointB.lng - pointA.lng;

    // Apply Pythagorean theorem: c² = a² + b²
    // Then take square root to get actual distance
    // Using ** operator for exponentiation (ES2016+)
    return Math.sqrt(latDiff ** 2 + lngDiff ** 2);
}

/* ============================================================
   2️⃣ PERMUTATION GENERATION (ALL POSSIBLE ORDERS)
   ============================================================ */

/**
 * Generates all possible permutations of an array.
 * 
 * ALGORITHM:
 * - Recursive approach using backtracking
 * - For each element, generate permutations of remaining elements
 * - Prepend current element to each sub-permutation
 * 
 * COMPLEXITY:
 * - Time: O(n! × n) - factorial time complexity
 * - Space: O(n!) - stores all permutations
 * 
 * PERMUTATION COUNT:
 * - 3 sellers: 3! = 6 permutations
 * - 4 sellers: 4! = 24 permutations
 * - 5 sellers: 5! = 120 permutations
 * - 6 sellers: 6! = 720 permutations
 * - 7 sellers: 7! = 5,040 permutations
 * - 8 sellers: 8! = 40,320 permutations (may be slow)
 * 
 * @function generatePermutations
 * @param {Array<Coordinate>} array - Array of seller locations to permute
 * @returns {Array<Array<Coordinate>>} Array of all possible orderings
 * 
 * @example
 * const sellers = [
 *   { lat: 30.01, lng: 31.20 },
 *   { lat: 30.02, lng: 31.21 },
 *   { lat: 30.03, lng: 31.22 }
 * ];
 * const allOrders = generatePermutations(sellers);
 * // Returns 6 different orderings (3! = 6)
 * // [
 * //   [seller1, seller2, seller3],
 * //   [seller1, seller3, seller2],
 * //   [seller2, seller1, seller3],
 * //   [seller2, seller3, seller1],
 * //   [seller3, seller1, seller2],
 * //   [seller3, seller2, seller1]
 * // ]
 */
function generatePermutations(array) {
    // BASE CASE: Empty array has one permutation (empty array)
    if (array.length === 0) return [[]];

    // RECURSIVE CASE: Generate permutations for each element as first item
    return array.flatMap((item, index) => {
        // Get all elements except the current one
        // This creates a new array without modifying the original
        const remaining = array.filter((_, i) => i !== index);

        // Recursively generate permutations of remaining elements
        // Then prepend current item to each permutation
        return generatePermutations(remaining).map(permutation => [
            item,           // Current element goes first
            ...permutation, // Spread remaining permutation
        ]);
    });
}

/* ============================================================
   3️⃣ ROUTE DISTANCE CALCULATION (TOTAL PATH LENGTH)
   ============================================================ */

/**
 * Calculates the total distance for a complete delivery route.
 * 
 * ROUTE STRUCTURE:
 * Office → Seller₁ → Seller₂ → ... → Sellerₙ → Customer
 * 
 * CALCULATION STEPS:
 * 1. Distance from office to first seller
 * 2. Sum of distances between consecutive sellers
 * 3. Distance from last seller to customer
 * 
 * EXAMPLE ROUTE:
 * Office (A) → Seller1 (B) → Seller2 (C) → Customer (D)
 * Total = dist(A,B) + dist(B,C) + dist(C,D)
 * 
 * @function calculateRouteDistance
 * @param {Coordinate} office - Delivery office starting point
 * @param {Array<Coordinate>} sellersPath - Ordered array of sellers to visit
 * @param {Coordinate} customer - Final destination (customer location)
 * @returns {number} Total distance of the complete route
 * 
 * @example
 * const office = { lat: 30.0444, lng: 31.2357 };
 * const sellers = [
 *   { lat: 30.0460, lng: 31.2380 },
 *   { lat: 30.0480, lng: 31.2330 }
 * ];
 * const customer = { lat: 30.0500, lng: 31.2400 };
 * 
 * const totalDistance = calculateRouteDistance(office, sellers, customer);
 * // Calculates: office→seller1 + seller1→seller2 + seller2→customer
 */
function calculateRouteDistance(office, sellersPath, customer) {
    // Initialize total distance accumulator
    let totalDistance = 0;

    // ========================================
    // SEGMENT 1: Office to First Seller
    // ========================================
    // This is the initial leg of the journey
    // Driver leaves office and goes to first pickup location
    totalDistance += calculateDistance(office, sellersPath[0]);

    // ========================================
    // SEGMENT 2: Between All Sellers
    // ========================================
    // Loop through consecutive pairs of sellers
    // Calculate distance from each seller to the next
    // This represents the collection phase of the delivery
    for (let i = 0; i < sellersPath.length - 1; i++) {
        totalDistance += calculateDistance(
            sellersPath[i],     // Current seller location
            sellersPath[i + 1]  // Next seller location
        );
    }

    // ========================================
    // SEGMENT 3: Last Seller to Customer
    // ========================================
    // This is the final delivery leg
    // Driver has collected all items and delivers to customer
    totalDistance += calculateDistance(
        sellersPath[sellersPath.length - 1], // Last seller in the path
        customer                              // Final destination
    );

    return totalDistance;
}

/* ============================================================
   4️⃣ MAIN OPTIMIZATION FUNCTION (SHORTEST PATH FINDER)
   ============================================================ */

/**
 * Finds the shortest possible delivery route using brute-force optimization.
 * 
 * PROBLEM TYPE:
 * This is a variant of the Traveling Salesman Problem (TSP) with:
 * - Fixed starting point (office)
 * - Fixed ending point (customer)
 * - Variable middle points (sellers)
 * 
 * ALGORITHM STEPS:
 * 1. Generate all possible orderings of sellers (permutations)
 * 2. For each ordering, calculate total route distance
 * 3. Track the ordering with minimum distance
 * 4. Return the optimal route and its distance
 * 
 * OPTIMIZATION APPROACH:
 * - Exhaustive search (brute-force)
 * - Guarantees optimal solution
 * - Practical for small problem sizes (≤ 7 sellers)
 * 
 * TIME COMPLEXITY:
 * O(n! × n) where n = number of sellers
 * - n! permutations to generate
 * - n distance calculations per permutation
 * 
 * SPACE COMPLEXITY:
 * O(n!) to store all permutations
 * 
 * PERFORMANCE BENCHMARKS:
 * - 3 sellers: ~6 calculations (instant)
 * - 5 sellers: ~120 calculations (< 1ms)
 * - 7 sellers: ~5,040 calculations (< 10ms)
 * - 10 sellers: ~3,628,800 calculations (may freeze)
 * 
 * @function findShortestDeliveryRoute
 * 
 * @param {Coordinate} office - Starting point (delivery office location)
 * @param {Coordinate} customer - Ending point (customer delivery address)
 * @param {Array<Coordinate>} sellers - Array of seller locations to visit
 * 
 * @returns {Object} Optimization result object
 * @returns {number} returns.distance - Shortest total distance found
 * @returns {Array<Coordinate>} returns.route - Optimal ordering of sellers
 * 
 * @example
 * // Simple example with 3 sellers
 * const office = { lat: 30.0444, lng: 31.2357 };
 * const customer = { lat: 30.0500, lng: 31.2400 };
 * const sellers = [
 *   { lat: 30.0460, lng: 31.2380 }, // Seller A
 *   { lat: 30.0600, lng: 31.2500 }, // Seller B
 *   { lat: 30.0480, lng: 31.2330 }  // Seller C
 * ];
 * 
 * const result = findShortestDeliveryRoute(office, customer, sellers);
 * console.log("Shortest distance:", result.distance);
 * console.log("Optimal seller order:", result.route);
 * // Output might be:
 * // Shortest distance: 0.0234
 * // Optimal seller order: [Seller A, Seller C, Seller B]
 * 
 * @example
 * // Edge case: No sellers (direct delivery)
 * const result = findShortestDeliveryRoute(office, customer, []);
 * // Returns direct distance from office to customer
 * // route will be empty array
 */
function findShortestDeliveryRoute(office, customer, sellers) {
    // ========================================
    // EDGE CASE: No Sellers (Direct Delivery)
    // ========================================
    // If there are no sellers to visit, return direct route
    // This handles orders that are fulfilled directly from office stock
    if (!sellers.length) {
        return {
            distance: calculateDistance(office, customer),
            route: [], // Empty route (no sellers to visit)
        };
    }

    // ========================================
    // STEP 1: Generate All Possible Routes
    // ========================================
    // Create all possible orderings of sellers
    // Example: [A, B, C] generates 6 permutations:
    // [A,B,C], [A,C,B], [B,A,C], [B,C,A], [C,A,B], [C,B,A]
    const permutations = generatePermutations(sellers);

    // ========================================
    // STEP 2: Initialize Optimization Variables
    // ========================================
    // Track the best solution found so far
    let shortestDistance = Infinity; // Start with impossibly large value
    let bestRoute = [];              // Will store optimal seller ordering

    // ========================================
    // STEP 3: Evaluate Each Possible Route
    // ========================================
    // Test every permutation to find the shortest one
    for (const path of permutations) {
        // Calculate total distance for this specific ordering
        const distance = calculateRouteDistance(
            office,   // Starting point
            path,     // Current seller ordering being tested
            customer  // Ending point
        );

        // ========================================
        // STEP 4: Update Best Solution If Improved
        // ========================================
        // If this route is shorter than previous best, save it
        if (distance < shortestDistance) {
            shortestDistance = distance; // New best distance
            bestRoute = path;            // New best ordering
        }
    }

    // ========================================
    // STEP 5: Return Optimal Solution
    // ========================================
    return {
        distance: shortestDistance, // Minimum distance found
        route: bestRoute,          // Optimal seller visit order
    };
}

/* ============================================================
   5️⃣ USAGE EXAMPLES (COMMENTED OUT FOR PRODUCTION)
   ============================================================ */
/*
// ========================================
// EXAMPLE 1: Basic Usage
// ========================================
const office = { lat: 30.0444, lng: 31.2357 };   // Delivery office in Cairo
const customer = { lat: 30.0500, lng: 31.2400 }; // Customer location

const sellers = [
  { lat: 30.0460, lng: 31.2380 }, // Seller 1: Electronics shop
  { lat: 30.0600, lng: 31.2500 }, // Seller 2: Clothing store
  { lat: 30.0480, lng: 31.2330 }, // Seller 3: Bookstore
];

const result = findShortestDeliveryRoute(office, customer, sellers);

console.log("Shortest distance:", result.distance);
console.log("Optimal route:", result.route);

// ========================================
// EXAMPLE 2: Visualizing the Route
// ========================================
console.log("\n📍 Delivery Route:");
console.log("1. Start at Office:", office);
result.route.forEach((seller, index) => {
  console.log(`${index + 2}. Visit Seller ${index + 1}:`, seller);
});
console.log(`${result.route.length + 2}. Deliver to Customer:`, customer);
console.log(`\n📏 Total Distance: ${result.distance.toFixed(4)} units`);

// ========================================
// EXAMPLE 3: Performance Testing
// ========================================
console.time("Route Optimization");
const largeResult = findShortestDeliveryRoute(office, customer, sellers);
console.timeEnd("Route Optimization");
// Expected output: "Route Optimization: 0.123ms" (very fast for 3 sellers)

// ========================================
// EXAMPLE 4: Edge Case - No Sellers
// ========================================
const directDelivery = findShortestDeliveryRoute(office, customer, []);
console.log("Direct delivery distance:", directDelivery.distance);
console.log("Sellers to visit:", directDelivery.route.length); // 0

// ========================================
// EXAMPLE 5: Converting to Kilometers
// ========================================
const distanceInKm = result.distance * 111; // Rough conversion
console.log(`Approximate distance: ${distanceInKm.toFixed(2)} km`);
*/
