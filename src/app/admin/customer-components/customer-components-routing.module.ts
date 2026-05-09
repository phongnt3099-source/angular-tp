import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerComponentsComponent } from './customer-list.component';
import { CustomerDetailComponent } from './customer-detail.component';

const routes: Routes = [
    {
        path: '',
        component: CustomerComponentsComponent,
        pathMatch: 'full',
    },
    {
        path: ':customerId',
        component: CustomerDetailComponent,
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class CustomerComponentsRoutingModule {}
