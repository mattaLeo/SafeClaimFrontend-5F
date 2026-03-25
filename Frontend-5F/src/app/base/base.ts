import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

export type UserRole = 'perito' | 'automobilista' | 'assicurazione';

@Component({
  selector: 'app-base',
  standalone: true,
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './base.html',
  styleUrl: './base.css',
})
export class Base implements OnInit {
  sidebarOpen = false;

  userName = 'Leonardo Matta';
  userCode = 'P-9928';
  currentRole: UserRole = 'perito';

  isHomePage = false;

  get initials(): string {
    return this.userName
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  get isAuthPage(): boolean {
    const authRoutes = ['/signin', '/signup'];
    return authRoutes.some(r => this.router.url.startsWith(r));
  }

  constructor(private router: Router) {}

  ngOnInit(): void {
    const savedRole = localStorage.getItem('userRole') as UserRole;
    if (savedRole) {
      this.currentRole = savedRole;
    }

    this.checkHomePage(this.router.url);

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        this.checkHomePage(e.urlAfterRedirects || e.url);
      });
  }

  private checkHomePage(url: string): void {
    this.isHomePage = url === '/' || url === '';
  }

  openSidebar(): void {
    this.sidebarOpen = true;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  switchRole(role: UserRole): void {
    this.currentRole = role;
    localStorage.setItem('userRole', role);

    const routeMap: Record<UserRole, string> = {
      perito: '/perito',
      automobilista: '/automobilista',
      assicurazione: '/assicurazione',
    };

    this.router.navigate([routeMap[role]]);
    this.closeSidebar();
  }

  navigateToSignup(role: UserRole): void {
    this.router.navigate(['/signup'], { queryParams: { role } });
  }

  navigateToSignin(): void {
    this.router.navigate(['/signin']);
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