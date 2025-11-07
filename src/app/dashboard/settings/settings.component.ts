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
          this.notificationService.info('معلومات', 'لم يتم العثور على الإعدادات. يمكنك إنشاء إعدادات جديدة عن طريق الحفظ.');
        } else {
          this.notificationService.error('خطأ', 'فشل في تحميل الإعدادات');
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
          this.notificationService.success('نجاح', 'تم تحديث الإعدادات بنجاح');
          this.loadSettings();
          this.isSaving = false;
        },
        error: (error) => {
          console.error('Error updating settings:', error);
          this.notificationService.error('خطأ', error.error?.message || 'فشل في تحديث الإعدادات');
          this.isSaving = false;
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.settingsForm.controls).forEach(key => {
        this.settingsForm.get(key)?.markAsTouched();
      });
      this.notificationService.error('خطأ في التحقق', 'يرجى ملء جميع الحقول المطلوبة بشكل صحيح');
    }
  }

  resetSettings(): void {
    if (confirm('هل أنت متأكد من إعادة تعيين الإعدادات إلى الافتراضي؟ لا يمكن التراجع عن هذا الإجراء.')) {
      this.isResetting = true;
      this.apiService.postCustom<Settings>('/settings/reset', {}).subscribe({
        next: (response: any) => {
          this.notificationService.success('نجاح', 'تم إعادة تعيين الإعدادات إلى الافتراضي بنجاح');
          this.loadSettings();
          this.isResetting = false;
        },
        error: (error) => {
          console.error('Error resetting settings:', error);
          this.notificationService.error('خطأ', error.error?.message || 'فشل في إعادة تعيين الإعدادات');
          this.isResetting = false;
        }
      });
    }
  }

  getFieldError(fieldName: string): string {
    const control = this.settingsForm.get(fieldName);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} مطلوب`;
      }
      if (control.errors?.['email']) {
        return 'يرجى إدخال عنوان بريد إلكتروني صحيح';
      }
      if (control.errors?.['pattern']) {
        if (fieldName === 'contact_phone' || fieldName === 'whatsapp') {
          return 'يجب أن يكون 11 رقم بالضبط';
        }
      }
      if (control.errors?.['min']) {
        return `${this.getFieldLabel(fieldName)} يجب أن يكون 0 أو أكبر`;
      }
      if (control.errors?.['maxlength']) {
        return `${this.getFieldLabel(fieldName)} لا يمكن أن يتجاوز ${control.errors['maxlength'].requiredLength} حرف`;
      }
      if (control.errors?.['invalidUrl']) {
        return 'يرجى إدخال رابط صحيح (يجب أن يبدأ بـ http:// أو https://)';
      }
      if (control.errors?.['invalidWhatsApp']) {
        return 'يجب أن يكون رقم WhatsApp 11 رقم بالضبط';
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
      contact_email: 'البريد الإلكتروني للاتصال',
      contact_phone: 'هاتف الاتصال',
      shipping_cost: 'تكلفة الشحن',
      address: 'العنوان',
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
