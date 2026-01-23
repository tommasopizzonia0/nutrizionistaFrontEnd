import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../../navbar/navbar';
import { SidebarService } from '../../../../services/navbar.service';
import { ThemeService } from '../../../../services/theme.service';
import { AsyncPipe } from '@angular/common';


@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, AsyncPipe],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
export class MainLayoutComponent {
  isDarkMode = false;
  cdr: any;

  constructor(
  public sidebarService: SidebarService,
  public themeService: ThemeService
) {}


    onThemeChange(isDark: boolean): void {
    setTimeout(() => {
      this.isDarkMode = isDark;
      this.cdr.detectChanges();
    }, 0);
  }

}
