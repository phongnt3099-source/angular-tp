import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppointmentComponentsComponent } from './appointment-list.component';

const routes: Routes = [
    {
        path: '',
        component: AppointmentComponentsComponent,
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AppointmentComponentsRoutingModule {}
