import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faExclamationTriangle, faXmark } from '@fortawesome/free-solid-svg-icons';

const LABEL_MAP: Record<string, string> = {
    peso: 'Peso (kg)',
    altezza: 'Altezza (cm)',
    dataNascita: 'Data di nascita',
    sesso: 'Sesso',
    livelloDiAttivita: 'Livello di attività',
};

@Component({
    selector: 'app-modal-dati-mancanti',
    standalone: true,
    imports: [CommonModule, FontAwesomeModule],
    templateUrl: './modal-dati-mancanti.html',
    styleUrl: './modal-dati-mancanti.css',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalDatiMancanti {
    @Input() open = false;
    @Input() campiMancanti: string[] = [];
    @Input() isDarkMode = false;
    @Output() closed = new EventEmitter<void>();
    @Output() compilaDati = new EventEmitter<void>();

    readonly icons = {
        warning: faExclamationTriangle,
        close: faXmark
    };

    getLabel(campo: string): string {
        return LABEL_MAP[campo] || campo;
    }

    onOverlayClick(event: Event): void {
        if ((event.target as Element).classList.contains('modal-overlay')) {
            this.closed.emit();
        }
    }
}
