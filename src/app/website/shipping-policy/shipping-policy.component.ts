import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-shipping-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shipping-policy.component.html',
  styleUrls: ['./shipping-policy.component.css']
})
export class ShippingPolicyComponent {
  constructor() { }
}
