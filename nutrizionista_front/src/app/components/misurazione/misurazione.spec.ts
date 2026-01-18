import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Misurazione } from './misurazione';

describe('Misurazione', () => {
  let component: Misurazione;
  let fixture: ComponentFixture<Misurazione>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Misurazione]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Misurazione);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
