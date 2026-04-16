import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
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

  constructor(private sinistriService: SinistriService) {}

  ngOnInit(): void {}

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    this.uploadingFiles = files;
    this.previewUrls = [];
    this.uploadError = '';
    this.uploadSuccess = '';

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrls.push(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    });
  }

  inviaImmagini(): void {
    if (!this.uploadingFiles.length || !this.sinistro._id) return;

    this.uploading = true;
    this.uploadError = '';
    this.uploadSuccess = '';

    this.sinistriService.uploadImmagini(this.sinistro._id, this.uploadingFiles).subscribe({
      next: () => {
        this.uploading = false;
        this.uploadSuccess = 'Immagini caricate con successo!';
        this.immagini = [...this.immagini, ...this.previewUrls];
        this.previewUrls = [];
        this.uploadingFiles = [];
      },
      error: (err) => {
        this.uploading = false;
        this.uploadError = 'Errore durante il caricamento. Riprova.';
        console.error(err);
      }
    });
  }

  close(): void {
    this.closed.emit();
  }
}