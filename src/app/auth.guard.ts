import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(): boolean {
    const user = localStorage.getItem('jwt'); // افترض أنك تخزن بيانات تسجيل الدخول هنا

    if (!user) {
      this.router.navigate(['/login']); // تحويل إلى صفحة تسجيل الدخول
      return false;
    }

    return true;
  }
}
