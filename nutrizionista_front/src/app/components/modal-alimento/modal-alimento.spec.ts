import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { ModalAlimento } from './modal-alimento';

describe('ModalAlimento', () => {
  let component: ModalAlimento;
  let fixture: ComponentFixture<ModalAlimento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAlimento]
    })
      .compileComponents();

    fixture = TestBed.createComponent(ModalAlimento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emette closed al click su backdrop quando non in loading', async () => {
    const spy = vi.spyOn(component.closed as any, 'emit');
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('loading', false);
    fixture.detectChanges();
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    el.querySelector('.modal-backdrop')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });

  it('non chiude al click su backdrop durante loading', async () => {
    const spy = vi.spyOn(component.closed as any, 'emit');
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();
    await fixture.whenStable();

    const el: HTMLElement = fixture.nativeElement;
    el.querySelector('.modal-backdrop')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(spy).not.toHaveBeenCalled();
  });

  it('emette addRequested con quantita', async () => {
    const addSpy = vi.spyOn(component.addRequested as any, 'emit');
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('loading', false);
    fixture.componentRef.setInput('pastoTargetLabel', 'Pranzo');
    fixture.componentRef.setInput('alimento', { id: 1, nome: 'Riso', macroNutrienti: { calorie: 100, proteine: 2, carboidrati: 20, grassi: 1 } } as any);
    fixture.detectChanges();
    await fixture.whenStable();

    component.qty = 150;
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    (el.querySelector('.btn-primary') as HTMLButtonElement).click();
    expect(addSpy).toHaveBeenCalledWith({ alimento: expect.any(Object), quantita: 150 });
  });
});
