import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

import { PlicometrieApiService } from '../../services/plicometria.service';
import { PlicometriaDto, PlicometriaFormDto } from '../../dto/plicometria.dto';
import { PageResponse } from '../../dto/page-response.dto';
import { faCalendar, faChevronLeft, faChevronRight, faEdit, faFontAwesome, faPlus, faRuler, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

type MetodoValue =
  | 'JACKSON_POLLOCK_3'
  | 'JACKSON_POLLOCK_7'
  | 'DURNIN_WOMERSLEY'
  | 'PARILLO'
  | 'MISURAZIONE_LIBERA';

@Component({
  selector: 'app-plicometria',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './plicometria.html',
  styleUrls: ['./plicometria.css'],
})
export class PlicometriaComponent implements OnInit, OnChanges, OnDestroy {
  private api = inject(PlicometrieApiService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  private destroy$ = new Subject<void>();

  @Input({ required: true }) clienteId!: number;
  @Input() isDarkMode = false;

  page: PageResponse<PlicometriaDto> | null = null;
  loading = false;
  saving = false;

  // Icone disponibili nel template
  icCalendar = faCalendar;
  icEdit = faEdit;
  icTrash = faTrash;
  icChevronLeft = faChevronLeft;
  icChevronRight = faChevronRight;
  icRuler = faRuler; 
  icPlus = faPlus;

  // paginazione
  numeroPagina = 0;
  dimensionePagina = 10;

  // editing
  editingId: number | null = null;

  // ✅ mostra/nasconde il form
  showForm = false;

  metodi: Array<{ value: MetodoValue; label: string }> = [
    { value: 'JACKSON_POLLOCK_3', label: 'Jackson Pollock 3' },
    { value: 'JACKSON_POLLOCK_7', label: 'Jackson Pollock 7' },
    { value: 'DURNIN_WOMERSLEY', label: 'Durnin & Womersley (4 pliche)' },
    { value: 'PARILLO', label: 'Parillo (manuale)' },
    { value: 'MISURAZIONE_LIBERA', label: 'Misurazione libera (manuale)' },
  ];

  form = this.fb.group({
    metodo: [null as MetodoValue | null, Validators.required],
    dataMisurazione: [null as string | null, Validators.required],

    tricipite: [null as number | null],
    bicipite: [null as number | null],
    sottoscapolare: [null as number | null],
    sovrailiaca: [null as number | null],
    addominale: [null as number | null],
    coscia: [null as number | null],
    pettorale: [null as number | null],
    ascellare: [null as number | null],
    polpaccio: [null as number | null],

    note: [null as string | null],
  });

  // ✅ Carica subito (utile se la tab crea il componente quando clienteId è già pronto)
  ngOnInit(): void {
    if (this.clienteId) {
      this.loadPage(0);
      this.startCreate(false); // prepara valori ma NON apre il form
    }
  }

  // ✅ Ricarica quando cambia clienteId (utile se la tab crea prima, poi arriva clienteId)
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clienteId'] && this.clienteId) {
      this.loadPage(0);
      this.startCreate(false); // reset form senza aprirlo
    }
  }

  // ✅ Evita subscribe “appese” quando esci/rientri
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  isEditing(): boolean {
    return this.editingId !== null;
  }

  // ===== LISTA =====
  loadPage(pageIndex: number) {
    if (!this.clienteId) return;

    this.loading = true;
    this.cdr.markForCheck();

    this.api
      .allByCliente(this.clienteId, pageIndex, this.dimensionePagina)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (res) => {
          this.page = res;
          this.numeroPagina = res.numeroPagina;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  prevPage() {
    if (!this.page) return;
    if (this.page.numeroPagina <= 0) return;
    this.loadPage(this.page.numeroPagina - 1);
  }

  nextPage() {
    if (!this.page) return;
    if (this.page.ultima) return;
    this.loadPage(this.page.numeroPagina + 1);
  }

  // ===== FORM =====
  /**
   * resetta il form.
   * openForm=true => mostra il form (Nuova plicometria)
   */
  startCreate(openForm = true) {
    this.editingId = null;
    this.showForm = openForm;

    this.form.reset({
      metodo: null,
      dataMisurazione: this.todayIso(),
      tricipite: null,
      bicipite: null,
      sottoscapolare: null,
      sovrailiaca: null,
      addominale: null,
      coscia: null,
      pettorale: null,
      ascellare: null,
      polpaccio: null,
      note: null,
    });

    this.cdr.markForCheck();
  }

  startEdit(p: PlicometriaDto) {
    this.editingId = p.id;
    this.showForm = true;

    this.form.reset({
      metodo: p.metodo as MetodoValue,
      dataMisurazione: (p.dataMisurazione ?? this.todayIso()) as any,

      tricipite: p.tricipite ?? null,
      bicipite: p.bicipite ?? null,
      sottoscapolare: p.sottoscapolare ?? null,
      sovrailiaca: p.sovrailiaca ?? null,
      addominale: p.addominale ?? null,
      coscia: p.coscia ?? null,
      pettorale: p.pettorale ?? null,
      ascellare: p.ascellare ?? null,
      polpaccio: p.polpaccio ?? null,

      note: p.note ?? null,
    });

    this.cdr.markForCheck();
  }

  cancelEdit() {
    // chiude il form e resetta lo stato
    this.showForm = false;
    this.startCreate(false);
  }

  save() {
    if (!this.clienteId) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;

    const payload: PlicometriaFormDto = {
      id: this.editingId ?? undefined,
      cliente: { id: this.clienteId } as any,
      metodo: v.metodo as any,
      dataMisurazione: v.dataMisurazione as any,

      tricipite: v.tricipite ?? undefined,
      bicipite: v.bicipite ?? undefined,
      sottoscapolare: v.sottoscapolare ?? undefined,
      sovrailiaca: v.sovrailiaca ?? undefined,
      addominale: v.addominale ?? undefined,
      coscia: v.coscia ?? undefined,
      pettorale: v.pettorale ?? undefined,
      ascellare: v.ascellare ?? undefined,
      polpaccio: v.polpaccio ?? undefined,

      note: v.note ?? undefined,
    };

    this.saving = true;
    this.cdr.markForCheck();

    const req$ = this.isEditing() ? this.api.update(payload) : this.api.create(payload);

    req$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.saving = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: () => {
          // dopo create: meglio tornare a pagina 0 (di solito l’ordine è per data desc)
          const pageToReload = this.isEditing() ? (this.page?.numeroPagina ?? 0) : 0;

          this.loadPage(pageToReload);

          // chiudi form + reset
          this.showForm = false;
          this.startCreate(false);
        },
        error: (err) => {
          console.error(err);
        },
      });
  }

  delete(p: PlicometriaDto) {
    if (!p?.id) return;

    const ok = confirm('Vuoi eliminare questa plicometria?');
    if (!ok) return;

    this.api
      .delete(p.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.loadPage(this.page?.numeroPagina ?? 0),
        error: (err) => console.error(err),
      });
  }

  // ===== VISIBILITÀ CAMPI =====
  show(field: string): boolean {
    const metodo = this.form.controls.metodo.value as MetodoValue | null;
    if (!metodo) return false;

    // manuali: per ora non chiediamo pliche (se vuoi, puoi cambiarlo)
    if (metodo === 'PARILLO' || metodo === 'MISURAZIONE_LIBERA') return false;

    if (metodo === 'DURNIN_WOMERSLEY') {
      return ['tricipite', 'bicipite', 'sottoscapolare', 'sovrailiaca'].includes(field);
    }

    if (metodo === 'JACKSON_POLLOCK_3') {
      // unione campi uomo/donna (non sappiamo sesso in FE)
      return ['pettorale', 'addominale', 'coscia', 'tricipite', 'sovrailiaca'].includes(field);
    }

    if (metodo === 'JACKSON_POLLOCK_7') {
      return [
        'pettorale',
        'ascellare',
        'tricipite',
        'sottoscapolare',
        'addominale',
        'sovrailiaca',
        'coscia',
      ].includes(field);
    }

    return false;
  }

  private todayIso(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
