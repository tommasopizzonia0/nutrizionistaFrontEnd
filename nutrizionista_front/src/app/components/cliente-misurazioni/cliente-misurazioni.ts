
import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MisurazioneComponent } from '../misurazione/misurazione';
import { ListaMisurazioniComponent } from '../lista-misurazioni/lista-misurazioni';


@Component({
  selector: 'app-cliente-misurazioni',
  standalone: true,
  imports: [CommonModule, MisurazioneComponent, ListaMisurazioniComponent],
  templateUrl: './cliente-misurazioni.html',
  styleUrls: ['./cliente-misurazioni.css']
})
export class ClienteMisurazioniComponent {
  @Input() clienteId!: number;
  @Input() isDarkMode = false;

  @ViewChild(ListaMisurazioniComponent) misurazioneList!: ListaMisurazioniComponent;

  onMisurazioneSalvata(): void {
    // Ricarica la lista delle misurazioni quando viene salvata una nuova
    if (this.misurazioneList) {
      this.misurazioneList.loadMisurazioni();
    }
  }
}