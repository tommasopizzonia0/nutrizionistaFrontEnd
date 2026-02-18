import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ElementRef } from '@angular/core';
import { vi } from 'vitest';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { SchedaDietaComponent } from './scheda-dieta';

describe('SchedaDietaComponent', () => {
    let component: SchedaDietaComponent;
    let fixture: ComponentFixture<SchedaDietaComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SchedaDietaComponent, HttpClientTestingModule],
            providers: [
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: convertToParamMap({}) } }
                }
            ]
        })
            .compileComponents();

        fixture = TestBed.createComponent(SchedaDietaComponent);
        component = fixture.componentInstance;
        await fixture.whenStable();
    }, 30000);

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('mostra il nome passato prima del caricamento scheda', async () => {
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.componentRef.setInput('schedaNome', 'Dieta Ipocalorica');
        fixture.detectChanges();
        await fixture.whenStable();
        const el: HTMLElement = fixture.nativeElement;
        expect(el.textContent || '').toContain('Dieta Ipocalorica');
    });

    it('renderizza il grafico quando ci sono dati macro', () => {
        const canvas = document.createElement('canvas');
        component.macroPieChart = new ElementRef(canvas);

        const fakeChart: any = {
            data: { labels: [], datasets: [{ data: [] }] },
            options: { plugins: { legend: { labels: {} } } },
            update: () => undefined,
            destroy: () => undefined
        };
        const createSpy = vi.spyOn(component as any, 'createMacroChart').mockReturnValue(fakeChart);

        component.pasti = [{
            alimentiPasto: [{
                quantita: 100,
                alimento: {
                    misuraInGrammi: 100,
                    macroNutrienti: { proteine: 10, carboidrati: 20, grassi: 30 }
                }
            }]
        }] as any;

        (component as any).updateMacroChartFromPasti();

        expect(component.macroChartHasData).toBe(true);
        expect(createSpy).toHaveBeenCalled();
    });

    it('non renderizza il grafico quando i dati macro sono assenti', () => {
        const canvas = document.createElement('canvas');
        component.macroPieChart = new ElementRef(canvas);

        const createSpy = vi.spyOn(component as any, 'createMacroChart');

        component.pasti = [{
            alimentiPasto: [{
                quantita: 0,
                alimento: {
                    misuraInGrammi: 100,
                    macroNutrienti: { proteine: 0, carboidrati: 0, grassi: 0 }
                }
            }]
        }] as any;

        (component as any).updateMacroChartFromPasti();

        expect(component.macroChartHasData).toBe(false);
        expect(createSpy).not.toHaveBeenCalled();
    });
});
