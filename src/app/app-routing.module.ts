import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { BestComponent } from './best/best.component';
import { BoyFriendComponent } from './boy-friend/boy-friend.component';
import { CargoComponent } from './cargo/cargo.component';
import { ConnectComponent } from './connect/connect.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { ProductComponent } from './product/product.component';
import { ShippingComponent } from './shipping/shipping.component';
import { ShirtComponent } from './shirt/shirt.component';
import { SweatComponent } from './sweat/sweat.component';
import { WideComponent } from './wide/wide.component';
import { CartComponent } from './cart/cart.component';
import { AdminComponent } from './admin/admin.component';
import { AdminproductComponent } from './adminproduct/adminproduct.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { LoginComponent } from './login/login.component';
import { CustomerconnectComponent } from './customerconnect/customerconnect.component';
import { CustomerorderComponent } from './customerorder/customerorder.component';
import { AuthGuard } from './auth.guard';


const routes: Routes = [
  {path:"" , component : HomeComponent},
  {path:"home" , component : HomeComponent},
  {path:"best" , component : BestComponent},
  {path:"boyfriend" , component : BoyFriendComponent},
  {path:"cargo" , component : CargoComponent},
  {path:"boyfriend/:_id" , component : CargoComponent},
  {path:"contact" , component : ConnectComponent},
  {path:"product" , component : ProductComponent},
  {path:"shipping" , component : ShippingComponent},
  {path:"shirt/:_id" , component : ShirtComponent},
  {path:"sweat" , component : SweatComponent},
  {path:"wide" , component : WideComponent},
  {path:"cart" , component : CartComponent},
  {path:"admin" , component : AdminComponent , canActivate: [AuthGuard]},
  {path:"login" , component : LoginComponent},
  {path:"checkout" , component : CheckoutComponent},
  {path:"adminproduct" , component : AdminproductComponent , canActivate: [AuthGuard]},
  {path:"customerconnect" , component : CustomerconnectComponent , canActivate: [AuthGuard]},
  {path:"customerorder" , component : CustomerorderComponent , canActivate: [AuthGuard]},
  {path:"product/:_id" , component : ProductComponent},
  {path:"**" , component : NotfoundComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
