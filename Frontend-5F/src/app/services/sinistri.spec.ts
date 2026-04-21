import { TestBed } from '@angular/core/testing';

import { SinistriService } from './sinistri';

describe('SinistriService', () => {
  let service: SinistriService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SinistriService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
