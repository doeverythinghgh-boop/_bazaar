/**
 * Product API Controller
 * Unified API controller for all product operations
 */

class ProductApiController {
    constructor(productService, featuredService, approvalService) {
        this.productService = productService;
        this.featuredService = featuredService;
        this.approvalService = approvalService;
    }
    
    /**
     * Handle GET /api/products
     */
    async handleGetProducts(request) {
        const { productId, productKeys, userId, type, state, categoryId, featured, searchTerm, limit, offset } = request.query;
        
        const filters = {};
        if (userId) filters.userId = userId;
        if (type) filters.type = type;
        if (state) filters.state = state;
        if (categoryId) filters.categoryId = categoryId;
        if (featured !== undefined) filters.featured = featured === 'true' || featured === '1';
        if (searchTerm) filters.searchTerm = searchTerm;
        
        const pagination = {};
        if (limit) pagination.limit = parseInt(limit);
        if (offset) pagination.offset = parseInt(offset);
        
        const sorting = request.sorting || {};
        
        const query = { filters, pagination, sorting };
        
        if (productId) {
            const product = await this.productService.getProduct({ productId });
            return { success: true, data: product };
        }
        
        if (productKeys) {
            const keys = productKeys.split(',');
            const products = await Promise.all(
                keys.map(key => this.productService.getProduct({ productId: key }))
            );
            return { success: true, data: products.filter(p => p) };
        }
        
        const products = await this.productService.getProducts(query);
        return { success: true, data: products };
    }
    
    /**
     * Handle POST /api/products
     */
    async handleCreateProduct(request) {
        const command = this.parseCreateCommand(request.body);
        const product = await this.productService.createProduct(command);
        return { success: true, data: product };
    }
    
    /**
     * Handle PUT /api/products
     */
    async handleUpdateProduct(request) {
        const command = this.parseUpdateCommand(request.body);
        const product = await this.productService.updateProduct(command);
        return { success: true, data: product };
    }
    
    /**
     * Handle DELETE /api/products
     */
    async handleDeleteProduct(request) {
        const { productId } = request.query;
        await this.productService.deleteProduct(productId);
        return { success: true };
    }
    
    /**
     * Handle PUT /api/products (featured action)
     */
    async handleSetFeatured(request) {
        const { productId, priority, until } = request.body;
        const command = { productId, priority, until };
        const product = await this.featuredService.setFeatured(command);
        return { success: true, data: product };
    }
    
    /**
     * Handle PUT /api/products (unset featured action)
     */
    async handleUnsetFeatured(request) {
        const { productId } = request.query;
        const product = await this.featuredService.unsetFeatured(productId);
        return { success: true, data: product };
    }
    
    /**
     * Handle GET /api/products (featured)
     */
    async handleGetFeatured(request) {
        const { limit, categoryId, type } = request.query;
        const query = { limit, categoryId, type };
        const products = await this.featuredService.getFeaturedProducts(query);
        return { success: true, data: products };
    }
    
    /**
     * Handle PUT /api/products (approve action)
     */
    async handleApproveProduct(request) {
        const { productId } = request.body;
        const product = await this.approvalService.approve(productId, request.userId);
        return { success: true, data: product };
    }
    
    /**
     * Handle PUT /api/products (reject action)
     */
    async handleRejectProduct(request) {
        const { productId, reason } = request.body;
        const product = await this.approvalService.reject(productId, reason, request.userId);
        return { success: true, data: product };
    }
    
    /**
     * Handle PUT /api/products (submit action)
     */
    async handleSubmitProduct(request) {
        const { productId } = request.body;
        const product = await this.approvalService.submitForApproval(productId, request.userId);
        return { success: true, data: product };
    }
    
    /**
     * Parse create command from request body
     */
    parseCreateCommand(body) {
        return {
            type: body.type,
            core: body.core,
            pricing: body.pricing,
            inventory: body.inventory,
            media: body.media,
            categories: body.categories,
            specialty: body.specialty,
            userId: body.userId
        };
    }
    
    /**
     * Parse update command from request body
     */
    parseUpdateCommand(body) {
        return {
            productId: body.productId,
            expectedVersion: body.expectedVersion,
            updates: body.updates,
            userId: body.userId
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductApiController;
} else {
    window.ProductApiController = ProductApiController;
}
