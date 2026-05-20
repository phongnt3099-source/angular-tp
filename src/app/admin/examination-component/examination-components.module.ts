import { NgModule } from '@angular/core';
import { AdminSharedModule } from '@app/admin/shared/admin-shared.module';
import { AppSharedModule } from '@app/shared/app-shared.module';
import { SharedDropdownComponent } from '@app/components/shared-dropdown/shared-dropdown.component';
import { CustomerServiceProxy, EmployeeServiceProxy, ExaminationServiceProxy, ServiceServiceProxy, ServiceTypeServiceProxy } from '@shared/service-proxies/service-proxies';
import { CommonModule } from '@node_modules/@angular/common';
import { AppointmentComponentsModule } from '../appointment-components/appointment-components.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ExaminationEditComponent } from './examination-edit.component';
import { ExaminationComponentsRoutingModule } from './examination-components-routing.module';

@NgModule({
    declarations: [
        ExaminationEditComponent
    ],
    imports: [AppSharedModule, AdminSharedModule, ExaminationComponentsRoutingModule,SharedDropdownComponent,CommonModule,AppointmentComponentsModule,HeaderComponent],
    providers: [
        CustomerServiceProxy,
        ExaminationServiceProxy,
        ServiceServiceProxy,
        ServiceTypeServiceProxy,
        EmployeeServiceProxy
    ]
})
export class CustomerComponentsModule {}
