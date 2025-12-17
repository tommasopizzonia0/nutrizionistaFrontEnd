import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { NavbarComponent } from '../navbar/navbar';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './user-profile.html',
  styleUrls: ['./user-profile.css']
})
export class UserProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  userData: any = null;
  isEditMode = false;
  isChangingPassword = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  loading = false;
  message = '';
  errorMessage = '';
  isDarkMode = false;
  isSidebarCollapsed = true;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private userService: UserService
  ) {
  }

  ngOnInit(): void {
    this.initForms();
    setTimeout(() => {
      this.loadUserProfile();
    }, 0);
  }

  onSidebarToggle(isCollapsed: boolean): void {
    setTimeout(() => {
      this.isSidebarCollapsed = isCollapsed;
      this.cdr.detectChanges();
    }, 0);
  }

  onThemeChange(isDark: boolean): void {
    setTimeout(() => {
      this.isDarkMode = isDark;
      this.cdr.detectChanges();
    }, 0);
  }

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

    this.passwordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confermaPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const conferma = form.get('confermaPassword')?.value;
    return password === conferma ? null : { passwordMismatch: true };
  }

  loadUserProfile(): void {
    this.loading = true;
    
    this.userService.getProfile().subscribe({
      next: (data) => {
        this.userData = data;
        this.profileForm.patchValue(data);
        this.passwordForm.patchValue({ email: data.email });
        
        if (data.filePathLogo) {
          this.previewUrl = `http://localhost:8080/${data.filePathLogo}`;
        }
        
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Errore nel caricamento:', err);
        this.errorMessage = 'Errore nel caricamento del profilo';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode) {
      this.profileForm.patchValue(this.userData);
      this.message = '';
      this.errorMessage = '';
    }
  }

  togglePasswordChange(): void {
    this.isChangingPassword = !this.isChangingPassword;
    if (!this.isChangingPassword) {
      this.passwordForm.reset({ email: this.userData.email });
      this.message = '';
      this.errorMessage = '';
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        this.errorMessage = 'Seleziona un file immagine valido';
        return;
      }
      
      const allowedExtensions = ['jpg', 'jpeg', 'png'];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !allowedExtensions.includes(extension)) {
        this.errorMessage = 'Estensione non valida. Usa jpg, jpeg o png';
        return;
      }

      this.selectedFile = file;
      
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
      this.errorMessage = '';
    }
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.errorMessage = 'Compila correttamente tutti i campi obbligatori';
      return;
    }

    this.loading = true;
    this.userService.updateMyProfile(this.profileForm.value).subscribe({
      next: (data) => {
        this.userData = data;
        this.message = 'Profilo aggiornato con successo!';
        this.errorMessage = '';
        this.isEditMode = false;
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.message = '', 3000);
      },
      error: (err) => {
        this.errorMessage = 'Errore nell\'aggiornamento del profilo';
        this.loading = false;
        console.error(err);
      }
    });
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) {
      this.errorMessage = 'Compila correttamente tutti i campi';
      return;
    }

    this.loading = true;
    this.userService.updatePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.message = 'Password modificata con successo!';
        this.errorMessage = '';
        this.isChangingPassword = false;
        this.passwordForm.reset({ email: this.userData.email });
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.message = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Errore nella modifica della password';
        this.loading = false;
        console.error(err);
      }
    });
  }

  uploadLogo(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Seleziona un\'immagine prima di caricare';
      return;
    }

    this.loading = true;
    const formData = new FormData();
    formData.append('image', this.selectedFile);
    formData.append('utenteId', this.userData.id.toString());


    this.userService.updateLogo(formData).subscribe({
      next: (data) => {
        this.userData = data;
        this.message = 'Logo caricato con successo!';
        this.errorMessage = '';
        this.selectedFile = null;
        if (data.filePathLogo) {
          this.previewUrl = `http://localhost:8080/${data.filePathLogo}`;
        }
        this.loading = false;
        this.cdr.detectChanges();
        setTimeout(() => this.message = '', 3000);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Errore nel caricamento del logo';
        this.loading = false;
        console.error(err);
      }
    });
  }

  deleteProfile(): void {
    if (confirm('Sei sicuro di voler eliminare il tuo account? Questa azione è irreversibile!')) {
      this.loading = true;
      this.userService.deleteMyProfile().subscribe({
        next: () => {
          alert('Account eliminato con successo');
          window.location.href = '/login';
        },
        error: (err) => {
          this.errorMessage = 'Errore nell\'eliminazione dell\'account';
          this.loading = false;
          console.error(err);
        }
      });
    }
  }
}