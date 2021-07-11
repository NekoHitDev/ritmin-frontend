import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { WalletConnectService } from 'src/app/services/walletconnect.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss']
})
export class MenuComponent implements OnInit {

  items: MenuItem[];
  loadingIcon = 'pi pi-spin pi-spinner';
  connectIcon = 'pi pi-play';

  constructor(public wallet: WalletConnectService) {
    this.wallet.address$.subscribe(a => {
      if (a != null) {
        this.items = [
          {icon: 'pi pi-search', label: 'Browse', routerLink: '/'},
          {icon: 'pi pi-plus', label: 'Create', routerLink: '/new/wca'},
          {icon: 'pi pi-list', label: 'Inventory', routerLink: '/inventory'},
          {icon: 'pi pi-question', label: 'How it works', routerLink: '/about'}
        ];
      } else {
        this.items = [
          {icon: 'pi pi-search', label: 'Browse', routerLink: '/'},
          {icon: 'pi pi-question', label: 'How it works', routerLink: '/about'}

        ];
      }
    })
  }

  ngOnInit(): void {}

  onConnectBtnClick() {
    this.wallet.connect();
  }

}
