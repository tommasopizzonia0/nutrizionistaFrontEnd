import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import {
  faGear,
  faShieldHalved,
  faKey,
  faXmark,
  faEnvelope,
  faFloppyDisk,
  faCircleCheck,
  faTriangleExclamation,
  faCircleInfo,
  faSliders,
  faHourglassHalf,
  faArrowLeft,
  faLock
} from '@fortawesome/free-solid-svg-icons';

import { UserService } from '../../services/user.service';
import { ThemeService } from '../../services/theme.service';
import { SidebarService } from '../../services/navbar.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FontAwesomeModule],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css'],
})
export class Settings implements OnInit {

  loading = false;
  message = '';
  errorMessage = '';

  userData: any = null;

  isChangingPassword = false;
  passwordForm!: FormGroup;

  // ===== Font Awesome icons =====
  icGear: IconDefinition = faGear;
  icShield: IconDefinition = faShieldHalved;
  icKey: IconDefinition = faKey;
  icClose: IconDefinition = faXmark;
  icEnvelope: IconDefinition = faEnvelope;
  icSave: IconDefinition = faFloppyDisk;
  icOk: IconDefinition = faCircleCheck;
  icWarn: IconDefinition = faTriangleExclamation;
  icInfo: IconDefinition = faCircleInfo;
  icSliders: IconDefinition = faSliders;
  icHourglass: IconDefinition = faHourglassHalf;
  icBack: IconDefinition = faArrowLeft;
  icLock: IconDefinition = faLock;

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private userService: UserService,
    public themeService: ThemeService,
    public sidebarService: SidebarService
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.loadMe();
  }

  private initForms(): void {
    this.passwordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confermaPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password')?.value;
    const conferma = form.get('confermaPassword')?.value;
    return password === conferma ? null : { passwordMismatch: true };
  }

  private loadMe(): void {
    this.loading = true;
    this.userService.getProfile().subscribe({
      next: data => {
        this.userData = data;
        this.passwordForm.patchValue({ email: data.email });
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Errore nel caricamento delle impostazioni';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  togglePasswordChange(): void {
    this.isChangingPassword = !this.isChangingPassword;
    this.message = '';
    this.errorMessage = '';

    if (!this.isChangingPassword && this.userData) {
      this.passwordForm.reset({ email: this.userData.email });
    }
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) return;

    this.loading = true;
    this.message = '';
    this.errorMessage = '';

    this.userService.updatePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.message = 'Password aggiornata!';
        this.isChangingPassword = false;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Errore cambio password';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
