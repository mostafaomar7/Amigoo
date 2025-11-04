import { Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';

// Website Components
import { HomeComponent } from './website/home/home.component';
import { BestComponent } from './website/best/best.component';
import { BoyFriendComponent } from './website/boy-friend/boy-friend.component';
import { CargoComponent } from './website/cargo/cargo.component';
import { ConnectComponent } from './website/connect/connect.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { ProductComponent } from './website/product/product.component';
import { ShippingComponent } from './website/shipping/shipping.component';
import { ShirtComponent } from './website/shirt/shirt.component';
import { SweatComponent } from './website/sweat/sweat.component';
import { WideComponent } from './website/wide/wide.component';
import { CartComponent } from './website/cart/cart.component';
import { CheckoutComponent } from './website/checkout/checkout.component';
import { PrivacyPolicyComponent } from './website/privacy-policy/privacy-policy.component';
import { ReturnPolicyComponent } from './website/return-policy/return-policy.component';
import { ShippingPolicyComponent } from './website/shipping-policy/shipping-policy.component';
import { TermsOfServiceComponent } from './website/terms-of-service/terms-of-service.component';


// Authentication
import { LoginComponent } from './login/login.component';

// Admin Dashboard
import { AdminDashboardComponent } from './dashboard/admin-dashboard.component';
import { DashboardOverviewComponent } from './dashboard/layout/overview/overview.component';
import { ProductsComponent } from './dashboard/products/products.component';
import { CategoriesComponent } from './dashboard/categories/categories.component';
import { MasterSizesComponent } from './dashboard/master-sizes/master-sizes.component';
import { OrdersComponent } from './dashboard/orders/orders.component';
import { UsersComponent } from './dashboard/users/users.component';
import { ContactFormsComponent } from './dashboard/contact-forms/contact-forms.component';
import { SettingsComponent } from './dashboard/settings/settings.component';

// Layouts
import { WebsiteLayoutComponent } from './website/layouts/website-layout/website-layout.component';

export const routes: Routes = [
  // ===== AUTHENTICATION ROUTES (Must be before wildcard routes) =====
  { path: 'login', component: LoginComponent, data: { title: 'Login - Amigo Admin' } },

  // ===== ADMIN DASHBOARD ROUTES (Protected) =====
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardOverviewComponent, data: { title: 'Dashboard Overview' } },
      { path: 'products', component: ProductsComponent, data: { title: 'Products Management' } },
      { path: 'categories', component: CategoriesComponent, data: { title: 'Categories Management' } },
      { path: 'master-sizes', component: MasterSizesComponent, data: { title: 'Master Sizes Management' } },
      { path: 'orders', component: OrdersComponent, data: { title: 'Orders Management' } },
      { path: 'users', component: UsersComponent, data: { title: 'Users Management' } },
      { path: 'contact-forms', component: ContactFormsComponent, data: { title: 'Contact Forms' } },
      { path: 'settings', component: SettingsComponent, data: { title: 'Settings' } }
    ]
  },

  // ===== WEBSITE ROUTES (Public) - with Layout =====
  {
    path: '',
    component: WebsiteLayoutComponent,
    children: [
      { path: '', component: HomeComponent, data: { title: 'Home - Amigo Store' } },
      { path: 'home', component: HomeComponent, data: { title: 'Home - Amigo Store' } },
      { path: 'best', component: BestComponent, data: { title: 'Best Products - Amigo Store' } },
      { path: 'boyfriend', component: BoyFriendComponent, data: { title: 'Boyfriend Collection - Amigo Store' } },
      { path: 'cargo', component: CargoComponent, data: { title: 'Cargo Collection - Amigo Store' } },
      { path: 'boyfriend/:_id', component: CargoComponent, data: { title: 'Product Details - Amigo Store' } },
      { path: 'contact', component: ConnectComponent, data: { title: 'Contact Us - Amigo Store' } },
      { path: 'product', component: ProductComponent, data: { title: 'Products - Amigo Store' } },
      { path: 'product/:_id', component: ProductComponent, data: { title: 'Product Details - Amigo Store' } },
      { path: 'shipping', component: ShippingComponent, data: { title: 'Shipping Info - Amigo Store' } },
      { path: 'shirt/:_id', component: ShirtComponent, data: { title: 'Shirt Details - Amigo Store' } },
      { path: 'sweat', component: SweatComponent, data: { title: 'Sweat Collection - Amigo Store' } },
      { path: 'wide', component: WideComponent, data: { title: 'Wide Collection - Amigo Store' } },
      { path: 'cart', component: CartComponent, data: { title: 'Shopping Cart - Amigo Store' } },
      { path: 'checkout', component: CheckoutComponent, data: { title: 'Checkout - Amigo Store' } },
      { path: 'privacy-policy', component: PrivacyPolicyComponent, data: { title: 'سياسات الخصوصية - Amigo Store' } },
      { path: 'return-policy', component: ReturnPolicyComponent, data: { title: 'سياسة الاستبدال والاسترجاع - Amigo Store' } },
      { path: 'shipping-policy', component: ShippingPolicyComponent, data: { title: 'سياسة الشحن - Amigo Store' } },
      { path: 'terms-of-service', component: TermsOfServiceComponent, data: { title: 'شروط الاستخدام - Amigo Store' } }
    ]
  },

  // ===== CATCH-ALL 404 ROUTE (Must be last, no layout) =====
  { path: '**', component: NotfoundComponent, data: { title: 'Page Not Found - Amigo Store' } }
];
