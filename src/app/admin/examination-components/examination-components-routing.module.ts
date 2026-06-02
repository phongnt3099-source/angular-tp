import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ExaminationEditComponent } from './examination-edit.component';
import { ExaminationListComponent } from './examination-list.component';

const routes: Routes = [
    {
        path: '',
        component: ExaminationListComponent,
        pathMatch: 'full',
    },
    {
        path: ':id',
        component: ExaminationEditComponent,
        pathMatch: 'full',
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class ExaminationComponentsRoutingModule {}
