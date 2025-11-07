# E-Commerce API Documentation

## Table of Contents
1. [Base Information](#base-information)
2. [Authentication](#authentication)
3. [Endpoints](#endpoints)
   - [User Authentication](#user-authentication)
   - [Categories](#categories)
   - [Products](#products)
   - [Orders](#orders)
   - [Contact Form](#contact-form)
   - [Sizes](#sizes)
   - [Settings](#settings)

---

## Base Information

**Base URL:** `http://localhost:8000/api/v1` (default port 8000, or your configured server URL)

**Content-Type:** `application/json`

**Image Uploads:** Use `multipart/form-data` for endpoints that accept images

**CORS:** Enabled for:
- `https://amigo.mosalam.com`
- `http://localhost:3000`
- `http://localhost:4200`

---

## Authentication

Most endpoints require authentication. After successful login or registration, you'll receive a JWT token.

### How to Authenticate:

Include the token in the **Authorization header** using the **Bearer** scheme:

```
Authorization: Bearer <your_jwt_token>
```

### Token Format:
The token expires in **7 days** (configured via `EXPIRE_TIME` environment variable).

---

## Endpoints

### User Authentication

#### 1. Register User
Create a new user account.

**Endpoint:** `POST /user/register`

**Authentication:** Not required

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"
}
```

**Response (201):**
```json
{
  "message": "تم التسجيل بنجاح",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  },
  "token": "jwt_token_here"
}
```

**Error Responses:**
- `400`: Missing fields or email already exists
- `500`: Server error

---

#### 2. Login User
Authenticate and receive a JWT token.

**Endpoint:** `POST /user/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "تم تسجيل الدخول بنجاح",
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Responses:**
- `400`: Missing email or password
- `404`: User not found
- `401`: Invalid password
- `500`: Server error

---

### Categories

#### 1. Get All Categories
Retrieve all categories with optional filtering and pagination.

**Endpoint:** `GET /categories`

**Authentication:** Not required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page
- `sort` (optional): Sort field (default: 'createdAt')
- `fields` (optional): Comma-separated fields to return
- `keyword` (optional): Search keyword for category name

**Example:**
```
GET /categories?page=1&limit=10&keyword=electronics
```

**Response (200):**
```json
{
  "results": 5,
  "pagination": {
    "currentPage": 1,
    "numberOfPages": 1,
    "limit": 10
  },
  "data": [
    {
      "_id": "category_id",
      "name": "Electronics",
      "slug": "electronics",
      "image": "category-abc123-1234567890-.jpeg",
      "isDeleted": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### 2. Get Single Category
Retrieve a specific category by ID.

**Endpoint:** `GET /categories/:id`

**Authentication:** Not required

**Response (200):**
```json
{
  "data": {
    "_id": "category_id",
    "name": "Electronics",
    "slug": "electronics",
    "image": "category-abc123-1234567890-.jpeg",
    "isDeleted": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `404`: Category not found
- `400`: Invalid ID format

---

#### 3. Create Category
Create a new category (Admin only).

**Endpoint:** `POST /categories`

**Authentication:** Required (Admin)

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**
- `name` (required): Category name (3-32 characters)
- `image` (required): Image file

**Response (201):**
```json
{
  "data": {
    "_id": "category_id",
    "name": "New Category",
    "slug": "new-category",
    "image": "category-abc123-1234567890-.jpeg",
    "isDeleted": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Error Responses:**
- `401`: Unauthorized (no token)
- `403`: Forbidden (not Admin)
- `400`: Validation error

---

#### 4. Update Category
Update a category (Admin only).

**Endpoint:** `PUT /categories/:id`

**Authentication:** Required (Admin)

**Content-Type:** `multipart/form-data`

**Request Body (Form Data - all fields optional):**
- `name`: Category name
- `image`: New image file

**Response (200):**
```json
{
  "data": {
    "_id": "category_id",
    "name": "Updated Category",
    "slug": "updated-category",
    "image": "category-xyz789-1234567890-.jpeg",
    "isDeleted": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

#### 5. Delete Category
Delete a category (Admin only).

**Endpoint:** `DELETE /categories/:id`

**Authentication:** Required (Admin)

**Response (200):**
```json
{
  "message": "Category deleted successfully"
}
```

---

### Products

#### 1. Get All Products
Retrieve all products with optional filtering and pagination.

**Endpoint:** `GET /product`

**Authentication:** Not required

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `sort` (optional): Sort field
- `fields` (optional): Comma-separated fields
- `keyword` (optional): Search keyword

**Response (200):**
```json
{
  "results": 10,
  "pagination": {
    "currentPage": 1,
    "numberOfPages": 1,
    "limit": 10
  },
  "data": [
    {
      "_id": "product_id",
      "title": "Product Name",
      "slug": "product-name",
      "description": "Product description",
      "sold": 0,
      "price": 99.99,
      "priceAfterDiscount": 79.99,
      "colors": ["red", "blue"],
      "imageCover": "product-cover.jpg",
      "images": ["product-1.jpg", "product-2.jpg"],
      "category": {
        "name": "Electronics",
        "_id": "category_id"
      },
      "isDeleted": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### 2. Get Products by Category
Retrieve all products in a specific category.

**Endpoint:** `GET /product/category/:categoryId`

**Authentication:** Not required

**Response (200):**
```json
{
  "results": 5,
  "data": [
    {
      "_id": "product_id",
      "title": "Product Name",
      "slug": "product-name",
      "description": "Product description",
      "price": 99.99,
      "imageCover": "product-cover.jpg",
      "category": {
        "name": "Electronics"
      }
    }
  ]
}
```

---

#### 3. Get Single Product
Retrieve a specific product by ID.

**Endpoint:** `GET /product/:id`

**Authentication:** Not required

**Response (200):**
```json
{
  "data": {
    "_id": "product_id",
    "title": "Product Name",
    "slug": "product-name",
    "description": "Product description",
    "sold": 0,
    "price": 99.99,
    "priceAfterDiscount": 79.99,
    "colors": ["red", "blue"],
    "imageCover": "product-cover.jpg",
    "images": ["product-1.jpg", "product-2.jpg"],
    "category": {
      "name": "Electronics",
      "_id": "category_id"
    },
    "isDeleted": false,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### 4. Create Product
Create a new product (Admin only).

**Endpoint:** `POST /product`

**Authentication:** Required (Admin)

**Content-Type:** `multipart/form-data`

**Request Body (Form Data):**
- `title` (required): Product title (min 3 chars)
- `description` (required): Product description (min 5 chars, max 2000)
- `price` (required): Product price (number, max 100000)
- `priceAfterDiscount` (optional): Discounted price (must be less than price)
- `category` (required): Category ID (MongoDB ObjectId)
- `colors` (optional): Comma-separated color names or JSON array
- `imageCover` (required): Main product image file
- `images` (optional): Additional product image files (multiple files)

**Response (201):**
```json
{
  "data": {
    "_id": "product_id",
    "title": "New Product",
    "slug": "new-product",
    "description": "Product description",
    "price": 99.99,
    "imageCover": "product-cover.jpg",
    "images": ["product-1.jpg"],
    "category": {
      "name": "Electronics"
    },
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### 5. Update Product
Update a product (Admin only).

**Endpoint:** `PUT /product/:id`

**Authentication:** Required (Admin)

**Content-Type:** `multipart/form-data`

**Request Body (Form Data - all fields optional):**
- `title`: Product title
- `description`: Product description
- `price`: Product price
- `priceAfterDiscount`: Discounted price
- `category`: Category ID
- `colors`: Color array
- `imageCover`: Main image file
- `images`: Additional image files

**Response (200):**
```json
{
  "data": {
    "_id": "product_id",
    "title": "Updated Product",
    "slug": "updated-product",
    "description": "Updated description",
    "price": 89.99,
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

#### 6. Delete Product
Delete a product (Admin only).

**Endpoint:** `DELETE /product/:id`

**Authentication:** Required (Admin)

**Response (200):**
```json
{
  "message": "Product deleted successfully"
}
```

---

### Orders

#### 1. Create Order
Create a new order (Public endpoint).

**Endpoint:** `POST /Order`

**Authentication:** Not required

**Request Body:**
```json
{
  "fullName": "John Doe",
  "country": "Egypt",
  "streetAddress": "123 Main St",
  "state": "Cairo",
  "phone": "01234567890",
  "email": "john@example.com",
  "shippingAddress": false,
  "orderNotes": "Please handle with care",
  "items": [
    {
      "productId": "product_id",
      "sizeName": "L",
      "quantity": 2,
      "price": 99.99,
      "totalPrice": 199.98
    }
  ],
  "totalAmount": 199.98,
  "shippingCost": 10.00,
  "finalAmount": 209.98
}
```

**Note:** Phone must be exactly 11 digits.

**Response (201):**
```json
{
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-123456",
    "status": "pending",
    "fullName": "John Doe",
    "country": "Egypt",
    "streetAddress": "123 Main St",
    "state": "Cairo",
    "phone": "01234567890",
    "email": "john@example.com",
    "items": [...],
    "totalAmount": 199.98,
    "shippingCost": 10.00,
    "finalAmount": 209.98,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### 2. Get User Orders
Get all orders for the authenticated user.

**Endpoint:** `GET /Order/my-orders`

**Authentication:** Required (Any authenticated user)

**Response (200):**
```json
{
  "results": 2,
  "data": [
    {
      "_id": "order_id",
      "orderNumber": "ORD-123456",
      "status": "pending",
      "items": [...],
      "finalAmount": 209.98,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### 3. Get All Orders
Get all orders (Admin only).

**Endpoint:** `GET /Order`

**Authentication:** Required (Admin)

**Response (200):**
```json
{
  "results": 10,
  "data": [
    {
      "_id": "order_id",
      "orderNumber": "ORD-123456",
      "status": "pending",
      "userId": "user_id",
      "fullName": "John Doe",
      "items": [...],
      "finalAmount": 209.98,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### 4. Get Order Statistics
Get order statistics (Admin only).

**Endpoint:** `GET /Order/stats`

**Authentication:** Required (Admin)

**Response (200):**
```json
{
  "success": true,
  "message": "Order statistics retrieved successfully",
  "data": {
    "totalOrders": 100,
    "pendingOrders": 20,
    "completedOrders": 70,
    "cancelledOrders": 10,
    "totalRevenue": 50000.00
  }
}
```

---

#### 5. Get Single Order
Get order by ID (Admin only).

**Endpoint:** `GET /Order/:id`

**Authentication:** Required (Admin)

**Response (200):**
```json
{
  "data": {
    "_id": "order_id",
    "orderNumber": "ORD-123456",
    "status": "pending",
    "fullName": "John Doe",
    "items": [...],
    "finalAmount": 209.98
  }
}
```

---

#### 6. Update Order Status
Update order status (Admin only).

**Endpoint:** `PUT /Order/:id/status`

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "status": "completed"
}
```

**Status Values:** `pending`, `completed`, `cancelled`

**Response (200):**
```json
{
  "data": {
    "_id": "order_id",
    "status": "completed",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

#### 7. Delete Order
Delete an order (Admin only).

**Endpoint:** `DELETE /Order/:id`

**Authentication:** Required (Admin)

**Response (200):**
```json
{
  "message": "Order deleted successfully"
}
```

---

### Contact Form

#### 1. Submit Contact Form
Submit a contact form (Public endpoint).

**Endpoint:** `POST /submit`

**Authentication:** Not required

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "01234567890",
  "message": "Your message here",
  "termsAccepted": "true"
}
```

**Note:**
- Phone must be exactly 11 digits
- Message max 1000 characters
- `termsAccepted` must be the string `"true"`

**Response (201):**
```json
{
  "message": "Contact form submitted successfully",
  "data": {
    "_id": "form_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "01234567890",
    "message": "Your message here",
    "termsAccepted": true,
    "isReplied": false,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### 2. Get All Contact Forms
Get all contact forms (Admin only).

**Endpoint:** `GET /submit`

**Authentication:** Required (Admin)

**Response (200):**
```json
{
  "results": 10,
  "data": [
    {
      "_id": "form_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "01234567890",
      "message": "Your message here",
      "isReplied": false,
      "adminReply": null,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### 3. Get Single Contact Form
Get contact form by ID (Admin only).

**Endpoint:** `GET /submit/:id`

**Authentication:** Required (Admin)

**Response (200):**
```json
{
  "data": {
    "_id": "form_id",
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "01234567890",
    "message": "Your message here",
    "isReplied": false,
    "adminReply": null
  }
}
```

---

#### 4. Update Contact Form
Update a contact form (Admin only).

**Endpoint:** `PUT /submit/:id`

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "updated@example.com",
  "phone": "01234567890",
  "message": "Updated message",
  "termsAccepted": "true"
}
```

**Response (200):**
```json
{
  "data": {
    "_id": "form_id",
    "name": "Updated Name",
    "email": "updated@example.com",
    "message": "Updated message",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

#### 5. Reply to Contact Form
Reply to a contact form (Admin only).

**Endpoint:** `POST /submit/:id/reply`

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "adminReply": "Thank you for your message. We will get back to you soon."
}
```

**Response (200):**
```json
{
  "data": {
    "_id": "form_id",
    "isReplied": true,
    "adminReply": "Thank you for your message. We will get back to you soon.",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

#### 6. Delete Contact Form
Delete a contact form (Admin only).

**Endpoint:** `DELETE /submit/:id`

**Authentication:** Required (Admin)

**Response (200):**
```json
{
  "message": "Contact form deleted successfully"
}
```

---

### Sizes

#### 1. Get Available Sizes for Product
Get available sizes for a specific product (Public endpoint).

**Endpoint:** `GET /sizes/product/:productId/available`

**Authentication:** Not required

**Response (200):**
```json
{
  "results": 3,
  "data": [
    {
      "_id": "size_id",
      "productId": "product_id",
      "sizeName": "L",
      "quantity": 10,
      "isActive": true,
      "isAvailable": true
    }
  ]
}
```

---

#### 2. Get All Sizes for Product
Get all sizes (including unavailable) for a product (Public endpoint).

**Endpoint:** `GET /sizes/product/:productId`

**Authentication:** Not required

**Response (200):**
```json
{
  "results": 4,
  "data": [
    {
      "_id": "size_id",
      "productId": "product_id",
      "sizeName": "M",
      "quantity": 0,
      "isActive": true,
      "isAvailable": false
    }
  ]
}
```

---

#### 3. Get All Sizes
Get all sizes in the system (Admin only).

**Endpoint:** `GET /sizes`

**Authentication:** Required (Admin)

**Response (200):**
```json
{
  "results": 50,
  "data": [
    {
      "_id": "size_id",
      "productId": "product_id",
      "sizeName": "XL",
      "quantity": 5,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

#### 4. Create Size
Create a new size for a product (Admin only).

**Endpoint:** `POST /sizes`

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "productId": "product_id",
  "sizeName": "XL",
  "quantity": 10,
  "isActive": true
}
```

**Note:** `sizeName` will be converted to uppercase. Each product can only have unique size names.

**Response (201):**
```json
{
  "data": {
    "_id": "size_id",
    "productId": "product_id",
    "sizeName": "XL",
    "quantity": 10,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

---

#### 5. Get Size by ID
Get a specific size (Admin only).

**Endpoint:** `GET /sizes/:id`

**Authentication:** Required (Admin)

**Response (200):**
```json
{
  "data": {
    "_id": "size_id",
    "productId": "product_id",
    "sizeName": "L",
    "quantity": 10,
    "isActive": true
  }
}
```

---

#### 6. Update Size
Update a size (Admin only).

**Endpoint:** `PUT /sizes/:id`

**Authentication:** Required (Admin)

**Request Body (all fields optional):**
```json
{
  "quantity": 15,
  "isActive": false
}
```

**Response (200):**
```json
{
  "data": {
    "_id": "size_id",
    "quantity": 15,
    "isActive": false,
    "updatedAt": "2024-01-02T00:00:00.000Z"
  }
}
```

---

#### 7. Delete Size
Delete a size (Admin only).

**Endpoint:** `DELETE /sizes/:id`

**Authentication:** Required (Admin)

**Response (200):**
```json
{
  "message": "Size deleted successfully"
}
```

---

### Settings

#### 1. Get All Settings
Get all site settings (Public endpoint).

**Endpoint:** `GET /settings`

**Authentication:** Not required

**Response (200):**
```json
{
  "data": {
    "_id": "settings_id",
    "site_name": "E-commerce Store",
    "site_logo": "logo.png",
    "contact_email": "admin@example.com",
    "contact_phone": "1234567890",
    "site_description": "Store description",
    "currency": "USD",
    "currency_symbol": "$",
    "shipping_cost": 10.00,
    "free_shipping_threshold": 100.00,
    "social_media": {
      "facebook": "https://facebook.com/store",
      "twitter": "https://twitter.com/store",
      "instagram": "https://instagram.com/store",
      "linkedin": "https://linkedin.com/store"
    },
    "isActive": true
  }
}
```

---

#### 2. Get Setting by Key
Get a specific setting by key (Public endpoint).

**Endpoint:** `GET /settings/:key`

**Authentication:** Not required

**Example:** `GET /settings/shipping_cost`

**Response (200):**
```json
{
  "data": {
    "key": "shipping_cost",
    "value": 10.00
  }
}
```

---

#### 3. Get Shipping Info
Get shipping information (Public endpoint).

**Endpoint:** `GET /settings/shipping/info`

**Authentication:** Not required

**Response (200):**
```json
{
  "shipping_cost": 10.00,
  "free_shipping_threshold": 100.00,
  "currency": "USD",
  "currency_symbol": "$"
}
```

---

#### 4. Calculate Shipping
Calculate shipping cost based on order amount (Public endpoint).

**Endpoint:** `POST /settings/shipping/calculate`

**Authentication:** Not required

**Request Body:**
```json
{
  "orderAmount": 150.00
}
```

**Response (200):**
```json
{
  "orderAmount": 150.00,
  "shippingCost": 0.00,
  "freeShippingThreshold": 100.00,
  "isFreeShipping": true,
  "finalAmount": 150.00
}
```

---

#### 5. Create Settings
Create site settings (Admin only). Note: Only one settings document should exist.

**Endpoint:** `POST /settings`

**Authentication:** Required (Admin)

**Request Body:**
```json
{
  "site_name": "My Store",
  "contact_email": "admin@example.com",
  "contact_phone": "1234567890",
  "shipping_cost": 10.00,
  "free_shipping_threshold": 100.00,
  "currency": "USD",
  "currency_symbol": "$"
}
```

---

#### 6. Update Settings
Update all settings (Admin only).

**Endpoint:** `PUT /settings`

**Authentication:** Required (Admin)

**Request Body (all fields optional):**
```json
{
  "site_name": "Updated Store Name",
  "shipping_cost": 15.00,
  "free_shipping_threshold": 150.00
}
```

---

#### 7. Update Setting by Key
Update a specific setting by key (Admin only).

**Endpoint:** `PUT /settings/:key`

**Authentication:** Required (Admin)

**Example:** `PUT /settings/shipping_cost`

**Request Body:**
```json
{
  "value": 12.50
}
```

---

#### 8. Reset Settings
Reset settings to defaults (Admin only).

**Endpoint:** `POST /settings/reset`

**Authentication:** Required (Admin)

**Response (200):**
```json
{
  "message": "Settings reset successfully",
  "data": {
    "site_name": "E-commerce Store",
    "contact_email": "admin@example.com",
    "contact_phone": "1234567890",
    "shipping_cost": 0,
    "free_shipping_threshold": 100
  }
}
```

---

## Image URLs

Uploaded images are served statically. Use the following format:

**Categories:** `http://localhost:8000/uploads/category/{image_filename}`

**Products:** `http://localhost:8000/uploads/products/{image_filename}`

**Example:**
```
http://localhost:8000/uploads/category/category-abc123-1234567890-.jpeg
```

---

## Error Responses

All endpoints may return these error responses:

### 401 Unauthorized
```json
{
  "message": "لم يتم توفير رمز المصادقة"
}
```

### 403 Forbidden
```json
{
  "message": "ليس لديك إذن للقيام بهذا الإجراء"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 400 Bad Request
```json
{
  "message": "Validation error message",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

### 500 Internal Server Error
```json
{
  "message": "خطأ في الخادم",
  "error": "Error details"
}
```

---

## Frontend Integration Examples

### JavaScript/TypeScript Example

```typescript
// API Configuration
const API_BASE_URL = 'http://localhost:8000/api/v1';

// Helper function to make API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  return response.json();
}

// Login example
async function login(email: string, password: string) {
  const data = await apiCall('/user/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  localStorage.setItem('token', data.token);
  return data;
}

// Get products example
async function getProducts() {
  return apiCall('/product?page=1&limit=10');
}

// Create order example
async function createOrder(orderData: any) {
  return apiCall('/Order', {
    method: 'POST',
    body: JSON.stringify(orderData),
  });
}

// Upload image example (using FormData)
async function createCategory(name: string, imageFile: File) {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('image', imageFile);

  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/categories`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  return response.json();
}
```

### React Example

```jsx
import { useState, useEffect } from 'react';

function ProductsList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch('http://localhost:8000/api/v1/product');
        const data = await response.json();
        setProducts(data.data);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product._id}>
          <h3>{product.title}</h3>
          <p>${product.price}</p>
          <img
            src={`http://localhost:8000/uploads/products/${product.imageCover}`}
            alt={product.title}
          />
        </div>
      ))}
    </div>
  );
}
```

### Axios Example

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Get categories
export const getCategories = () => api.get('/categories');

// Create product
export const createProduct = (formData) => api.post('/product', formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
});

// Get user orders
export const getUserOrders = () => api.get('/Order/my-orders');
```

---

## Important Notes

1. **Authentication:** Most endpoints require a valid JWT token in the Authorization header.

2. **Image Uploads:** Use `multipart/form-data` for endpoints that accept images (categories, products).

3. **Phone Numbers:** Phone numbers must be exactly 11 digits for orders and contact forms.

4. **Roles:** There are two user roles: `user` and `Admin`. Admin-only endpoints require the Admin role.

5. **Pagination:** Many list endpoints support pagination with `page` and `limit` query parameters.

6. **Token Expiration:** JWT tokens expire after 7 days (configurable).

7. **CORS:** The API is configured to accept requests from specific origins. Update CORS settings in `app.js` if needed.

8. **Error Handling:** Always handle errors appropriately. Error messages may be in Arabic or English.

9. **Image Paths:** Use the full URL path for images: `http://localhost:8000/uploads/{category|products}/{filename}`

10. **Order Items:** When creating an order, ensure product sizes exist and have sufficient quantity.

---

## Support

For questions or issues, contact the backend development team.

---

**Last Updated:** January 2024
**API Version:** v1
