import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../services/auth';
import { User } from '../models/user.model';

export type UserRole = 'perito' | 'automobilista' | 'assicuratore';

@Component({
  selector: 'app-base',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './base.html',
  styleUrl: './base.css',
})
export class Base implements OnInit {
  sidebarOpen = false;
  currentRole: UserRole = 'perito';
  isAuthPage = false;

  constructor(private router: Router, private cdr: ChangeDetectorRef, public auth: AuthService) {}

  ngOnInit(): void {
    this.isAuthPage = this.checkAuthPage(this.router.url);

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.isAuthPage = this.checkAuthPage(e.urlAfterRedirects || e.url);
        this.cdr.detectChanges();
      });

    const savedRole = localStorage.getItem('userRole') as UserRole;
    if (!savedRole) {
      this.router.navigate(['/signin']);
      this.cdr.detectChanges();
      return;
    }

    this.currentRole = savedRole;
  }

  get user() {
    return this.auth.currentUser;
  }

  private checkAuthPage(url: string): boolean {
    const authRoutes = ['/signin', '/signup'];
    return authRoutes.some(r => url.startsWith(r));
  }

  openSidebar(): void { this.sidebarOpen = true; }
  closeSidebar(): void { this.sidebarOpen = false; }

  switchRole(role: UserRole): void {
    this.currentRole = role;
    localStorage.setItem('userRole', role);
    const routeMap: Record<UserRole, string> = {
      perito: '/perito',
      automobilista: '/automobilista',
      assicuratore: '/assicurazione',
    };
    this.router.navigate([routeMap[role]]);
    this.closeSidebar();
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  logout(): void {
    localStorage.clear();
    this.router.navigate(['/signin']);
    this.closeSidebar();
  }
}