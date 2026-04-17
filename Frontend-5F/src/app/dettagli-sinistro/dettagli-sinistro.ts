import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { sinistro } from '../models/sinistro.model';
import { SinistriService } from '../services/sinistri';

@Component({
  selector: 'app-dettaglio-sinistro',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dettagli-sinistro.html',
  styleUrls: ['./dettagli-sinistro.css'],
})
export class DettaglioSinistroComponent implements OnInit {
  @Input() sinistro!: sinistro;
  @Output() closed = new EventEmitter<void>();

  immagini: string[] = [];
  uploadingFiles: File[] = [];
  previewUrls: string[] = [];
  uploading = false;
  uploadError = '';
  uploadSuccess = '';

  constructor(
    private sinistriService: SinistriService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Carica immagini già presenti nel sinistro
    if (this.sinistro?.immagini?.length) {
      this.immagini = this.sinistro.immagini;
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    this.uploadingFiles = files;
    this.previewUrls = [];
    this.uploadError = '';
    this.uploadSuccess = '';

    let loaded = 0;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrls.push(e.target?.result as string);
        loaded++;
        if (loaded === files.length) {
          this.cdr.detectChanges(); // forza aggiornamento view subito
        }
      };
      reader.readAsDataURL(file);
    });
  }

  inviaImmagini(): void {
    console.log('sinistro._id:', this.sinistro._id);
    console.log('uploadingFiles:', this.uploadingFiles.length);

    if (!this.uploadingFiles.length || !this.sinistro._id) return;

    this.uploading = true;
    this.uploadError = '';
    this.uploadSuccess = '';
    this.cdr.detectChanges();

    this.sinistriService.uploadImmagini(this.sinistro._id, this.uploadingFiles).subscribe({
      next: () => {
        this.immagini = [...this.immagini, ...this.previewUrls];
        this.previewUrls = [];
        this.uploadingFiles = [];
        this.uploading = false;
        this.uploadSuccess = 'Immagini caricate!';
        this.cdr.detectChanges();
        setTimeout(() => this.close(), 1500); // chiude dopo 1.5s
      },
      error: (err) => {
        this.uploading = false;
        this.uploadError = 'Errore durante il caricamento. Riprova.';
        this.cdr.detectChanges();
        console.error(err);
      }
    });
  }

  close(): void {
    this.closed.emit();
  }
}