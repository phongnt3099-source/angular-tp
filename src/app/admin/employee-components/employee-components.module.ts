import { NgModule } from '@angular/core';
import { AdminSharedModule } from '@app/admin/shared/admin-shared.module';
import { AppSharedModule } from '@app/shared/app-shared.module';
import { SharedDropdownComponent } from '@app/components/shared-dropdown/shared-dropdown.component';
import { CommonModule } from '@node_modules/@angular/common';
import { HeaderComponent } from '@shared/components/header/header.component';
import { EmployeeServiceProxy, } from '@shared/service-proxies/service-proxies';
import { EmployeeComponentsRoutingModule } from './employee-components-routing.module';
import { EmployeeListComponent } from './employee-list.component';
import { InputSwitchModule } from 'primeng/inputswitch';
import { CalendarModule } from 'primeng/calendar';
import { DatePickerComponent } from '@app/components/date-picker/date-picker.component';

@NgModule({
    declarations: [
        EmployeeListComponent,
    ],
    imports: [AppSharedModule, AdminSharedModule,SharedDropdownComponent,EmployeeComponentsRoutingModule,CommonModule,HeaderComponent,InputSwitchModule,DatePickerComponent],
    providers: [
        EmployeeServiceProxy
    ]
})
export class EmployeeComponentsModule {}
