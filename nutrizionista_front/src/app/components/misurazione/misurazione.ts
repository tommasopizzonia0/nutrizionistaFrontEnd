import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MisurazioneDto } from '../../dto/misurazione.dto'; // <-- IMPORTA IL DTO

@Component({
  selector: 'app-misurazione',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './misurazione.html',
  styleUrls: ['./misurazione.css']
})
export class Misurazione implements OnInit {
  @Input() clienteId!: number;
  @Output() misurazioneSalvata = new EventEmitter<void>();
  
  misurazioniForm: FormGroup;
  parteCorporeaAttiva: string | null = null;

  misurazioni: MisurazioneDto[] = [
    { nome: 'Testa', valore: null, unita: 'cm', pathId: 'testa' },
    { nome: 'Torace', valore: null, unita: 'cm', pathId: 'torace' },
    { nome: 'Addome', valore: null, unita: 'cm', pathId: 'addome' },
    { nome: 'Fianchi', valore: null, unita: 'cm', pathId: 'fianchi' },
    { nome: 'Spalle', valore: null, unita: 'cm', pathId: 'spalle' },
    { nome: 'Bicipite Destro', valore: null, unita: 'cm', pathId: 'bicipiteDx' },
    { nome: 'Bicipite Sinistro', valore: null, unita: 'cm', pathId: 'bicipiteSx' },
    { nome: 'Gamba Destra', valore: null, unita: 'cm', pathId: 'gambaDx' },
    { nome: 'Gamba Sinistra', valore: null, unita: 'cm', pathId: 'gambaSx' }
  ];

  constructor(private fb: FormBuilder) {
    this.misurazioniForm = this.fb.group({});
  }

  ngOnInit(): void {
    console.log('Cliente ID ricevuto nel componente misurazione:', this.clienteId);
    this.inizializzaForm();
  }

  inizializzaForm(): void {
    this.misurazioni.forEach(mis => {
      this.misurazioniForm.addControl(
        mis.pathId,
        this.fb.control(mis.valore, [Validators.min(0), Validators.max(300)])
      );
    });
  }

  onFocusInput(pathId: string): void {
    this.parteCorporeaAttiva = pathId;
  }

  onBlurInput(): void {
    this.parteCorporeaAttiva = null;
  }

  onClickSVG(pathId: string): void {
    const inputElement = document.getElementById(`input-${pathId}`) as HTMLInputElement;
    if (inputElement) {
      inputElement.focus();
    }
  }

    salva(): void {
      if (this.misurazioniForm.valid) {

        
        this.misurazioneSalvata.emit();

        
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }

  reset(): void {
    this.misurazioniForm.reset();
    this.parteCorporeaAttiva = null;
  }
}