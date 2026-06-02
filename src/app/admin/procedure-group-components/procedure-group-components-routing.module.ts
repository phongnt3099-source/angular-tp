import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProcedureGroupListComponent } from './procedure-group-list.component';

const routes: Routes = [
    {
        path: '',
        component: ProcedureGroupListComponent,
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ProcedureGroupComponentsRoutingModule {}
