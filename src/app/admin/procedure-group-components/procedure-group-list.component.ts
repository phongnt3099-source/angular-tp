import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { LazyLoadEvent } from 'primeng/api';
import { Paginator } from 'primeng/paginator';
import { finalize } from 'rxjs/operators';
import { Router } from '@node_modules/@angular/router';
import { Table } from 'primeng/table';
import { CM_SERVICE_TYPE_ENTITY, ServiceTypeServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
  templateUrl: './procedure-group-list.component.html',
  animations: [appModuleAnimation()],
  styleUrls: ['./procedure-group-list.component.scss']
})
export class ProcedureGroupListComponent extends AppComponentBase implements OnInit {

  @ViewChild('paginator', { static: true }) paginator!: Paginator;
  @ViewChild('dataTable') dataTable!: Table;

  isLoading = false;

  // Cấu hình các biến filter đồng bộ [(ngModel)] trên View
  filterName = '';
  filterStatus = 'ALL';

  // DTO Input gửi xuống API hệ thống
  filterInput: CM_SERVICE_TYPE_ENTITY = new CM_SERVICE_TYPE_ENTITY();

  editingRow: CM_SERVICE_TYPE_ENTITY | null = null;
  tempRecord!: CM_SERVICE_TYPE_ENTITY;
  isAddingNew = false;

  constructor(
    injector: Injector,
    private _router: Router,
    private _serviceTypeService: ServiceTypeServiceProxy
  ) {
    super(injector);
  }

  ngOnInit(): void {
    // Sự kiện lazy load của p-table sẽ tự kích hoạt lần đầu
  }

  /**
   * Hàm gọi dữ liệu có phân trang và tìm kiếm từ Database
   */
  loadData(event?: LazyLoadEvent): void {
    // if (this.primengTableHelper.shouldResetPaging(event)) {
    //   this.paginator.changePage(0);
    //   return;
    // }

    this.primengTableHelper.showLoadingIndicator();

    // Tính toán phân trang skipCount và maxResultCount chuẩn ABP
    const skipCount = event && event.first !== undefined
      ? event.first
      : this.primengTableHelper.getSkipCount(this.paginator, event);
    const maxResultCount = event && event.rows !== undefined
      ? event.rows
      : this.primengTableHelper.getMaxResultCount(this.paginator, event);

    this.filterInput.skipCount = skipCount;
    this.filterInput.maxResultCount = maxResultCount;

    // Chuẩn hóa chuỗi tìm kiếm trước khi truyền xuống Database
    this.filterInput.sT_NAME = this.filterName ? this.filterName.trim() : '';

    // Gán dữ liệu trạng thái mở rộng cho bộ lọc gửi xuống database
    (this.filterInput as any).status = this.filterStatus;

    this._serviceTypeService
      .cM_SERVICE_TYPE_Search(this.filterInput)
      .pipe(finalize(() => this.primengTableHelper.hideLoadingIndicator()))
      .subscribe((result) => {
        this.primengTableHelper.totalRecordsCount = result.totalCount;
        this.primengTableHelper.records = result.items ?? [];
      });
  }

  /**
   * Bộ lọc nhanh: Khi thay đổi từ khóa, đưa phân trang về 0 để làm mới dữ liệu từ database
   */
  applyFilter() {
    if (this.paginator) {
      // Kiểm tra nếu trang hiện tại KHÁC trang đầu tiên (getPage() > 0)
      if (this.paginator.getPage() !== 0) {
        // Hàm này sẽ tự động chuyển trang và kích hoạt loadData() ngầm thông qua event của PrimeNG
        this.paginator.changePage(0);
      } else {
        // Nếu đang ở sẵn trang đầu tiên, changePage(0) không chạy -> chủ động gọi để tải lại dữ liệu theo từ khóa mới
        this.loadData();
      }
    } else {
      // Trường hợp paginator chưa kịp khởi tạo
      this.loadData();
    }
  }

  addNewRow() {
    if (this.isAddingNew) return;

    this.filterName = '';
    this.filterStatus = 'ALL';

    const newRow = new CM_SERVICE_TYPE_ENTITY();
    newRow.sT_NAME = '';
    newRow.isactive! = true;
    newRow.totaL_PROCEDURES = 0;

    this.primengTableHelper.records = [newRow, ...this.primengTableHelper.records];
    this.editingRow = newRow;
    this.tempRecord = { ...newRow } as any; // Sửa lỗi TS2739 bằng 'as any'
    this.isAddingNew = true;
  }

  edit(record: CM_SERVICE_TYPE_ENTITY) {
    this.editingRow = record;
    this.tempRecord = { ...record } as any;
    this.isAddingNew = false;
  }

  save(record: CM_SERVICE_TYPE_ENTITY) {
    if (!this.tempRecord.sT_NAME || !this.tempRecord.sT_NAME.trim()) {
      this.notify.warn('Vui lòng nhập tên nhóm thủ thuật');
      return;
    }

    if (this.isAddingNew) {
      this.tempRecord.makeR_ID = this.appSession.user.userName.toString();
      this._serviceTypeService.cM_SERVICE_TYPE_Ins(this.tempRecord).subscribe((response) => {
        if (response.result == '0') {
          this.notify.success(this.l('Thêm Thành Công!'));
          this.cancel();
        }
        else {
          this.notify.error(this.l('Thêm Thất Bại!') + ': ' + response.errorDesc);
        }

      });
    } else {
      this.tempRecord.updatE_USER = this.appSession.user.userName.toString();
      this._serviceTypeService.cM_SERVICE_TYPE_Upd(this.tempRecord).subscribe((response) => {
        if (response.result == '0') {
          this.notify.success(this.l('Cập Nhật Thành Công!'));
          this.cancel();
        }
        else {
          this.notify.error(this.l('Cập Nhật Thất Bại!') + ': ' + response.errorDesc);
        }
      });
    }
  }

  cancel() {
    this.editingRow = null;
    this.isAddingNew = false;
    this.loadData();
  }

  toggleActive(record: CM_SERVICE_TYPE_ENTITY) {
    record.isactive! = !record.isactive!;
    this._serviceTypeService.cM_SERVICE_TYPE_Upd(record).subscribe((response) => {
      if (response.result == '0') {
        this.notify.success(this.l('Cập Nhật Trạng Thái Thành Công!'));
        this.cancel();
      }
      else {
        this.notify.error(this.l('Cập Nhật Trạng Thái Thất Bại!') + ': ' + response.errorDesc);
      }
      this.loadData();
    });
  }

  delete(record: CM_SERVICE_TYPE_ENTITY) {
    if (record.totaL_PROCEDURES > 0) {
      this.message.warn(`Không thể xóa! Nhóm này đang chứa ${record.totaL_PROCEDURES} thủ thuật bên trong.`);
      return;
    }

    this.message.confirm(
      'Bạn có chắc chắn muốn xóa nhóm thủ thuật này?',
      'Xác nhận xóa dữ liệu',
      (isConfirmed) => {
        if (isConfirmed) {
          this._serviceTypeService.cM_SERVICE_TYPE_Del(record.sT_ID).subscribe((response) => {
            if (response.result == '0') {
              this.notify.success(this.l('Xóa Thành Công!'));
              this.cancel();
            }
            else {
              this.notify.error(this.l('Xóa Thất Bại!') + ': ' + response.errorDesc);
            }
            this.loadData();
          });
        }
      }
    );
  }
}