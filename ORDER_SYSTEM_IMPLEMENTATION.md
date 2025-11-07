# Order System Implementation Guide

## Overview
This document explains the new order submission system that stores orders in LocalStorage and sends them to the backend API.

## System Flow

### 1. Checkout Page (`/checkout`)
- User reviews cart items
- Clicks "تأكيد الطلب" (Confirm Order) button
- **Action:** Redirects to Order Summary page (no form submission here)

### 2. Order Summary Page (`/order-summary`)
- Displays cart items and order totals
- User fills out complete form with:
  - **Required Fields:**
    - Full Name (الاسم الكامل)
    - Email (البريد الإلكتروني)
    - Primary Phone Number (رقم الهاتف الأساسي)
    - Detailed Address (العنوان التفصيلي)
    - Governorate (المحافظة)
    - City (المدينة)
  - **Optional Fields:**
    - Secondary Phone Number (رقم الهاتف الثانوي)
    - Notes (ملاحظات)
- **On Submit:**
  1. Validates all form fields
  2. Saves order to LocalStorage (for order history)
  3. Sends order to backend API (`POST /order`)
  4. Clears cart
  5. Redirects to Order History page

### 3. Order History Page (`/order-history`)
- Displays all orders stored in LocalStorage
- Shows order details, status, and items
- User can delete orders from history

## Components Created

### 1. Order Storage Service (`order-storage.service.ts`)
**Location:** `src/app/services/order-storage.service.ts`

**Purpose:** Manages orders in LocalStorage

**Methods:**
- `saveOrder(order)` - Save order to LocalStorage
- `getOrders()` - Get all orders
- `getOrderById(orderId)` - Get single order
- `updateOrderStatus(orderId, status)` - Update order status (for admin)
- `deleteOrder(orderId)` - Delete order
- `clearAllOrders()` - Clear all orders

**Storage Key:** `orderHistory`

### 2. Order Summary Component
**Location:** `src/app/website/order-summary/`

**Files:**
- `order-summary.component.ts` - Component logic
- `order-summary.component.html` - Template
- `order-summary.component.css` - Styles

**Features:**
- Form validation for all fields
- Displays cart items and totals
- Saves to LocalStorage
- Sends to API
- Error handling

### 3. Order History Component
**Location:** `src/app/website/order-history/`

**Files:**
- `order-history.component.ts` - Component logic
- `order-history.component.html` - Template
- `order-history.component.css` - Styles

**Features:**
- Displays all orders from LocalStorage
- Shows order status with color coding
- Displays customer and delivery information
- Shows order items with images
- Delete order functionality

## Form Validation

### Required Fields
All required fields use Angular Reactive Forms with validators:

```typescript
fullName: ['', [Validators.required, Validators.minLength(2)]]
email: ['', [Validators.required, Validators.email]]
primaryPhone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,11}$/)]]
detailedAddress: ['', [Validators.required, Validators.minLength(10)]]
governorate: ['', [Validators.required, Validators.minLength(2)]]
city: ['', [Validators.required, Validators.minLength(2)]]
```

### Optional Fields
```typescript
secondaryPhone: ['', [Validators.pattern(/^[0-9]{10,11}$/)]]
notes: ['']
```

## Order Data Structure

### LocalStorage Format
```json
{
  "id": "ORD-1234567890-ABC123",
  "fullName": "John Doe",
  "email": "john@example.com",
  "primaryPhone": "01234567890",
  "secondaryPhone": "01123456789",
  "detailedAddress": "123 Main Street, Building 5, Apartment 10",
  "governorate": "القاهرة",
  "city": "مدينة نصر",
  "notes": "Please call before delivery",
  "items": [
    {
      "productId": "product_id",
      "title": "Product Name",
      "imageCover": "image.jpg",
      "sizeName": "L",
      "quantity": 2,
      "price": 99.99,
      "totalPrice": 199.98
    }
  ],
  "subtotal": 199.98,
  "vat": 27.99,
  "total": 227.97,
  "status": "pending",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### API Format (sent to backend)
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "phone": "01234567890",
  "country": "Egypt",
  "streetAddress": "123 Main Street, Building 5, Apartment 10",
  "state": "القاهرة, مدينة نصر",
  "shippingAddress": {
    "fullName": "John Doe",
    "country": "Egypt",
    "streetAddress": "123 Main Street, Building 5, Apartment 10",
    "state": "القاهرة, مدينة نصر",
    "phone": "01234567890",
    "email": "john@example.com"
  },
  "orderNotes": "Please call before delivery",
  "items": [
    {
      "productId": "product_id",
      "sizeName": "L",
      "quantity": 2,
      "price": 99.99,
      "totalPrice": 199.98
    }
  ],
  "totalAmount": 227.97
}
```

## Routes

### New Routes Added
```typescript
{ path: 'order-summary', component: OrderSummaryComponent }
{ path: 'order-history', component: OrderHistoryComponent }
```

## Order Status Flow

### Status Values
- `pending` - Order is pending (default)
- `confirmed` - Order confirmed by admin
- `shipped` - Order has been shipped
- `delivered` - Order delivered to customer
- `cancelled` - Order cancelled

### Status Colors
- `pending` - Yellow (#ffc107)
- `confirmed` - Cyan (#17a2b8)
- `shipped` - Blue (#007bff)
- `delivered` - Green (#28a745)
- `cancelled` - Red (#dc3545)

**Note:** Only Admin Dashboard can update order statuses. Users can only view their order history.

## Key Features

### ✅ Implemented
1. **Form Validation** - All required fields validated
2. **LocalStorage Storage** - Orders saved locally
3. **Order History** - Display past orders
4. **API Integration** - Sends orders to backend
5. **Error Handling** - Graceful error handling
6. **Cart Clearing** - Cart cleared after successful order
7. **Status Display** - Visual status indicators

### 🔄 Workflow
1. User adds products to cart
2. User goes to checkout page
3. User clicks "Confirm Order" → Redirects to Order Summary
4. User fills out form on Order Summary page
5. On submit:
   - Order saved to LocalStorage
   - Order sent to API
   - Cart cleared
   - Redirect to Order History

## Testing

### Manual Testing Steps
1. Add products to cart
2. Go to checkout page
3. Click "تأكيد الطلب"
4. Should redirect to `/order-summary`
5. Fill out form (try with invalid data first)
6. Submit form
7. Check LocalStorage for saved order
8. Go to `/order-history` to see saved orders

### Test Cases
- ✅ Empty cart validation
- ✅ Required field validation
- ✅ Email format validation
- ✅ Phone number validation (10-11 digits)
- ✅ Address length validation (min 10 characters)
- ✅ Order saved to LocalStorage
- ✅ Order sent to API
- ✅ Cart cleared after order
- ✅ Order history displays correctly
- ✅ Delete order functionality

## Code Structure

### Services
- `OrderStorageService` - LocalStorage management
- `OpencartService` - Cart management (existing)
- `CategoryService` - API calls (existing)
- `NotificationService` - Notifications (existing)

### Components
- `CheckoutComponent` - Modified to redirect
- `OrderSummaryComponent` - New order form
- `OrderHistoryComponent` - New order history display

## Notes

1. **No Authentication:** System works without user accounts
2. **LocalStorage Only:** Orders stored in browser LocalStorage
3. **Admin Control:** Only admin can update order statuses
4. **Simple Implementation:** Clean, readable code with comments
5. **Error Handling:** Graceful error handling with user-friendly messages

## Future Enhancements (Optional)

- Export orders to CSV/PDF
- Search/filter orders
- Order status notifications
- Order tracking
- Print order receipt

---

**Implementation Date:** 2024
**Status:** ✅ Complete and Ready for Use
