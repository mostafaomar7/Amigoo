import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './shared/navbar/navbar.component';
import { FooterComponent } from './shared/footer/footer.component';
import { HomeComponent } from './home/home.component';
import { BestComponent } from './best/best.component';
import { BoyFriendComponent } from './boy-friend/boy-friend.component';
import { CargoComponent } from './cargo/cargo.component';
import { ConnectComponent } from './connect/connect.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { ProductComponent } from './product/product.component';
import { SpinnerComponent } from './shared/spinner/spinner.component';
import { ShippingComponent } from './shipping/shipping.component';
import { ShirtComponent } from './shirt/shirt.component';
import { SlimfitComponent } from './slimfit/slimfit.component';
import { SweatComponent } from './sweat/sweat.component';
import { WideComponent } from './wide/wide.component';
import {  HTTP_INTERCEPTORS, HttpClientModule} from "@angular/common/http";
import { ReactiveFormsModule } from '@angular/forms';
import { CartComponent } from './cart/cart.component';
import { AdminComponent } from './admin/admin.component';
import { AdminproductComponent } from './adminproduct/adminproduct.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { LoginComponent } from './login/login.component';  // استيراد ReactiveFormsModule
import { AuthInterceptor } from './sharedservice/auth.service';
import { CategoryService } from './sharedservice/category.service';
import { CustomerconnectComponent } from './customerconnect/customerconnect.component';
import { CustomerorderComponent } from './customerorder/customerorder.component';


@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    FooterComponent,
    HomeComponent,
    BestComponent,
    BoyFriendComponent,
    CargoComponent,
    ConnectComponent,
    NotfoundComponent,
    ProductComponent,
    SpinnerComponent,
    ShippingComponent,
    ShirtComponent,
    SlimfitComponent,
    SweatComponent,
    WideComponent,
    CartComponent,
    AdminComponent,
    AdminproductComponent,
    CheckoutComponent,
    LoginComponent,
    CustomerconnectComponent,
    CustomerorderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HttpClientModule,
    ReactiveFormsModule
  ],
  providers: [
    CategoryService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true } // تسجيل الـ Interceptor
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
