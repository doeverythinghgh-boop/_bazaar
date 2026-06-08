/**
 * Unified Product Routes
 * Route definitions for the new product API
 */

const ProductApiController = require('./ProductApiController');

class ProductRoutes {
    constructor(controller) {
        this.controller = controller;
    }
    
    /**
     * Get route configuration
     */
    getRoutes() {
        return [
            {
                method: 'GET',
                path: '/api/products',
                handler: this.controller.handleGetProducts.bind(this.controller),
                description: 'Get products by filters'
            },
            {
                method: 'POST',
                path: '/api/products',
                handler: this.controller.handleCreateProduct.bind(this.controller),
                description: 'Create new product'
            },
            {
                method: 'PUT',
                path: '/api/products',
                handler: this.controller.handleUpdateProduct.bind(this.controller),
                description: 'Update existing product'
            },
            {
                method: 'DELETE',
                path: '/api/products',
                handler: this.controller.handleDeleteProduct.bind(this.controller),
                description: 'Delete product'
            },
            {
                method: 'GET',
                path: '/api/products/featured',
                handler: this.controller.handleGetFeatured.bind(this.controller),
                description: 'Get featured products'
            },
            {
                method: 'PUT',
                path: '/api/products/featured',
                handler: this.controller.handleSetFeatured.bind(this.controller),
                description: 'Set product as featured'
            },
            {
                method: 'DELETE',
                path: '/api/products/featured',
                handler: this.controller.handleUnsetFeatured.bind(this.controller),
                description: 'Unset product as featured'
            },
            {
                method: 'PUT',
                path: '/api/products/approve',
                handler: this.controller.handleApproveProduct.bind(this.controller),
                description: 'Approve product'
            },
            {
                method: 'PUT',
                path: '/api/products/reject',
                handler: this.controller.handleRejectProduct.bind(this.controller),
                description: 'Reject product'
            },
            {
                method: 'PUT',
                path: '/api/products/submit',
                handler: this.controller.handleSubmitProduct.bind(this.controller),
                description: 'Submit product for approval'
            }
        ];
    }
    
    /**
     * Register routes with router
     */
    register(router) {
        const routes = this.getRoutes();
        
        routes.forEach(route => {
            router.addRoute(route.method, route.path, route.handler);
        });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductRoutes;
} else {
    window.ProductRoutes = ProductRoutes;
}
