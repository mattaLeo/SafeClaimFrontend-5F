// info.component.ts  (metti in src/app/info/)
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-info',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './info.html',
})
export class Info {}

// ─────────────────────────────────────────────
// In app.routes.ts aggiungi UNA sola route:
//
// import { Info } from './info/info.component';
//
// { path: 'info', component: Info },
//
// I link nel footer usano:
//   routerLink="/info" fragment="privacy"
//   routerLink="/info" fragment="termini"
//   routerLink="/info" fragment="supporto"
//   routerLink="/info" fragment="contatti"
// ─────────────────────────────────────────────