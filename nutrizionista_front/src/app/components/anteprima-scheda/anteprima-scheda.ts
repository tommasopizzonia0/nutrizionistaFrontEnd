import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faEdit, faTimes, faCalendarDays, faCheckCircle, faBan,
  faUtensils, faFire, faClipboardList, faSpinner
} from '@fortawesome/free-solid-svg-icons';

import { SchedaDto } from '../../dto/scheda.dto';
import { PastoDto } from '../../dto/pasto.dto';
import { SchedaService } from '../../services/scheda-service';

@Component({
  selector: 'app-anteprima-scheda',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './anteprima-scheda.html',
  styleUrls: ['./anteprima-scheda.css']
})
export class AnteprimaSchedaComponent implements OnChanges {
  @Input() scheda!: SchedaDto;
  @Input() isDarkMode = false;
  @Output() editRequested = new EventEmitter<void>();
  @Output() closeRequested = new EventEmitter<void>();

  private schedaService = inject(SchedaService);
  private cdr = inject(ChangeDetectorRef);

  // La scheda con dati completi (pasti + alimentiPasto)
  schedaDettagliata?: SchedaDto;
  loading = false;

  // Icone
  icEdit = faEdit;
  icClose = faTimes;
  icCalendar = faCalendarDays;
  icCheck = faCheckCircle;
  icBan = faBan;
  icUtensils = faUtensils;
  icFire = faFire;
  icClipboard = faClipboardList;
  icSpinner = faSpinner;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scheda'] && this.scheda?.id) {
      this.loadSchedaDettagliata(this.scheda.id);
    }
  }

  private loadSchedaDettagliata(id: number): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.schedaService.getById(id).subscribe({
      next: (scheda) => {
        this.schedaDettagliata = scheda;
        this.loading = false;
        this.cdr.detectChanges(); // Forza aggiornamento UI
      },
      error: () => {
        // Fallback: usa la scheda passata senza dettagli
        this.schedaDettagliata = this.scheda;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onEdit(): void {
    this.editRequested.emit();
  }

  onClose(): void {
    this.closeRequested.emit();
  }

  calcolaTotaleCalorico(pasto: PastoDto): number {
    if (!pasto.alimentiPasto) return 0;
    return pasto.alimentiPasto.reduce((sum, ap) => {
      const cal = ap.alimento?.macroNutrienti?.calorie || 0;
      return sum + Math.round(cal * (ap.quantita || 0) / (ap.alimento?.misuraInGrammi || 100));
    }, 0);
  }

  calcolaTotaleCalorieGiornaliere(): number {
    if (!this.schedaDettagliata?.pasti) return 0;
    return this.schedaDettagliata.pasti.reduce((sum, pasto) => sum + this.calcolaTotaleCalorico(pasto), 0);
  }
}
