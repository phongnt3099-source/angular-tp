import { NgModule } from '@angular/core';
import { AdminSharedModule } from '@app/admin/shared/admin-shared.module';
import { AppSharedModule } from '@app/shared/app-shared.module';
import { CustomerComponentsRoutingModule } from './customer-components-routing.module';
import { CreateCustomerModalComponent } from './create-customer-modal.component';
import { SharedDropdownComponent } from '@app/components/shared-dropdown/shared-dropdown.component';
import { CustomerServiceProxy,ExaminationServiceProxy } from '@shared/service-proxies/service-proxies';
import { CustomerComponentsComponent } from './customer-list.component';
import { CommonModule } from '@node_modules/@angular/common';
import { CustomerDetailComponent } from './customer-detail.component';
import { AppointmentComponentsModule } from '../appointment-components/appointment-components.module';
import { HeaderComponent } from '@shared/components/header/header.component';
import { DatePickerComponent } from '@app/components/date-picker/date-picker.component';

@NgModule({
    declarations: [
        CustomerComponentsComponent,
        CreateCustomerModalComponent,
        CustomerDetailComponent,
    ],
    imports: [AppSharedModule, AdminSharedModule, CustomerComponentsRoutingModule,SharedDropdownComponent,CommonModule,AppointmentComponentsModule,HeaderComponent,DatePickerComponent],
    providers: [
        CustomerServiceProxy,
        ExaminationServiceProxy 
    ]
})
export class CustomerComponentsModule {}
