import { Component, Injector, OnInit,ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CreateCustomerModalComponent } from './create-customer-modal.component';
import { CM_CUSTOMER_ENTITY,CustomerServiceProxy } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent } from 'primeng/api';
import { Paginator } from 'primeng/paginator';
import { finalize } from 'rxjs/operators';

@Component({
    templateUrl: './customer-list.component.html',
    animations: [appModuleAnimation()],
})
export class CustomerComponentsComponent extends AppComponentBase implements OnInit {

    @ViewChild('createCustomerModal', { static: true }) createCustomerModal!: CreateCustomerModalComponent;
    @ViewChild('paginator', { static: true }) paginator!: Paginator;
    alertVisible = true;
    filterInput: CM_CUSTOMER_ENTITY = new CM_CUSTOMER_ENTITY();
    constructor(
      injector: Injector,
      private _customerService: CustomerServiceProxy
    ) {
        super(injector);
    }
    ngOnInit(): void {
      console.log('Thêm');
    }
    createCustomer(): void{
      this.createCustomerModal.show();
    }
    hideAlert(): void{
        this.alertVisible = false;
    }
    getCustomer(event?: LazyLoadEvent): void{
      if (event && this.primengTableHelper.shouldResetPaging(event)) {
          this.paginator.changePage(0);

          if (this.primengTableHelper.records && this.primengTableHelper.records.length > 0) {
              return;
          }
      }

      this.primengTableHelper.showLoadingIndicator();

      this._customerService
          .cM_CUSTOMER_Search(
              this.filterInput)
          .pipe(finalize(() => this.primengTableHelper.hideLoadingIndicator()))
          .subscribe((result) => {
              this.primengTableHelper.totalRecordsCount = result.totalCount;
              this.primengTableHelper.records = result.items??[];
              this.primengTableHelper.hideLoadingIndicator();
          });
    }
}
