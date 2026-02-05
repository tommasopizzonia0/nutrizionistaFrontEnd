import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {
  faEdit, faTimes, faCalendarDays, faCheckCircle, faBan,
  faUtensils, faFire, faClipboardList
} from '@fortawesome/free-solid-svg-icons';

import { SchedaDto } from '../../dto/scheda.dto';
import { PastoDto } from '../../dto/pasto.dto';

@Component({
  selector: 'app-anteprima-scheda',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './anteprima-scheda.html',
  styleUrls: ['./anteprima-scheda.css']
})
export class AnteprimaSchedaComponent {
  @Input() scheda!: SchedaDto;
  @Input() isDarkMode = false;
  @Output() editRequested = new EventEmitter<void>();
  @Output() closeRequested = new EventEmitter<void>();

  // Icone
  icEdit = faEdit;
  icClose = faTimes;
  icCalendar = faCalendarDays;
  icCheck = faCheckCircle;
  icBan = faBan;
  icUtensils = faUtensils;
  icFire = faFire;
  icClipboard = faClipboardList;

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
    if (!this.scheda?.pasti) return 0;
    return this.scheda.pasti.reduce((sum, pasto) => sum + this.calcolaTotaleCalorico(pasto), 0);
  }
}
