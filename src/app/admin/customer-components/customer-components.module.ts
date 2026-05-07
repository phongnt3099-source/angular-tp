import { NgModule } from '@angular/core';
import { AdminSharedModule } from '@app/admin/shared/admin-shared.module';
import { AppSharedModule } from '@app/shared/app-shared.module';
import { CustomerComponentsComponent } from './customer-components.component';
import { CustomerComponentsRoutingModule } from './customer-components-routing.module';
import { CreateCustomerModalComponent } from './create-customer-modal.component';
import { SharedDropdownComponent } from '@app/components/shared-dropdown/shared-dropdown.component';
import { CustomerServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    declarations: [
        CustomerComponentsComponent,
        CreateCustomerModalComponent,
    ],
    imports: [AppSharedModule, AdminSharedModule, CustomerComponentsRoutingModule,SharedDropdownComponent],
    providers: [
        CustomerServiceProxy
    ]
})
export class CustomerComponentsModule {}
