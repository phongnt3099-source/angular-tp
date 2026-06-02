import { NgModule } from '@angular/core';
import { AdminSharedModule } from '@app/admin/shared/admin-shared.module';
import { AppSharedModule } from '@app/shared/app-shared.module';
import { SharedDropdownComponent } from '@app/components/shared-dropdown/shared-dropdown.component';
import { CommonModule } from '@node_modules/@angular/common';
import { HeaderComponent } from '@shared/components/header/header.component';
import { ProcedureGroupListComponent } from './procedure-group-list.component';
import { ProcedureGroupComponentsRoutingModule } from './procedure-group-components-routing.module';
import { ServiceTypeServiceProxy } from '@shared/service-proxies/service-proxies';

@NgModule({
    declarations: [
        ProcedureGroupListComponent
    ],
    imports: [AppSharedModule, AdminSharedModule,SharedDropdownComponent,ProcedureGroupComponentsRoutingModule,CommonModule,HeaderComponent],
    providers: [
        ServiceTypeServiceProxy
    ]
})
export class ProcedureGroupComponentsModule {}
