import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnteprimaScheda } from './anteprima-scheda';

describe('AnteprimaScheda', () => {
  let component: AnteprimaScheda;
  let fixture: ComponentFixture<AnteprimaScheda>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnteprimaScheda]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnteprimaScheda);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
