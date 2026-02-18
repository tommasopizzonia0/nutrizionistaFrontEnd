import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalcoloMacro } from './calcolo-macro';

describe('CalcoloMacro', () => {
  let component: CalcoloMacro;
  let fixture: ComponentFixture<CalcoloMacro>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalcoloMacro]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalcoloMacro);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
