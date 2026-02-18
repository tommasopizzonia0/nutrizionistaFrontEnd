import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlimentoAggiunto } from './alimento-aggiunto';

describe('AlimentoAggiunto', () => {
  let component: AlimentoAggiunto;
  let fixture: ComponentFixture<AlimentoAggiunto>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlimentoAggiunto]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlimentoAggiunto);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
