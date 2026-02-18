import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlicometriaComponent } from './plicometria';

describe('Plicometria', () => {
  let component: Plicometria;
  let fixture: ComponentFixture<Plicometria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlicometriaComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PlicometriaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
