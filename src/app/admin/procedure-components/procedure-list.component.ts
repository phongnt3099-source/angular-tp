import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { LazyLoadEvent } from 'primeng/api';
import { Paginator } from 'primeng/paginator';
import { finalize } from 'rxjs/operators';
import { Table } from 'primeng/table';
import { CM_SERVICES_ENTITY, ServiceServiceProxy, CM_SERVICE_TYPE_ENTITY, ServiceTypeServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
  templateUrl: './procedure-list.component.html',
  animations: [appModuleAnimation()],
  styleUrls: ['./procedure-list.component.scss']
})
export class ProcedureListComponent extends AppComponentBase implements OnInit {

  @ViewChild('paginator', { static: true }) paginator!: Paginator;
  @ViewChild('dataTable') dataTable!: Table;

  // Lọc tìm kiếm trên lưới
  filterName = '';
  filterTypeCode = '';
  filterInput: CM_SERVICES_ENTITY = new CM_SERVICES_ENTITY();

  // Danh mục nhóm thủ thuật đổ vào combobox
  serviceTypes: CM_SERVICE_TYPE_ENTITY[] = [];

  // Quản lý Drawer trượt từ phải qua trái
  isDrawerOpen = false;
  isAddingNew = false;
  editingRecord: CM_SERVICES_ENTITY | null = null;
  tempRecord!: CM_SERVICES_ENTITY;

  constructor(
    injector: Injector,
    private _serviceProxy: ServiceServiceProxy,
    private _serviceTypeProxy: ServiceTypeServiceProxy
  ) {
    super(injector);
    console.log(this);
  }

  ngOnInit(): void {
    this.loadServiceTypes();
  }

  loadServiceTypes(): void {
    this._serviceTypeProxy.cM_SERVICES_GetAll().subscribe(result => {
      this.serviceTypes = result ?? [];
    });
  }

  loadData(event?: LazyLoadEvent): void {
    this.primengTableHelper.showLoadingIndicator();

    const skipCount = event && event.first !== undefined ? event.first : this.primengTableHelper.getSkipCount(this.paginator, event);
    const maxResultCount = event && event.rows !== undefined ? event.rows : this.primengTableHelper.getMaxResultCount(this.paginator, event);

    this.filterInput.skipCount = skipCount;
    this.filterInput.maxResultCount = maxResultCount;
    this.filterInput.srV_NAME = this.filterName ? this.filterName.trim() : '';
    (this.filterInput as any).servicE_TYPE_NAME = this.filterTypeCode;

    this._serviceProxy
      .cM_SERVICES_Search(this.filterInput)
      .pipe(finalize(() => this.primengTableHelper.hideLoadingIndicator()))
      .subscribe((result) => {
        this.primengTableHelper.totalRecordsCount = result.totalCount;
        this.primengTableHelper.records = result.items ?? [];
      });
  }

  applyFilter() {
    if (this.paginator && this.paginator.getPage() !== 0) {
      this.paginator.changePage(0);
    } else {
      this.loadData();
    }
  }

  openCreateDrawer() {
    this.isAddingNew = true;
    const newRow = new CM_SERVICES_ENTITY();

    // Khởi tạo giá trị Boolean chuẩn cho Switch
    newRow.srV_NAME = '';
    newRow.srV_PRICE = 0;
    newRow.pricE_INCLUDES_VAT = false; // Bắt buộc phải là false/true thuần túy
    newRow.haS_WARRANTY = false;
    newRow.isactive = true;

    this.tempRecord = { ...newRow } as any;
    this.isDrawerOpen = true;
  }

  openEditDrawer(record: CM_SERVICES_ENTITY) {
    this.isAddingNew = false;
    this.editingRecord = record;

    // Ép kiểu dữ liệu từ DB (0/1 hoặc null) về dạng Boolean chuẩn cho FE
    const cloneRecord = { ...record };
    cloneRecord.pricE_INCLUDES_VAT = !!record.pricE_INCLUDES_VAT;
    cloneRecord.haS_WARRANTY = !!record.haS_WARRANTY;

    this.tempRecord = cloneRecord as any;
    this.isDrawerOpen = true;
  }

  closeDrawer() {
    this.isDrawerOpen = false;
    this.editingRecord = null;
  }

  save() {
    if (!this.tempRecord.srV_NAME || !this.tempRecord.srV_NAME.trim()) {
      this.notify.warn('Vui lòng nhập tên thủ thuật/dịch vụ');
      return;
    }
    if (!this.tempRecord.servicE_TYPE_NAME) {
      this.notify.warn('Vui lòng chọn nhóm danh mục thủ thuật');
      return;
    }
    this.tempRecord.srV_TYPEID = this.serviceTypes.find(type => type.sT_NAME === this.tempRecord.servicE_TYPE_NAME)?.sT_ID || '';
    if (this.isAddingNew) {
      
      this.tempRecord.makeR_ID = this.appSession.user.userName.toString();
      this._serviceProxy.cM_SERVICES_Ins(this.tempRecord).subscribe((response) => {
        if (response.result == '0') {
          this.notify.success(this.l('Thêm Thành Công!'));
          this.closeDrawer();
          this.loadData();
        } else {
          this.notify.error(this.l('Thêm Thất Bại!') + ': ' + response.errorDesc);
        }
      });
    } else {
      this.tempRecord.updatE_USER = this.appSession.user.userName.toString();
      this._serviceProxy.cM_SERVICES_Upd(this.tempRecord).subscribe((response) => {
        if (response.result == '0') {
          this.notify.success(this.l('Cập Nhật Thành Công!'));
          this.closeDrawer();
          this.loadData();
        } else {
          this.notify.error(this.l('Cập Nhật Thất Bại!') + ': ' + response.errorDesc);
        }
      });
    }
  }

  delete(record: CM_SERVICES_ENTITY) {
    this.message.confirm(
      `Xóa thủ thuật: ${record.srV_NAME}?`,
      'Xác nhận xóa dữ liệu vĩnh viễn',
      (isConfirmed) => {
        if (isConfirmed) {
          this._serviceProxy.cM_SERVICES_Del(record.srV_ID).subscribe((response) => {
            if (response.result == '0') {
              this.notify.success(this.l('Xóa Thành Công!'));
              this.applyFilter();
            } else {
              this.notify.error(this.l('Xóa Thất Bại!') + ': ' + response.errorDesc);
            }
          });
        }
      }
    );
  }

  toggleActive(record: CM_SERVICES_ENTITY) {
    record.isactive = !record.isactive;
    this._serviceProxy.cM_SERVICES_Upd(record).subscribe((response) => {
      if (response.result == '0') {
        this.notify.success(this.l('Cập Nhật Trạng Thái Thành Công!'));
        this.loadData();
      } else {
        this.notify.error(this.l('Cập Nhật Trạng Thái Thất Bại!') + ': ' + response.errorDesc);
      }
    });
  }
  convertMonthsToYears(months: number | undefined | null): string {
    if (!months || months <= 0) {
      return 'Có bảo hành';
    }

    if (months >= 12) {
      const years = months / 12;
      // Kiểm tra nếu là số nguyên thì lấy phần nguyên, nếu số thập phân thì lấy 1 chữ số sau dấu phẩy (Ví dụ: 1.5 Năm)
      return Number.isInteger(years) ? `${years} Năm` : `${years.toFixed(1)} Năm`;
    }

    return `${months} Tháng`;
  }
  formatCurrencyValue(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '';
  }
  if (value === 0) return '0';
  
  // Sửa lại chuỗi Regex khớp chuẩn 3 chữ số hệ thập phân
  return value.toString().replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
  parseCurrencyValue(event: any): number {
  const inputVal = event.target.value;
  
  // Loại bỏ sạch tất cả ký tự không phải là số thuần túy
  const cleanVal = inputVal.replace(/\D/g, '');
  
  const numericVal = cleanVal ? parseInt(cleanVal, 10) : 0;
  
  // Cập nhật lại giá trị hiển thị trên ô input theo định dạng phân tách
  event.target.value = this.formatCurrencyValue(numericVal);
  
  return numericVal;
}
}