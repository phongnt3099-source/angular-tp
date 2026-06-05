import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProcedureListComponent } from './procedure-list.component';

const routes: Routes = [
    {
        path: '',
        component: ProcedureListComponent,
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ProcedureComponentsRoutingModule {}
