import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from "@angular/forms";
import { lastValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../services/auth-service';
import { PasswordModule } from 'primeng/password';
import { IftaLabelModule } from 'primeng/iftalabel';
import { InputMaskModule } from 'primeng/inputmask';
import { DatePickerModule } from 'primeng/datepicker';
import { DividerModule } from 'primeng/divider';

@Component({
  selector: 'app-register-screen',
  imports: [FormsModule, ButtonModule, PasswordModule, InputTextModule, IftaLabelModule, InputMaskModule, DatePickerModule, DividerModule],
  templateUrl: './register-screen.html',
  styleUrl: './register-screen.css',
})
export class RegisterScreen {

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  nome!: string;
  cognome!: string;
  codiceFiscale!: string;
  email!: string;
  dataNascita?: string;
  telefono?: string;
  indirizzo?: string;
  password!: string;
  confermaPassword!: string;
  loading: any;
  submitted: boolean = false;
  maxDate = new Date()

  isPasswordValida(): boolean {
    // Requisito: Minimo 8 caratteri, una maiuscola e un numero
    const regex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!this.password) return false;

    const matchesRequirements = regex.test(this.password);
    const passwordsMatch = this.password === this.confermaPassword;

    return matchesRequirements && passwordsMatch;
  }
  private formatDate(date: any): string | null {
    if (!date) return null;

    // Se è già una stringa e ha il formato corretto, la restituiamo
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }

    const d = new Date(date);

    // Usiamo i metodi "Full" per evitare problemi di fuso orario (timezone)
    // che potrebbero sottrarre un giorno se convertissimo in UTC
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  constructor(public router: Router, private authService: AuthService) { }

  async register() {
    this.submitted = true;

    // Validazione client-side minima
    if (!this.email || !this.password || !this.codiceFiscale) {
      return;
    }

    // Costruiamo il payload esattamente come si aspetta la tua RegisterRequest.java
    const req = {
      nome: this.nome,
      cognome: this.cognome,
      email: this.email,
      codiceFiscale: this.codiceFiscale.toUpperCase(), // Il DB preferisce il maiuscolo
      password: this.password,
      telefono: this.telefono,
      // Se la tua RegisterRequest ha anche questi, aggiungili:
      dataNascita: this.formatDate(this.dataNascita),
      indirizzo: this.indirizzo
    };

    try {
      this.loading = true;

      // Eseguiamo la chiamata
      const result = await lastValueFrom(this.authService.register(req));

      if (result) {
        // Se il backend restituisce l'utente salvato con il token (o se devi fare il login dopo)
        // Nota: Se il tuo metodo Java restituisce solo l'Utente e non il token, 
        // dovresti aggiungere la generazione del token nel controller Java.

        if (result.token) {
          localStorage.setItem("token", result.token);
          localStorage.setItem("email", this.email);
          this.authService.token = result.token;
          this.router.navigate(['/home']);
        } else {
          // Se non c'è il token, forse devi reindirizzare al login
          this.router.navigate(['/login']);
        }
      }
    } catch (error: any) {
      // Gestione degli errori lanciati dal backend (RuntimeException)
      console.error("Errore Backend:", error);

      if (error.status === 500 || error.status === 400) {
        // Qui l'ideale sarebbe usare un Toast di PrimeNG
        alert("Errore: " + (error.error?.message || "Email o Codice Fiscale già esistenti"));
      }
    } finally {
      this.loading = false;
    }
  }
}//NEL BACKEND è DA GESTIRE IL RUOLO DELL'UTENTE ALLA CREAZIONE