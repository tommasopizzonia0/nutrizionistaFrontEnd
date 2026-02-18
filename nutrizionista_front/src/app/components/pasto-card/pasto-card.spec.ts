import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PastoCard } from './pasto-card';

describe('PastoCard', () => {
  let component: PastoCard;
  let fixture: ComponentFixture<PastoCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PastoCard]
    })
      .compileComponents();

    fixture = TestBed.createComponent(PastoCard);
    component = fixture.componentInstance;
    component.pasto = { nome: 'Pranzo', alimentiPasto: [] } as any;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
