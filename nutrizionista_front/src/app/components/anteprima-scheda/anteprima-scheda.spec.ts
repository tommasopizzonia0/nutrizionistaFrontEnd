import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnteprimaSchedaComponent } from './anteprima-scheda';

describe('AnteprimaSchedaComponent', () => {
  let component: AnteprimaSchedaComponent;
  let fixture: ComponentFixture<AnteprimaSchedaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnteprimaSchedaComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(AnteprimaSchedaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
