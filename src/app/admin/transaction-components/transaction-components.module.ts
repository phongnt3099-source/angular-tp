import { NgModule } from '@angular/core';
import { AdminSharedModule } from '@app/admin/shared/admin-shared.module';
import { AppSharedModule } from '@app/shared/app-shared.module';
import { SharedDropdownComponent } from '@app/components/shared-dropdown/shared-dropdown.component';
import { CustomerServiceProxy, EmployeeServiceProxy, ExaminationServiceProxy, TransactionServiceProxy } from '@shared/service-proxies/service-proxies';
import { CommonModule } from '@node_modules/@angular/common';
import { SimpleDropdownComponent } from '@app/components/shared-dropdown/simple-dropdown.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { HeaderComponent } from '@shared/components/header/header.component';
import { CreateTransactionModalComponent } from './create-transaction-modal.component';
import { TransactionListComponent } from './transaction-list.component';
import { TransactionComponentsRoutingModule } from './transaction-components-routing.module';
import { DatePickerComponent } from '@app/components/date-picker/date-picker.component';

@NgModule({
    declarations: [
        CreateTransactionModalComponent,
        TransactionListComponent,
    ],
    imports: [AppSharedModule, AdminSharedModule,SharedDropdownComponent,SimpleDropdownComponent,SharedDropdownComponent, CommonModule,FullCalendarModule,HeaderComponent,TransactionComponentsRoutingModule,DatePickerComponent],
    providers: [
        CustomerServiceProxy,
        EmployeeServiceProxy,
        TransactionServiceProxy,
        ExaminationServiceProxy,
    ],
    exports: [
        CreateTransactionModalComponent
    ]
})
export class TransactionComponentsModule {}
