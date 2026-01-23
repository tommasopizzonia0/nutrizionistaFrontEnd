import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarService } from '../../services/navbar.service';
import { ThemeService } from '../../services/theme.service';
import { NavbarComponent } from '../../components/navbar/navbar';
import { UtenteDto } from '../../dto/utente.dto';
import { UserService } from '../../services/user.service';
import { Observable } from 'rxjs';
import { faSun, faCloudSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import { FaIconLibrary, FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FontAwesomeModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  loading = false;
  utente$!: Observable <UtenteDto>;
  errorMessage = '';
  saluto = '';
  iconaSaluto: any;

  constructor(
    public themeService: ThemeService,   // pubblico per poter usare | async in HTML
    public sidebarService: SidebarService,
    private serviceUtente: UserService,
    private library : FaIconLibrary
  ) {library.addIcons(faSun, faCloudSun, faMoon);}

  ngOnInit(): void {
    console.log('🏠 HOME COMPONENT INITIALIZED');
    this.utente$ = this.serviceUtente.getProfile();
    this.calcolaSaluto();
  
  }

  calcolaSaluto(): void{
    const ora = new Date().getHours();

    if (ora >= 5 && ora < 12){
      this.saluto = 'Buongiorno'
      this.iconaSaluto = faSun;
    }else if(ora >= 12 && ora < 18){
      this.saluto = 'Buon pomeriggio'
      this.iconaSaluto = faCloudSun;
    }else{
      this.saluto = 'Buona sera'
      this.iconaSaluto = faMoon;
    }


  }

}
