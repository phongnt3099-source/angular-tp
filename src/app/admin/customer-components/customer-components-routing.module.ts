import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomerComponentsComponent } from './customer-list.component-list';

const routes: Routes = [
    {
        path: '',
        component: CustomerComponentsComponent,
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class CustomerComponentsRoutingModule {}
