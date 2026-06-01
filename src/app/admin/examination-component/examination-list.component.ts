import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ExaminationServiceProxy, MED_EXAMINATION_ENTITY } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent } from 'primeng/api';
import { Paginator } from 'primeng/paginator';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';

@Component({
    templateUrl: './examination-list.component.html',
    styleUrls: ['./examination-list.component.scss'],
    animations: [appModuleAnimation()],
})


export class ExaminationListComponent extends AppComponentBase implements OnInit {
    @ViewChild('paginator', { static: true }) paginator!: Paginator;
    

    filterInput: MED_EXAMINATION_ENTITY = new MED_EXAMINATION_ENTITY();
    examinations: any[] = [];
    loading = false;

    countNew = 0;
    countDoing = 0;
    countComplete = 0;
    countCancel = 0;

    constructor(
        injector: Injector,
        private _examinationService: ExaminationServiceProxy,
        private _router: Router
    ) {
        super(injector);
        console.log(this);
    }

    ngOnInit(): void {
        this.getExaminations();
        this.initDefaultSevenDaysPeriod();
    }

    getExaminations(event?: any): void {
        if (this.loading) return;
        this.loading = false;

        if (this.primengTableHelper.shouldResetPaging(event)) {
            this.paginator.changePage(0);
            return;
        }

        this.primengTableHelper.showLoadingIndicator();

        // 2. Lấy vị trí bắt đầu (SkipCount) và số lượng bản ghi (MaxResultCount)
        const skipCount = event && event.first !== undefined
                        ? event.first
                        : this.primengTableHelper.getSkipCount(this.paginator, event);
        const maxResultCount = event && event.rows !== undefined
                            ? event.rows
                            : this.primengTableHelper.getMaxResultCount(this.paginator, event);
        this.filterInput.skipCount = skipCount;
        this.filterInput.maxResultCount = maxResultCount;

        this._examinationService
          .mED_EXAMINATION_Search(
              this.filterInput)
          .pipe(finalize(() => {
            this.primengTableHelper.hideLoadingIndicator();
            this.loading = false;
          }))
          .subscribe((result) => {
              this.primengTableHelper.totalRecordsCount = result.totalCount;
              this.primengTableHelper.records = result.items??[];
              this.primengTableHelper.hideLoadingIndicator();
          });
    }

    refreshList(): void {
        this.paginator.changePage(0);
    }

    createNewTreatment(): void {
        this._router.navigate(['/app/admin/examination-create']);
    }

    viewDetail(id: string): void {
        this._router.navigate(['/app/admin/examination-edit', id]);
    }
    viewPatientDetail(patientId: string): void {
        if (!patientId) {
            this.notify.warn('Không tìm thấy ID của bệnh nhân này!');
            return;
        }
        // Điều hướng sang component quản lý thông tin chi tiết khách hàng của bạn
        this._router.navigate(['/app/admin/customer-detail', patientId]); 
    }

    deleteDirectly(item: any): void {
        if (!item || !item.exM_ID) return;

        this.message.confirm(
            `Hồ sơ điều trị của bệnh nhân [${item.patienT_NAME}] cùng toàn bộ danh mục dịch vụ chỉ định đi kèm sẽ bị xóa hoàn toàn khỏi hệ thống.\nThao tác này không thể hoàn tác!`,
            `Xác nhận xóa phiếu #${item.exM_CODE}`,
            (isConfirmed) => {
                if (isConfirmed) {
                    this.loading = true;
                    this._examinationService
                        .mED_EXAMINATION_Del(item.exM_ID)
                        .pipe(finalize(() => (this.loading = false)))
                        .subscribe({
                            next: () => {
                                this.notify.success(`Đã xóa thành công phiếu điều trị #${item.exM_CODE}`);
                                this.refreshList(); // Reload lại danh sách sau khi xóa thành công
                            },
                            error: (err) => {
                                this.notify.error('Hệ thống gặp lỗi, không thể xóa phiếu điều trị này!');
                            }
                        });
                }
            }
        );
    }

    getStatusClass(status: number): string {
        switch (status) {
            case 0: return 'badge-soft-status waiting';
            case 1: return 'badge-soft-status doing';
            case 2: return 'badge-soft-status completed';
            case 3: return 'badge-soft-status cancelled';
            default: return 'badge-soft-status';
        }
    }

    getStatusLabel(status: number): string {
        switch (status) {
            case 0: return 'Chờ khám';
            case 1: return 'Đang điều trị';
            case 2: return 'Hoàn thành';
            case 3: return 'Đã hủy';
            default: return 'Không rõ';
        }
    }
    initDefaultSevenDaysPeriod(): void {
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);

        // Định dạng cấu trúc chuỗi YYYY-MM-DD phù hợp với ô Input HTML5 native
        this.filterInput.tO_DATE = today.toISOString().split('T')[0];
        this.filterInput.froM_DATE = sevenDaysAgo.toISOString().split('T')[0];
    }
    calculateStatusStatistics(records: any[]): void {
        this.countNew = records.filter(r => +r.exM_STATUS === 0).length;
        this.countDoing = records.filter(r => +r.exM_STATUS === 1).length;
        this.countComplete = records.filter(r => +r.exM_STATUS === 2).length;
        this.countCancel = records.filter(r => +r.exM_STATUS === 3).length;
    }
    remainingAmount(record: any): number {
        const finalAmount = record?.exM_FINAL_AMOUNT || 0;
        const totalPaid = record?.totaL_PAID || 0;
        return Math.max(0, finalAmount - totalPaid);
    }
}
