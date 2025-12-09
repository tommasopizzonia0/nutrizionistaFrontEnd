import { HttpClient } from '@angular/common/http';
import { Injectable, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { Observable } from 'rxjs';
 
@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {
  token!: string;
  varNull: any = null;
 
  private apiUrl = 'http://localhost:8080/api/auth';
 
  constructor(
    private http: HttpClient,
    public router: Router,
  ) {}
 
  ngOnDestroy(): void {
    this.token = this.varNull;
 
  }
 
  public login(send: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + "/login", send)
  }
 
  // public invioEmailRecuperoPassword(username: any): Observable<any> {
  //   return this.http.post(config.baseUrl + 'api/recupero-password?username=' + username, null, { responseType: 'text' });
  // }
 
  // public resetPassword(resetPasswordDTO: ResetPasswordDTO): Observable<any> {
  //    return this.http.put(config.baseUrl + 'api/reset-password', resetPasswordDTO, { responseType: 'text' });
  // }
 
  // public controlloRecuperoPassword(username: string, token: string): Observable<any> {
  //   return this.http.get(config.baseUrl + 'api/controllo-recupero-password?username=' + username + '&token=' + token);
  // }
 
  public checkAuthLocalStorage() {
    let token = localStorage.getItem('token');
    if (token != undefined) {
       if (!this.isTokenExpired(token)) {
         this.token = token;
         let jsonToken = this.getDecodedAccessToken(token);
         console.log(jsonToken)
        // this.ruolo = jsonToken.role;
        // this.email = jsonToken.email;
        // this.nome = jsonToken.nome;
        // this.cognome = jsonToken.cognome;
       } else {
         localStorage.clear();
         this.router.navigate(['/login']);
         return;
       }
 
    } else {
        localStorage.clear();
        this.router.navigate(['/login']);
      }
    // }
    // let scadenza = localStorage.getItem('scadenza');
    // if (scadenza != undefined && scadenza != null)
    //   this.scadenza = new Date(scadenza);
    // let messageScadenza = localStorage.getItem('messageScadenza');
    // if (messageScadenza != undefined && messageScadenza != null)
    //   this.messageScadenza = messageScadenza;
    // let lastAccess = localStorage.getItem('ultimoAccesso');
    // if (lastAccess != undefined && lastAccess != null)
    //   this.lastAccess = new Date(lastAccess);
  }
 
  // autorizationAccessPath() {
  //   let num = 0;
  //   if (
  //     (this.router.url.search('auth') != -1 ||
  //       this.router.url == '/registration') &&
  //     this.menu.length != 0
  //   ) {
  //     this.router.navigate(['/dashboard']);
  //     num = 1;
  //   } else {
  //     if (this.menu.length != 0) {
  //       this.menu.forEach((element) => {
  //         if (element.routerLink) {
  //           if (element.routerLink.search(this.router.url) == 0) {
  //             num = 1;
  //           }
  //         }
  //       });
  //     } else {
  //       num = 1;
  //     }
  //   }
  //   return num;
  // }
 
  getDecodedAccessToken(token: string): any {
    try {
      return jwtDecode(token);
    } catch (Error) {
      return null;
    }
  }
 
  public isAuthenticated(): boolean {
    // Get token from localstorage
    let token = this.getToken();
 
    // Check if token is null or empty
    if (token) {
      // Check whether the token is expired and return
      // true or false
      return !this.isTokenExpired(token);
    } else {
      return false;
    }
  }
 
  getToken() {
    return this.token;
  }
 
  isTokenExpired(token: string): boolean {
    let jsonToken = this.getDecodedAccessToken(token);
    let exp = new Date(jsonToken.exp * 1000);
    if (exp > new Date()) {
      return false;
    } else {
      return true;
    }
  }
 
  isNullOrVoid(value: any) {
    return value == null || value === '' || value == undefined;
  }
}
