// src/app/components/misurazione/misurazione.ts

import { Component, OnInit, Input, EventEmitter, Output, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MisurazioneAntropometricaDto, MisurazioneAntropometricaFormDto, MisurazioneDto } from '../../dto/misurazione-antropometrica.dto';


@Component({
  selector: 'app-misurazione',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './misurazione.html',
  styleUrls: ['./misurazione.css']
})
export class MisurazioneComponent implements OnInit {
  @Input() clienteId!: number;
  @Input() isDarkMode = false; 
  @Output() misurazioneSalvata = new EventEmitter<void>();
  
  private apiUrl = 'http://localhost:8080/api/misurazioni_antropometriche';
  
  misurazioniForm: FormGroup;
  parteCorporeaAttiva: string | null = null;
  salvataggioInCorso = false;
  messaggioSuccesso = '';
  messaggioErrore = '';

  misurazioni: MisurazioneDto[] = [
    { nome: 'Torace', valore: null, unita: 'cm', pathId: 'torace' },
    { nome: 'Addome', valore: null, unita: 'cm', pathId: 'addome' },
    { nome: 'Fianchi', valore: null, unita: 'cm', pathId: 'fianchi' },
    { nome: 'Spalle', valore: null, unita: 'cm', pathId: 'spalle' },
    { nome: 'Bicipite Destro', valore: null, unita: 'cm', pathId: 'bicipiteDx' },
    { nome: 'Bicipite Sinistro', valore: null, unita: 'cm', pathId: 'bicipiteSx' },
    { nome: 'Gamba Destra', valore: null, unita: 'cm', pathId: 'gambaDx' },
    { nome: 'Gamba Sinistra', valore: null, unita: 'cm', pathId: 'gambaSx' }
  ];

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {
    this.misurazioniForm = this.fb.group({});
  }

  ngOnInit(): void {
    console.log('Cliente ID ricevuto nel componente misurazione:', this.clienteId);
    console.log('🌙 isDarkMode ricevuto:', this.isDarkMode);
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

  private mapFormToDto(formValues: any): MisurazioneAntropometricaFormDto {
    return {
      spalle: formValues.spalle || null,
      vita: formValues.addome || null,
      fianchi: formValues.fianchi || null,
      torace: formValues.torace || null,
      gambaS: formValues.gambaSx || null,
      gambaD: formValues.gambaDx || null,
      bicipiteS: formValues.bicipiteSx || null,
      bicipiteD: formValues.bicipiteDx || null,
      dataMisurazione: new Date().toISOString().split('T')[0],
      cliente: { id: this.clienteId }
    };
  }

  salva(): void {
    if (this.misurazioniForm.valid && !this.salvataggioInCorso) {
      this.salvataggioInCorso = true;
      this.misurazioniForm.disable(); 
      this.messaggioErrore = '';
      this.messaggioSuccesso = '';

      const formData = this.mapFormToDto(this.misurazioniForm.value);

      this.http.post<MisurazioneAntropometricaDto>(this.apiUrl, formData).subscribe({
        next: (response: MisurazioneAntropometricaDto) => {
          console.log('Misurazione salvata con successo:', response);
          this.salvataggioInCorso = false;
          this.misurazioniForm.enable(); 
          this.messaggioSuccesso = 'Misurazione salvata con successo!';
          
          // Reset form dopo salvataggio
          this.misurazioniForm.reset();
          this.parteCorporeaAttiva = null;
          
          // Emetti evento per aggiornare la lista
          this.misurazioneSalvata.emit();
          
          // Scroll to top
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });

          
          setTimeout(() => {
            this.messaggioSuccesso = '';
            this.cdr.detectChanges();
          }, 3000);
        },
        error: (error: any) => {
          console.error('Errore durante il salvataggio:', error);
          this.salvataggioInCorso = false;
          this.misurazioniForm.enable(); 
          this.messaggioErrore = 'Errore durante il salvataggio della misurazione. Riprova.';
          
                  
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          });

          setTimeout(() => {
            this.messaggioErrore = '';
            this.cdr.detectChanges();
          }, 5000);
        }
      });
    }
  }

  reset(): void {
    this.misurazioniForm.reset();
    this.parteCorporeaAttiva = null;
    this.messaggioSuccesso = '';
    this.messaggioErrore = '';
  }

  focusNextInput(currentIndex: number, event: Event): void {
    event.preventDefault(); 
    
    const nextIndex = currentIndex + 1;
    
    if (nextIndex < this.misurazioni.length) {
      const nextPathId = this.misurazioni[nextIndex].pathId;
      const nextInput = document.getElementById(`input-${nextPathId}`) as HTMLInputElement;
      
      if (nextInput) {
        nextInput.focus();
      }
    } else {
      (event.target as HTMLInputElement).blur();
    }
  }
}