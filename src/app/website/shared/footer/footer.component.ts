import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';

interface Settings {
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  social_media?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    tiktok?: string;
    messenger?: string;
    twitter?: string;
    linkedin?: string;
  };
}

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent implements OnInit {
  currentYear: number;
  socialMedia: Settings['social_media'] = {};
  contactEmail: string = '';
  contactPhone: string = '';
  address: string = '';

  constructor(private apiService: ApiService) {
    this.currentYear = new Date().getFullYear();
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.apiService.getSingle<Settings>('/settings').subscribe({
      next: (response) => {
        if (response.data) {
          if (response.data.social_media) {
            this.socialMedia = response.data.social_media;
          }
          this.contactEmail = response.data.contact_email || '';
          this.contactPhone = response.data.contact_phone || '';
          this.address = response.data.address || '';
        }
      },
      error: (error) => {
        console.error('Error loading settings:', error);
      }
    });
  }

  getPhoneLink(phone: string): string {
    if (!phone) return '#';
    // Remove any non-digit characters and format as tel link
    const numbers = phone.replace(/[^0-9]/g, '');
    return numbers ? `tel:+${numbers}` : '#';
  }

  hasSocialMedia(): boolean {
    return !!(this.socialMedia.facebook ||
              this.socialMedia.instagram ||
              this.socialMedia.whatsapp ||
              this.socialMedia.tiktok);
  }

  getWhatsAppLink(whatsapp: string | undefined): string {
    if (!whatsapp) return '#';
    if (whatsapp.startsWith('http')) return whatsapp;
    // Extract numbers from the string and format as wa.me link
    const numbers = whatsapp.replace(/[^0-9]/g, '');
    return numbers ? `https://wa.me/2${numbers}` : '#';
  }
}
