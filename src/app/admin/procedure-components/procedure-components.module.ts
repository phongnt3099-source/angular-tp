import { NgModule } from '@angular/core';
import { AdminSharedModule } from '@app/admin/shared/admin-shared.module';
import { AppSharedModule } from '@app/shared/app-shared.module';
import { SharedDropdownComponent } from '@app/components/shared-dropdown/shared-dropdown.component';
import { CommonModule } from '@node_modules/@angular/common';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ServiceServiceProxy, ServiceTypeServiceProxy } from '@shared/service-proxies/service-proxies';
import { ProcedureComponentsRoutingModule } from './procedure-components-routing.module';
import { ProcedureListComponent } from './procedure-list.component';
import { InputSwitchModule } from 'primeng/inputswitch';

@NgModule({
    declarations: [
        ProcedureListComponent
    ],
    imports: [AppSharedModule, AdminSharedModule,SharedDropdownComponent,ProcedureComponentsRoutingModule,CommonModule,HeaderComponent,InputSwitchModule],
    providers: [
        ServiceTypeServiceProxy,
        ServiceServiceProxy
    ]
})
export class ProcedureComponentsModule {}
