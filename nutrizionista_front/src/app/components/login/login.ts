import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from "@angular/forms";
import { lastValueFrom } from 'rxjs';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { AuthService } from '../../services/auth-service';


@Component({
  selector: 'app-login',
  imports: [FormsModule, ButtonModule, CheckboxModule, InputTextModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  goToRegistration() {
    this.router.navigate(['/register']);
  }

  goToHome() {
    this.router.navigate(['/home']);
  }
  email!: string;
  password!: string;
  loading: any;
  submitted: boolean = false;
  gifUrl = 'assets/img/PetsBook.gif';
  staticUrl = 'assets/img/fermo.png'; // immagine finale o statica
  gifVisible = false;
  timeoutId: any;
  checked: any; //da usare per il ricordami



  startGif() {
    this.gifVisible = true;

    // reset per non far partire più timer in parallelo
    clearTimeout(this.timeoutId);

    // dopo 5 secondi "fermi" la GIF
    this.timeoutId = setTimeout(() => {
      this.gifVisible = false;
    }, 2500);
  }

  constructor(public router: Router, private authService: AuthService) { }

  ngOnInit(): void {
    // this.authService.checkAuthLocalStorage();
    // setTimeout(() => {
    //   const savedEmail = localStorage.getItem('savedEmail');
    //   if (savedEmail) {
    //     this.email = savedEmail;
    //     this.rememberMe = true;
    //   }
    // });

  }
  async login() {
    this.submitted = true;

    if (this.authService.isNullOrVoid(this.email) || this.authService.isNullOrVoid(this.password)) {
      return;
    }
    var send = {
      "email": this.email,
      "password": this.password
    }
    try {
      setTimeout(() => { }, 100);
      let result = await lastValueFrom(this.authService.login(send));
      if (result) {
        //localStorage.setItem("scadenza", result.scadenzaPassword);
        //localStorage.setItem("messageScadenza", result.message);
        //localStorage.setItem("ultimoAccesso", result.ultimoAccesso);
        localStorage.setItem("token", result.token);
        localStorage.setItem("email", this.email);
        this.authService.token = localStorage.getItem("token")!;
        //  setTimeout(()=>{
        //  },100);
        this.router.navigate(['/home']);

      }
    } catch (error) {

    }
  }

}





