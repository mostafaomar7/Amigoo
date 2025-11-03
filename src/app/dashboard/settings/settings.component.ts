import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';

export interface Settings {
  _id?: string;
  site_name: string;
  contact_email: string;
  contact_phone: string;
  shipping_cost: number;
  free_shipping_threshold: number;
  social_media?: {
    facebook?: string;
    instagram?: string;
    messenger?: string;
    whatsapp?: string;
    twitter?: string;
    linkedin?: string;
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
      site_name: ['', Validators.required],
      contact_email: ['', [Validators.required, Validators.email]],
      contact_phone: ['', [Validators.required, Validators.pattern(/^\d{11}$/)]],
      shipping_cost: [0, [Validators.required, Validators.min(0)]],
      free_shipping_threshold: [0, [Validators.required, Validators.min(0)]],
      facebook: [''],
      instagram: [''],
      messenger: [''],
      whatsapp: ['']
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
      site_name: settings.site_name || '',
      contact_email: settings.contact_email || '',
      contact_phone: settings.contact_phone || '',
      shipping_cost: settings.shipping_cost || 0,
      free_shipping_threshold: settings.free_shipping_threshold || 0,
      facebook: settings.social_media?.facebook || '',
      instagram: settings.social_media?.instagram || '',
      messenger: settings.social_media?.messenger || '',
      whatsapp: settings.social_media?.whatsapp || ''
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
      if (formValue.messenger) socialMedia.messenger = formValue.messenger;
      if (formValue.whatsapp) socialMedia.whatsapp = formValue.whatsapp;

      const settingsData: any = {
        site_name: formValue.site_name,
        contact_email: formValue.contact_email,
        contact_phone: formValue.contact_phone,
        shipping_cost: formValue.shipping_cost,
        free_shipping_threshold: formValue.free_shipping_threshold
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
      if (control.errors?.['pattern'] && fieldName === 'contact_phone') {
        return 'Phone number must be exactly 11 digits';
      }
      if (control.errors?.['min']) {
        return `${this.getFieldLabel(fieldName)} must be 0 or greater`;
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
      site_name: 'Site Name',
      contact_email: 'Contact Email',
      contact_phone: 'Contact Phone',
      shipping_cost: 'Shipping Cost',
      free_shipping_threshold: 'Free Shipping Threshold',
      facebook: 'Facebook',
      instagram: 'Instagram',
      messenger: 'Messenger',
      whatsapp: 'WhatsApp'
    };
    return labels[fieldName] || fieldName;
  }
}
