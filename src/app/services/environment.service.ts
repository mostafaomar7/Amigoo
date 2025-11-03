import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  get imageBaseUrl(): string {
    return environment.imageBaseUrl;
  }

  get apiUrl(): string {
    return environment.apiUrl;
  }

  get appName(): string {
    return environment.appName;
  }

  get isProduction(): boolean {
    return environment.production;
  }

  /**
   * Get full image URL for a given image path
   * @param imagePath - The image path (e.g., 'products/image.jpg' or 'category/image.jpg')
   * @returns Full URL to the image
   */
  getImageUrl(imagePath: string): string {
    if (!imagePath) {
      return '';
    }

    // If imagePath already contains http/https, return as is
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }

    // Remove leading slash if present
    const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;

    return `${this.imageBaseUrl}/${cleanPath}`;
  }
}
