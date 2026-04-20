import { Component, OnInit } from '@angular/core';
import { Sinistri } from '../services/sinistri';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-assicurazione',
  imports: [CommonModule],
  templateUrl: './assicurazione.html',
  styleUrl: './assicurazione.css',
})
export class Assicurazione implements OnInit {

  constructor(public sinistri: Sinistri) {}

  ngOnInit(): void {
    this.sinistri.askSinistri();
  }
}