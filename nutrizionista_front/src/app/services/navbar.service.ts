import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SidebarService {
  private _collapsed = new BehaviorSubject<boolean>(true);
  value$ = this._collapsed.asObservable();

  get value() {
    return this._collapsed.value;
  }

  toggle() {
    this._collapsed.next(!this._collapsed.value);
    localStorage.setItem('sidebarCollapsed', this._collapsed.value ? 'true' : 'false');
  }

  setCollapsed(collapsed: boolean) {
    this._collapsed.next(collapsed);
    localStorage.setItem('sidebarCollapsed', collapsed ? 'true' : 'false');
  }
}
