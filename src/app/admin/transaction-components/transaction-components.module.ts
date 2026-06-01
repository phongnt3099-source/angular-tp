import { NgModule } from '@angular/core';
import { AdminSharedModule } from '@app/admin/shared/admin-shared.module';
import { AppSharedModule } from '@app/shared/app-shared.module';
import { SharedDropdownComponent } from '@app/components/shared-dropdown/shared-dropdown.component';
import { CustomerServiceProxy, EmployeeServiceProxy, TransactionServiceProxy } from '@shared/service-proxies/service-proxies';
import { CommonModule } from '@node_modules/@angular/common';
import { SimpleDropdownComponent } from '@app/components/shared-dropdown/simple-dropdown.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { HeaderComponent } from '@shared/components/header/header.component';
import { CreateTransactionModalComponent } from './create-transaction-modal.component';

@NgModule({
    declarations: [
        CreateTransactionModalComponent
    ],
    imports: [AppSharedModule, AdminSharedModule,SharedDropdownComponent,SimpleDropdownComponent,SharedDropdownComponent, CommonModule,FullCalendarModule,HeaderComponent,],
    providers: [
        CustomerServiceProxy,
        EmployeeServiceProxy,
        TransactionServiceProxy
    ],
    exports: [
        CreateTransactionModalComponent 
    ]
})
export class TransactionComponentsModule {}
