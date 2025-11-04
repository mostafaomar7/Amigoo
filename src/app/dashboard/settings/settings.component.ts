import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';

export interface Settings {
  _id?: string;
  contact_email: string;
  contact_phone: string;
  shipping_cost: number;
  address?: string;
  social_media?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    tiktok?: string;
  };
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  settings: Settings | null = null;
  isLoading = false;
  isSaving = false;
  isResetting = false;
  settingsForm: FormGroup;

  constructor(
    private apiService: ApiService,
    private notificationService: NotificationService,
    private fb: FormBuilder
  ) {
    this.settingsForm = this.fb.group({
      contact_email: ['', [Validators.required, Validators.email]],
      contact_phone: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      shipping_cost: [0, [Validators.required, Validators.min(0)]],
      address: ['', Validators.maxLength(500)],
      facebook: ['', this.urlValidator],
      instagram: ['', this.urlValidator],
      whatsapp: ['', this.whatsappValidator],
      tiktok: ['', this.urlValidator]
    });
  }

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.isLoading = true;
    this.apiService.getSingle<Settings>('/settings').subscribe({
      next: (response) => {
        this.settings = response.data;
        if (this.settings) {
          this.populateForm(this.settings);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading settings:', error);
        this.isLoading = false;
        if (error.status === 404) {
          this.notificationService.info('Info', 'Settings not found. You can create new settings by saving.');
        } else {
          this.notificationService.error('Error', 'Failed to load settings');
        }
      }
    });
  }

  populateForm(settings: Settings): void {
    this.settingsForm.patchValue({
      contact_email: settings.contact_email || '',
      contact_phone: settings.contact_phone || '',
      shipping_cost: settings.shipping_cost || 0,
      address: settings.address || '',
      facebook: settings.social_media?.facebook || '',
      instagram: settings.social_media?.instagram || '',
      whatsapp: settings.social_media?.whatsapp || '',
      tiktok: settings.social_media?.tiktok || ''
    });
  }

  saveSettings(): void {
    if (this.settingsForm.valid) {
      this.isSaving = true;
      const formValue = this.settingsForm.value;

      // Build social media object only if at least one field has a value
      const socialMedia: any = {};
      if (formValue.facebook) socialMedia.facebook = formValue.facebook;
      if (formValue.instagram) socialMedia.instagram = formValue.instagram;
      if (formValue.whatsapp) socialMedia.whatsapp = formValue.whatsapp;
      if (formValue.tiktok) socialMedia.tiktok = formValue.tiktok;

      const settingsData: any = {
        contact_email: formValue.contact_email,
        contact_phone: formValue.contact_phone,
        shipping_cost: formValue.shipping_cost,
        address: formValue.address || ''
      };

      // Only include social_media if it has at least one property
      if (Object.keys(socialMedia).length > 0) {
        settingsData.social_media = socialMedia;
      }

      this.apiService.putCustom<Settings>('/settings', settingsData).subscribe({
        next: (response: any) => {
          this.notificationService.success('Success', 'Settings updated successfully');
          this.loadSettings();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error updating settings:', error);
          this.notificationService.error('Error', error.error?.message || 'Failed to update settings');
          this.isSaving = false;
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.settingsForm.controls).forEach(key => {
        this.settingsForm.get(key)?.markAsTouched();
      });
      this.notificationService.error('Validation Error', 'Please fill in all required fields correctly');
    }
  }

  resetSettings(): void {
    if (confirm('Are you sure you want to reset settings to defaults? This action cannot be undone.')) {
      this.isResetting = true;
      this.apiService.postCustom<Settings>('/settings/reset', {}).subscribe({
        next: (response: any) => {
          this.notificationService.success('Success', 'Settings reset to defaults successfully');
          this.loadSettings();
          this.isResetting = false;
        },
        error: (error) => {
          console.error('Error resetting settings:', error);
          this.notificationService.error('Error', error.error?.message || 'Failed to reset settings');
          this.isResetting = false;
        }
      });
    }
  }

  getFieldError(fieldName: string): string {
    const control = this.settingsForm.get(fieldName);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} is required`;
      }
      if (control.errors?.['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors?.['pattern']) {
        if (fieldName === 'contact_phone' || fieldName === 'whatsapp') {
          return 'Must be exactly 11 digits';
        }
      }
      if (control.errors?.['min']) {
        return `${this.getFieldLabel(fieldName)} must be 0 or greater`;
      }
      if (control.errors?.['maxlength']) {
        return `${this.getFieldLabel(fieldName)} cannot exceed ${control.errors['maxlength'].requiredLength} characters`;
      }
      if (control.errors?.['invalidUrl']) {
        return 'Please enter a valid URL (must start with http:// or https://)';
      }
      if (control.errors?.['invalidWhatsApp']) {
        return 'WhatsApp must be exactly 11 digits';
      }
    }
    return '';
  }

  hasFieldError(fieldName: string): boolean {
    const control = this.settingsForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      contact_email: 'Contact Email',
      contact_phone: 'Contact Phone',
      shipping_cost: 'Shipping Cost',
      address: 'Address',
      facebook: 'Facebook',
      instagram: 'Instagram',
      whatsapp: 'WhatsApp',
      tiktok: 'TikTok'
    };
    return labels[fieldName] || fieldName;
  }

  // Custom validator for URLs - only validates if value is provided
  private urlValidator = (control: any) => {
    const value = control.value;
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      return null; // Valid if empty (optional field)
    }
    const urlPattern = /^https?:\/\/.+/;
    return urlPattern.test(value.trim()) ? null : { invalidUrl: true };
  };

  // Custom validator for WhatsApp - only validates if value is provided
  private whatsappValidator = (control: any) => {
    const value = control.value;
    if (!value || (typeof value === 'string' && value.trim().length === 0)) {
      return null; // Valid if empty (optional field)
    }
    const phonePattern = /^\d{11}$/;
    return phonePattern.test(value.trim()) ? null : { invalidWhatsApp: true };
  };
}
