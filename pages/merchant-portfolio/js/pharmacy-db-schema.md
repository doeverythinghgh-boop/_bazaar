# Pharmacy System Database Schema
> [!NOTE]
> This document contains the SQL commands required to set up the pharmacy control panel backend.

## 1. Merchant Preferences Table
Stores visibility settings for main categories, sub-categories, and specific products.

```sql
CREATE TABLE IF NOT EXISTS pharmacy_merchant_preferences (
    user_key VARCHAR(255) PRIMARY KEY,
    hidden_main_categories JSON NOT NULL DEFAULT '[]',
    hidden_sub_categories JSON NOT NULL DEFAULT '[]',
    hidden_catalog_products JSON NOT NULL DEFAULT '[]',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_key) REFERENCES users(user_key) ON DELETE CASCADE
);
```

## 2. Custom Categories Table
Allows pharmacy owners to create their own category structure.

```sql
CREATE TABLE IF NOT EXISTS pharmacy_custom_categories (
    id VARCHAR(100) PRIMARY KEY,
    user_key VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    level ENUM('MAIN', 'SUB') NOT NULL,
    parent_id VARCHAR(100) NULL,
    image_names VARCHAR(500) NULL COMMENT 'Stores file names for fast DB retrieval',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_key) REFERENCES users(user_key) ON DELETE CASCADE
);
```

## 3. Products Metadata Table
Stores pharmaceutical metadata attached to specific products.

```sql
CREATE TABLE IF NOT EXISTS pharmacy_products_metadata (
    product_id VARCHAR(100) PRIMARY KEY,
    user_key VARCHAR(255) NOT NULL,
    image_names VARCHAR(500) NULL COMMENT 'Stores file names',
    is_prescription_required BOOLEAN DEFAULT FALSE,
    active_ingredients JSON NULL,
    form_ref JSON NULL,
    strength_ref JSON NULL,
    custom_main_cat_id VARCHAR(100) NULL,
    custom_sub_cat_id VARCHAR(100) NULL,
    FOREIGN KEY (user_key) REFERENCES users(user_key) ON DELETE CASCADE
);
```
