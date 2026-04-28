import { Component, Input, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { sinistro } from '../models/sinistro.model';
import { Sinistri } from '../services/sinistri';
import { CreaPraticaComponent } from '../crea-pratica/crea-pratica';

@Component({
  selector: 'app-dettaglio-sinistro',
  standalone: true,
  imports: [CommonModule, CreaPraticaComponent], // ← aggiunto qui
  templateUrl: './dettagli-sinistro.html',
  styleUrls: ['./dettagli-sinistro.css'],
})
export class DettaglioSinistroComponent implements OnInit {
  @Input() sinistro!: sinistro;
  @Output() closed = new EventEmitter<void>();
  @Input() ruolo: 'automobilista' | 'assicuratore' = 'automobilista';

  stati = ['APERTO', 'IN ANALISI', 'CHIUSO'];
  mostraCreaPratica = false; // ← assicurati che ci sia

  immagini: string[] = [];
  uploadingFiles: File[] = [];
  previewUrls: string[] = [];
  uploading = false;
  uploadError = '';
  uploadSuccess = '';

  constructor(
    private Sinistri: Sinistri,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.sinistro?.immagini?.length) {
      this.immagini = this.sinistro.immagini.map((img: any) => {
        if (typeof img === 'string') return img;
        if (img.secure_url) return img.secure_url;
        if (img.url) return img.url;
        // Ricostruisci URL Cloudinary dal public_id
        if (img.public_id) return `https://res.cloudinary.com/dm6estjhs/image/upload/${img.public_id}`;
        return null;
      }).filter(Boolean);
    }
  }

  cambiaStato(nuovoStato: string) {
    if (this.sinistro.stato === nuovoStato) return;
    this.sinistro.stato = nuovoStato;
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
        if (loaded === files.length) this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    });
  }

  inviaImmagini(): void {
    if (!this.uploadingFiles.length || !this.sinistro._id) return;
    this.uploading = true;
    this.uploadError = '';
    this.uploadSuccess = '';
    this.cdr.detectChanges();
    this.Sinistri.uploadImmagini(this.sinistro._id, this.uploadingFiles).subscribe({
      next: () => {
        this.immagini = [...this.immagini, ...this.previewUrls];
        this.previewUrls = [];
        this.uploadingFiles = [];
        this.uploading = false;
        this.uploadSuccess = 'Immagini caricate!';
        this.cdr.detectChanges();
        setTimeout(() => this.close(), 1500);
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