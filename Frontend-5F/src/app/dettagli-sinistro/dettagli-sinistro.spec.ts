import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DettagliSinistro } from './dettagli-sinistro';

describe('DettagliSinistro', () => {
  let component: DettagliSinistro;
  let fixture: ComponentFixture<DettagliSinistro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DettagliSinistro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DettagliSinistro);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
