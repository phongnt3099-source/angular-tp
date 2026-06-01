import { NgModule } from '@angular/core';
import { AdminSharedModule } from '@app/admin/shared/admin-shared.module';
import { AppSharedModule } from '@app/shared/app-shared.module';
import { SharedDropdownComponent } from '@app/components/shared-dropdown/shared-dropdown.component';
import { AppointmentServiceProxy, CustomerServiceProxy, EmployeeServiceProxy } from '@shared/service-proxies/service-proxies';
import { CommonModule } from '@node_modules/@angular/common';
import { AppointmentComponentsComponent } from './appointment-list.component';
import { AppointmentComponentsRoutingModule } from './appointment-components-routing.module';
import { CreateAppointmentModalComponent } from './create-appointment-modal.component';
import { SimpleDropdownComponent } from '@app/components/shared-dropdown/simple-dropdown.component';
import { FullCalendarModule } from '@fullcalendar/angular';
import { HeaderComponent } from '@shared/components/header/header.component';

@NgModule({
    declarations: [
        AppointmentComponentsComponent,
        CreateAppointmentModalComponent
    ],
    imports: [AppSharedModule, AdminSharedModule, AppointmentComponentsRoutingModule,SharedDropdownComponent,SimpleDropdownComponent, CommonModule,FullCalendarModule,HeaderComponent,],
    providers: [
        AppointmentServiceProxy,
        CustomerServiceProxy,
        EmployeeServiceProxy
    ],
    exports: [
        CreateAppointmentModalComponent // PHẢI EXPORT để module khác dùng được
    ]
})
export class AppointmentComponentsModule {}
