import { NgModule } from '@angular/core';
import { AdminSharedModule } from '@app/admin/shared/admin-shared.module';
import { AppSharedModule } from '@app/shared/app-shared.module';
import { SharedDropdownComponent } from '@app/components/shared-dropdown/shared-dropdown.component';
import { CustomerServiceProxy, EmployeeServiceProxy, ExaminationServiceProxy, ServiceServiceProxy, ServiceTypeServiceProxy, TransactionServiceProxy } from '@shared/service-proxies/service-proxies';
import { CommonModule } from '@node_modules/@angular/common';
import { AppointmentComponentsModule } from '../appointment-components/appointment-components.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ExaminationEditComponent } from './examination-edit.component';
import { ExaminationComponentsRoutingModule } from './examination-components-routing.module';
import { ExaminationListComponent } from './examination-list.component';
import { TransactionComponentsModule } from '../transaction-components/transaction-components.module';
import { DatePickerComponent } from '@app/components/date-picker/date-picker.component';
import { CalendarModule } from 'primeng/calendar';

@NgModule({
    declarations: [
        ExaminationEditComponent,
        ExaminationListComponent,

    ],
    imports: [
              AppSharedModule,
              AdminSharedModule,
              ExaminationComponentsRoutingModule,
              SharedDropdownComponent,
              TransactionComponentsModule,
              CommonModule,
              AppointmentComponentsModule,
              HeaderComponent,
              DatePickerComponent,
              CalendarModule,
            ],
    providers: [
        CustomerServiceProxy,
        ExaminationServiceProxy,
        ServiceServiceProxy,
        ServiceTypeServiceProxy,
        EmployeeServiceProxy,
        TransactionServiceProxy
    ]
})
export class ExaminationComponentsModule {}
