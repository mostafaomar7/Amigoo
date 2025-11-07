import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';
import { FooterComponent } from '../../shared/footer/footer.component';
import { NotificationToastComponent } from '../../components/notification-toast/notification-toast.component';
import { QuickAddModalComponent } from '../../shared/quick-add-modal/quick-add-modal.component';

@Component({
  selector: 'app-website-layout',
  standalone: true,
  imports: [RouterModule, RouterOutlet, NavbarComponent, FooterComponent, NotificationToastComponent, QuickAddModalComponent],
  templateUrl: './website-layout.component.html',
  styleUrls: ['./website-layout.component.css']
})
export class WebsiteLayoutComponent {
}
