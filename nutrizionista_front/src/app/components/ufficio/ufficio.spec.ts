import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UfficioComponent } from './ufficio';

describe('Ufficio', () => {
  let component: UfficioComponent;
  let fixture: ComponentFixture<UfficioComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UfficioComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UfficioComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
