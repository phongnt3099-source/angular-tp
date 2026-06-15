import { Component, Injector, OnInit,ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CreateCustomerModalComponent } from './create-customer-modal.component';
import { CM_CUSTOMER_ENTITY,CustomerServiceProxy, ExaminationServiceProxy, MED_EXAMINATION_ENTITY } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent } from 'primeng/api';
import { Paginator } from 'primeng/paginator';
import { finalize } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@node_modules/@angular/router';
import { CreateAppointmentModalComponent } from '../appointment-components/create-appointment-modal.component';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

@Component({
    templateUrl: './customer-detail.component.html',
    styleUrls: ['./customer-detail.component.css'],
    animations: [appModuleAnimation()],
})
export class CustomerDetailComponent extends AppComponentBase implements OnInit {

    @ViewChild('createCustomerModal', { static: true }) createCustomerModal!: CreateCustomerModalComponent;
    @ViewChild('createAppointmentModal', { static: true }) createAppointmentModal!: CreateAppointmentModalComponent;
    @ViewChild('paginator', { static: true }) paginator!: Paginator;
    alertVisible = true;
    treatmentList: MED_EXAMINATION_ENTITY[]=[];
    inputModel: CM_CUSTOMER_ENTITY = new CM_CUSTOMER_ENTITY();
    constructor(
      injector: Injector,
      private _customerService: CustomerServiceProxy,
      private activeRoute: ActivatedRoute,
      private _router: Router,
      private _modalService: BsModalService,
      private _examinationService: ExaminationServiceProxy
    ) {
        super(injector);
        this.inputModel.cuS_ID = this.getRouteParam('customerId');
        console.log(this);
    }
    ngOnInit(): void {
        this.getCustomer();
        this.getExaminations();
    }
    deleteCustomer(): void {
    this.message.confirm(
                'Bạn có chắc chắn muốn xóa lịch hẹn này không?',
                'Xác nhận xóa',
                (isConfirmed) => {
                    if (isConfirmed) {
                        this._customerService.cM_CUSTOMER_Del(this.inputModel.cuS_ID).subscribe(() => {
                        this.notify.success(this.l('Xóa khách hàng thành công'));
                        this.goBack();
                        });
                    }
                }
            );
        
    }
    getDisplayName(fullName: string): string {
    if (!fullName) return '';
    
    // Cắt chuỗi theo khoảng trắng và lấy phần tử cuối cùng
    const words = fullName.trim().split(' ');
    const firstName = words[words.length - 1];

    return firstName; 
}
    printProfile(): void {
        // Logic to print customer profile
    }
    goBack(): void {
        this._router.navigate(['/app/admin', 'customer-list']);
    }
    getRouteParam(key: string): any {
        return (this.activeRoute.params as any).value[key];
    }
    openZalo(phone: string): void {
        if (!phone) {
            // Thông báo nếu không có SĐT
            this.notify.warn('Không có số điện thoại để mở Zalo');
            return;
        }

        // 1. Loại bỏ tất cả ký tự không phải là số (khoảng trắng, dấu chấm, gạch ngang)
        const cleanPhone = phone.replace(/\D/g, '');

        // 2. Cấu trúc URL chuẩn của Zalo
        const zaloUrl = `https://zalo.me/${cleanPhone}`;

        // 3. Mở ở tab mới
        window.open(zaloUrl, '_blank');
    }
    getCustomer(): void {
        this._customerService
            .cM_CUSTOMER_GetById(this.inputModel.cuS_ID)
            .pipe(finalize(() => (this.alertVisible = true)))
            .subscribe((result) => {
                this.inputModel = result;
            });
        }
    addNewNote(): void {
        if (!this.inputModel.notes) {
            this.inputModel.notes = '';
        }
        this.inputModel.notes += '\n' + 'Ghi chú mới: ' + new Date().toLocaleString();
        // this._customerService
        //     .cM_CUSTOMER_Update(this.inputModel)
        //     .pipe(finalize(() => (this.alertVisible = true)))
        //     .subscribe(() => {
        //         this.notify.success(this.l('Ghi chú đã được thêm thành công'));
        //     });
    }
    addTreatment(): void {
        this._router.navigate(['/app/admin/examination-edit/', this.inputModel.cuS_ID]);
    }
    addAppointment(Id?: string): void {
        this.createAppointmentModal.show(this.inputModel.cuS_ID,Id)
    }
    viewTreatmentDetail(exmId: string) {
        this._router.navigate(['/app/admin/examination-edit/', exmId]);
    }
    editCustomer(): void{
      this.createCustomerModal.show(this.inputModel.cuS_ID);
    }
    hideAlert(): void{
        this.alertVisible = false;
    }
    getStatusClass(status: any): string {
        switch(status) {
            case 1: return 'text-primary';      // Đang điều trị
            case 2: return 'text-success';   // Đã xong
            case 3: return 'text-warning';     // Chờ xử lý
            default: return 'text-secondary';
        }
    }
    getExaminations(): void {
        const searchParam = new MED_EXAMINATION_ENTITY();
        searchParam.skipCount = 0;
        searchParam.maxResultCount = 4;
        searchParam.exM_PATIENT_ID = this.inputModel.cuS_ID;

        this._examinationService
          .mED_EXAMINATION_Search(
              searchParam)
          .pipe(finalize(() => {
          }))
          .subscribe((result) => {
              this.treatmentList = result.items??[]
          });
    }
    navigateToCustomer(Id: string): void {
        if (!Id) return;
        
        // Điều hướng chính xác theo hệ thống định tuyến của Admin
        const url = `/app/admin/customer-detail/${Id}`;
        window.open(url, '_blank');
    }
}
