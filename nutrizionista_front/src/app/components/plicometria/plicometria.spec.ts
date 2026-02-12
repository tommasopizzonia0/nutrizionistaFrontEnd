import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Plicometria } from './plicometria';

describe('Plicometria', () => {
  let component: Plicometria;
  let fixture: ComponentFixture<Plicometria>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Plicometria]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Plicometria);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
