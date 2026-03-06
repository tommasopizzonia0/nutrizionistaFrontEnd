import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalcoloTdeeComponent } from './calcolo-tdee';

describe('CalcoloTdee', () => {
  let component: CalcoloTdeeComponent;
  let fixture: ComponentFixture<CalcoloTdeeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalcoloTdeeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalcoloTdeeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
