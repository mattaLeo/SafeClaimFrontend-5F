import { Component, OnInit } from '@angular/core';
import { Sinistri } from '../services/sinistri';

@Component({
  selector: 'app-assicurazione',
  imports: [],
  templateUrl: './assicurazione.html',
  styleUrl: './assicurazione.css',
})
export class Assicurazione implements OnInit{

  constructor(public sinistri: Sinistri){

  }

  ngOnInit(): void {
    this.sinistri.askSinistri()
  }
}
