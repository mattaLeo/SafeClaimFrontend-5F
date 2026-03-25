import { TestBed } from '@angular/core/testing';

import { Veicoli } from './veicoli';

describe('Veicoli', () => {
  let service: Veicoli;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Veicoli);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
