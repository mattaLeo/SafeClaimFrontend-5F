import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Base } from './base/base';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Base],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Frontend-5F');
}
