import { Component, Injector, OnInit,ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CreateCustomerModalComponent } from './create-customer-modal.component';
import { CM_CUSTOMER_ENTITY,CustomerServiceProxy } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent } from 'primeng/api';
import { Paginator } from 'primeng/paginator';
import { finalize } from 'rxjs/operators';
import { Router } from '@node_modules/@angular/router';

@Component({
    templateUrl: './customer-list.component.html',
    animations: [appModuleAnimation()],
    styleUrls: ['./customer-list.component.css']
})
export class CustomerComponentsComponent extends AppComponentBase implements OnInit {

    @ViewChild('createCustomerModal', { static: true }) createCustomerModal!: CreateCustomerModalComponent;
    @ViewChild('paginator', { static: true }) paginator!: Paginator;
    alertVisible = true;
    filterInput: CM_CUSTOMER_ENTITY = new CM_CUSTOMER_ENTITY();
    constructor(
      injector: Injector,
      private _customerService: CustomerServiceProxy,
      private _router: Router
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
    viewDetail(record: CM_CUSTOMER_ENTITY): void{
      this._router.navigate(['/app/admin/customer-detail', record.cuS_ID]);
    }
    getCustomer(event?: any): void{
      // 1. Reset về trang đầu nếu có filter mới
        if (this.primengTableHelper.shouldResetPaging(event)) {
            this.paginator.changePage(0);
            return;
        }

        this.primengTableHelper.showLoadingIndicator();

        // 2. Lấy vị trí bắt đầu (SkipCount) và số lượng bản ghi (MaxResultCount)
        const skipCount = event && event.first !== undefined
                        ? event.first
                        : this.primengTableHelper.getSkipCount(this.paginator, event);
        const maxResultCount = event && event.rows !== undefined
                            ? event.rows
                            : this.primengTableHelper.getMaxResultCount(this.paginator, event);
        this.filterInput.skipCount = skipCount;
        this.filterInput.maxResultCount = maxResultCount;
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
