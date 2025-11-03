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
  shipping: number;
  facebook?: string;
  instgram?: string;
  messanger?: string;
  whatsapp?: string;
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
      contact_phone: ['', Validators.required],
      shipping_cost: [0, [Validators.required, Validators.min(0)]],
      shipping: [0, [Validators.required, Validators.min(0)]],
      facebook: [''],
      instgram: [''],
      messanger: [''],
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
      shipping: settings.shipping || 0,
      facebook: settings.facebook || '',
      instgram: settings.instgram || '',
      messanger: settings.messanger || '',
      whatsapp: settings.whatsapp || ''
    });
  }

  saveSettings(): void {
    if (this.settingsForm.valid) {
      this.isSaving = true;
      const formValue = this.settingsForm.value;
      const settingsData: Settings = {
        site_name: formValue.site_name,
        contact_email: formValue.contact_email,
        contact_phone: formValue.contact_phone,
        shipping_cost: formValue.shipping_cost,
        shipping: formValue.shipping,
        facebook: formValue.facebook || undefined,
        instgram: formValue.instgram || undefined,
        messanger: formValue.messanger || undefined,
        whatsapp: formValue.whatsapp || undefined
      };

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
      shipping: 'Shipping',
      facebook: 'Facebook',
      instgram: 'Instagram',
      messanger: 'Messenger',
      whatsapp: 'WhatsApp'
    };
    return labels[fieldName] || fieldName;
  }
}
