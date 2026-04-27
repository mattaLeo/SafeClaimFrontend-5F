import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pratica } from '../models/pratica.model';

@Component({
  selector: 'app-dettaglio-pratica',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dettagli-pratica.html',
})
export class DettaglioPraticaComponent {
  @Input() pratica!: Pratica;
  @Output() closed = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }
}