import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchedaDietaComponent } from './scheda-dieta';

describe('SchedaDietaComponent', () => {
    let component: SchedaDietaComponent;
    let fixture: ComponentFixture<SchedaDietaComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [SchedaDietaComponent]
        })
            .compileComponents();

        fixture = TestBed.createComponent(SchedaDietaComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
