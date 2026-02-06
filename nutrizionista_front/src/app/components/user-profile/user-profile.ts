import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ThemeService } from '../../services/theme.service';
import { SidebarService } from '../../services/navbar.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.css']
})
export class UserProfileComponent implements OnInit {

  profileForm!: FormGroup;

  userData: any = null;
  isEditMode = false;
  isChangingPassword = false;

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  loading = false;
  message = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    public themeService: ThemeService,
    public sidebarService: SidebarService
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadUserProfile();
  }

  /* =======================
     FORMS
  ======================= */
  initForms(): void {
    this.profileForm = this.fb.group({
      id: [null],
      nome: ['', Validators.required],
      cognome: ['', Validators.required],
      codiceFiscale: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      dataNascita: [''],
      telefono: [''],
      indirizzo: ['']
    });

  }



  /* =======================
     LOAD PROFILE
  ======================= */
  loadUserProfile(): void {
    this.loading = true;

    this.userService.getProfile().subscribe({
      next: data => {
        this.userData = data;
        this.profileForm.patchValue(data);

        if (data.filePathLogo) {
          this.previewUrl = `http://localhost:8080/${data.filePathLogo}`;
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Errore nel caricamento del profilo';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /* =======================
     UI TOGGLES
  ======================= */
  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.profileForm.patchValue(this.userData);
      this.message = '';
      this.errorMessage = '';
    }
  }



  /* =======================
     FILE UPLOAD
  ======================= */
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.errorMessage = 'Seleziona un file immagine valido';
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = e => this.previewUrl = (e.target as any).result;
    reader.readAsDataURL(file);
  }

  uploadLogo(): void {
    if (!this.selectedFile || !this.userData) return;

    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('utenteId', this.userData.id.toString());

    this.loading = true;

    this.userService.updateLogo(formData).subscribe({
      next: data => {
        this.userData = data;
        this.previewUrl = data.filePathLogo
          ? `http://localhost:8080/${data.filePathLogo}`
          : null;

        this.message = 'Logo caricato con successo!';
        this.selectedFile = null;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Errore nel caricamento del logo';
        this.loading = false;
      }
    });
  }

  /* =======================
     UPDATE PROFILE
  ======================= */
  updateProfile(): void {
    if (this.profileForm.invalid) return;

    this.loading = true;
    this.userService.updateMyProfile(this.profileForm.value).subscribe({
      next: data => {
        this.userData = data;
        this.message = 'Profilo aggiornato con successo!';
        this.isEditMode = false;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Errore aggiornamento profilo';
        this.loading = false;
      }
    });
  }

  deleteProfile(): void {
    if (!confirm('Sei sicuro?')) return;

    this.userService.deleteMyProfile().subscribe(() => {
      window.location.href = '/login';
    });
  }
}
