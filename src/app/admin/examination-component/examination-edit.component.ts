/* eslint-disable no-trailing-spaces */
/* eslint-disable curly */
import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CM_CUSTOMER_ENTITY, CustomerServiceProxy, ExaminationServiceProxy, MED_EXAMINATION_ENTITY, MED_TREATMENT_DETAIL_ENTITY, CM_SERVICES_ENTITY, CM_SERVICE_TYPE_ENTITY, ServiceServiceProxy, ServiceTypeServiceProxy, CM_EMPLOYEE_ENTITY, EmployeeServiceProxy, FIN_TRANSACTION_ENTITY, TransactionServiceProxy } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent } from 'primeng/api';
import { Paginator } from 'primeng/paginator';
import { finalize } from 'rxjs/operators';
import { ActivatedRoute, Router } from '@node_modules/@angular/router';
import { CreateAppointmentModalComponent } from '../appointment-components/create-appointment-modal.component';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { HostListener } from '@angular/core';
import { it } from 'node:test';
import { CreateTransactionModalComponent } from '../transaction-components/create-transaction-modal.component';
import { NotifyService } from '@node_modules/abp-ng2-module';



// Mở rộng thực thể chi tiết phục vụ Binding và tính toán dữ liệu động trên UI

interface ExtendedTreatmentDetail extends MED_TREATMENT_DETAIL_ENTITY {
  tD_FINAL_PRICE_PER_UNIT: number;
  showDiscountPanel: boolean;
  displayPrice?: string;
}

@Component({
  templateUrl: './examination-edit.component.html',
  styleUrls: ['./examination-edit.component.scss'],
  animations: [appModuleAnimation()],
})

@HostListener('document:click', ['$event'])

export class ExaminationEditComponent extends AppComponentBase implements OnInit {

  @ViewChild('paginator', { static: true }) paginator!: Paginator;
  @ViewChild('createTransactionModal', { static: true }) createTransactionModal!: CreateTransactionModalComponent;

  // Danh mục dịch vụ chỉ định điều trị của phiếu hiện hành
  treatmentDetails: ExtendedTreatmentDetail[] = [];
  // Các trạng thái quản lý tài chính dòng & tổng hóa đơn (Compound Discount)
  subTotal = 0;
  globalDiscountType: 'VND' | 'PERCENT' = 'VND';
  globalDiscountValue = 0;
  debtAmount = 0;
  totalRawBeforeDiscount = 0;
  // Trạng thái quản lý cấu trúc Sơ đồ chọn Răng
  isToothModalOpen = false;
  toothType: 'ADULT' | 'CHILD' = 'ADULT';
  selectedRowForTooth: ExtendedTreatmentDetail | null = null;
  id = '';
  invoiceCreationDate = '';
  rawCreationDate: Date = new Date();
  maxCurrentDate = '';
  patientInfo: CM_CUSTOMER_ENTITY = new CM_CUSTOMER_ENTITY;
  examination: MED_EXAMINATION_ENTITY = new MED_EXAMINATION_ENTITY;

  // Định nghĩa mã hóa danh mục răng theo quy chuẩn quốc tế FDI
  adultTeethUR = [18, 17, 16, 15, 14, 13, 12, 11]; // Hàm trên bên phải (Quadrant 1)
  adultTeethUL = [21, 22, 23, 24, 25, 26, 27, 28]; // Hàm trên bên trái (Quadrant 2)
  adultTeethLL = [31, 32, 33, 34, 35, 36, 37, 38]; // Hàm dưới bên trái (Quadrant 3)
  adultTeethLR = [48, 47, 46, 45, 44, 43, 42, 41]; // Hàm dưới bên phải (Quadrant 4)

  childTeethUR = [55, 54, 53, 52, 51]; // Răng sữa hàm trên phải (Quadrant 5)
  childTeethUL = [61, 62, 63, 64, 65]; // Răng sữa hàm trên trái (Quadrant 6)
  childTeethLL = [71, 72, 73, 74, 75]; // Răng sữa hàm dưới trái (Quadrant 7)
  childTeethLR = [85, 84, 83, 82, 81]; // Răng sữa hàm dưới phải (Quadrant 8)
  alertVisible = true;
  // Quản lý trạng thái Dropdown chọn dịch vụ
  isDropdownOpen = false;
  searchKeyword = '';
  selectedTypeId: string | null = null;
  // Dữ liệu mock-up đại diện cho vùng lưu trữ Cache (ít thay đổi, truy cập nhiều)
  serviceTypes: CM_SERVICE_TYPE_ENTITY[] = [];

  cachedServices: CM_SERVICES_ENTITY[] = [];
  // Danh sách dịch vụ sau khi lọc để hiển thị lên UI Dropdown
  filteredServices: any[] = [];
  // Trạng thái điều khiển Modal dịch vụ dữ liệu lớn
  isServiceModalOpen = false;
  IsChange = false;
  modalSearchKeyword = '';
  selectedModalTypeId: string | null = null;
  // Mảng lưu trữ tạm thời các dịch vụ được tích chọn trong Modal trước khi ấn nút "Áp dụng"
  temporarySelectedServices: any[] = [];
  filteredModalServices: any[] = [];
  selectedDoctor = '';
  listDoctors: CM_EMPLOYEE_ENTITY[] = [];
  saving = false;
  paymentLogs: FIN_TRANSACTION_ENTITY[] = []
  isAdminBypass = false;
  // inputModel: CM_CUSTOMER_ENTITY = new CM_CUSTOMER_ENTITY();
  constructor(
    injector: Injector,
    private _customerService: CustomerServiceProxy,
    private _examinationService: ExaminationServiceProxy,
    private _serviceService: ServiceServiceProxy,
    private _serviceTypeService: ServiceTypeServiceProxy,
    private activeRoute: ActivatedRoute,
    private _employeeService: EmployeeServiceProxy,
    private _transactionService: TransactionServiceProxy,
    private _notifyService: NotifyService,
    private _router: Router
  ) {
    super(injector);
    this.id = this.getRouteParam('id');
    console.log(this);
  }
  ngOnInit(): void {
    this.loadData();
  }
  deleteCustomer(): void {
    // this.message.confirm(
    //             'Bạn có chắc chắn muốn xóa lịch hẹn này không?',
    //             'Xác nhận xóa',
    //             (isConfirmed) => {
    //                 if (isConfirmed) {
    //                     this._customerService.cM_CUSTOMER_Del(this.inputModel.cuS_ID).subscribe(() => {
    //                     this.notify.success(this.l('Xóa khách hàng thành công'));
    //                     this.goBack();
    //                     });
    //                 }
    //             }
    //         );
  }
  loadData(): void {
    if (this.id.startsWith('KH')) {
      this.getCustomer(this.id);
      this.getTypeService();
      this.getService();
      this.getDoctor();
      this.OnSetCreateDT();
    }
    else if (this.id.startsWith('EXM')) {
      this.saving = true;
      this._examinationService
        .mED_EXAMINATION_GetById(this.id)
        .pipe(finalize(() => (this.saving = false)))
        .subscribe((result) => {
          if (result) {
            this.examination = result;

            if (this.examination.exM_DATE) {
              const parsedDate = new Date(this.examination.exM_DATE);
              if (!isNaN(parsedDate.getTime())) {
                this.invoiceCreationDate = parsedDate.toISOString().split('T')[0];
              }
            }

            this.treatmentDetails = (result.treatmentDetails || []).map((dt: any) => {
              const unitPrice = Number(dt.tD_UNIT_PRICE || dt.TD_UNIT_PRICE || 0);
              const qty = Number(dt.tD_QUANTITY || dt.TD_QUANTITY || 1);
              const discountAmt = Number(dt.tD_DISCOUNT_AMOUNT || dt.TD_DISCOUNT_AMOUNT || 0);
              const finalPrice = Number(dt.tD_FINAL_PRICE || dt.TD_FINAL_PRICE || 0);
              const status = dt.tD_STATUS !== undefined ? dt.tD_STATUS : (dt.TD_STATUS || 0);
              const cached = this.cachedServices?.find(s => s.srV_ID === (dt.tD_srV_ID || dt.TD_srV_ID));

              // Tính toán đơn giá sau giảm trên từng chiếc răng
              const discountPerUnit = qty > 0 ? Math.round(discountAmt / qty) : 0;
              const finalPricePerUnit = unitPrice - discountPerUnit;

              const row = new MED_TREATMENT_DETAIL_ENTITY() as ExtendedTreatmentDetail;

              // Gán các trường vật lý chữ thường và HOA cho Class Instance
              row.tD_ID = dt.tD_ID;
              row.tD_EXM_ID = dt.tD_EXM_ID || this.examination.exM_ID;
              row.tD_SRV_ID = dt.tD_SRV_ID;
              row.tD_TOOTH_NUMBER = dt.tD_TOOTH_NUMBER || dt.TD_TOOTH_NUMBER || '';
              row.tD_QUANTITY = qty; row.tD_QUANTITY = qty;
              row.tD_UNIT_PRICE = unitPrice; row.tD_UNIT_PRICE = unitPrice;
              row.tD_DISCOUNT_AMOUNT = discountAmt; row.tD_DISCOUNT_AMOUNT = discountAmt;
              row.tD_FINAL_PRICE = finalPrice; row.tD_FINAL_PRICE = finalPrice;
              row.tD_STATUS = +status; row.tD_STATUS = +status;
              row.tD_ASSIGNED_DOCTOR_ID = dt.tD_ASSIGNED_DOCTOR_ID || dt.TD_ASSIGNED_DOCTOR_ID;

              // Đổ trực tiếp cấu hình giảm giá từ Store gửi lên mà không cần tính ngược
              row.srV_NAME = cached ? cached.srV_NAME : (dt.srV_NAME || 'Dịch vụ chỉ định');
              row.discountType = dt.discountType || 'VND';
              row.discountValue = Number(dt.discountValue || 0);
              row.tD_FINAL_PRICE_PER_UNIT = finalPricePerUnit;
              row.showDiscountPanel = false;
              row.displayPrice = unitPrice.toLocaleString('en-US'); // Thêm dấu phẩy hiển thị trên ô nhập đơn giá

              return row;
            });

            // Tính toán đảo ngược số tiền "Giảm giá thêm" ở đáy hóa đơn:
            // Giảm giá thêm = Tổng giá giảm (EXM_TOTAL_DISCOUNT) - Tổng giảm trên các dòng chi tiết
            const totalRowDiscount = this.treatmentDetails.reduce((sum, item) => sum + Number(item.tD_DISCOUNT_AMOUNT || 0), 0);
            const totalInvoiceDiscount = Number(this.examination.exM_TOTAL_DISCOUNT || 0);
            this.globalDiscountValue = (totalInvoiceDiscount - totalRowDiscount) > 0 ? (totalInvoiceDiscount - totalRowDiscount) : 0;
            this.globalDiscountType = 'VND';

            this.selectedDoctor = this.examination.exM_DOCTOR_ID;
            this.calculateInvoice();
            this.getCustomer(this.examination.exM_PATIENT_ID);
            this.getTypeService();
            this.getService();
            this.getDoctor();
            this.calculateInvoice();
            this.getPaymentLogs();
          }
        });
    }
    else {
      this.notify.error("Không tồn tại ID");
    }
  }
  openServiceModal(): void {
    this.isServiceModalOpen = true;
    this.modalSearchKeyword = '';
    this.selectedModalTypeId = null;
    this.temporarySelectedServices = [];
    this.filterModalServices();
  }
  closeServiceModal(): void {
    this.isServiceModalOpen = false;
  }

  selectModalType(typeId: string | null): void {
    this.selectedModalTypeId = typeId;
    this.filterModalServices();
  }
  filterModalServices(): void {
    const keyword = (this.modalSearchKeyword || '').trim().toLowerCase();

    // Giả định bản gốc lưu trong 'allServices' hoặc 'cachedServices' của bạn
    let targetServices = this.cachedServices || [];

    // 1. Lọc theo danh mục (Sidebar trái) nếu có chọn
    if (this.selectedModalTypeId !== null) {
      targetServices = targetServices.filter(s => s.srV_TYPEID === this.selectedModalTypeId || s.srV_TYPEID === this.selectedModalTypeId);
    }

    // 2. Lọc theo từ khóa Search (Hỗ trợ cả Tiếng Việt có dấu/không dấu và đúng trường API)
    if (keyword) {
      this.filteredModalServices = targetServices.filter(srv => {
        const name = (srv.srV_NAME || '').toLowerCase();
        const code = (srv.srV_CODE || '').toLowerCase();

        return name.includes(keyword) || code.includes(keyword);
      });
    } else {
      this.filteredModalServices = [...targetServices];
    }
  }
  toggleSelectService(srv: any): void {
    const index = this.temporarySelectedServices.findIndex(x => x.srV_ID === srv.srV_ID);
    if (index > -1) {
      this.temporarySelectedServices.splice(index, 1);
    } else {
      this.temporarySelectedServices.push(srv);
    }
  }
  isServiceSelectedInModal(srv: any): boolean {
    return this.temporarySelectedServices.some(x => x.srV_ID === srv.srV_ID);
  }
  applySelectedServices(): void {
    this.temporarySelectedServices.forEach(srv => {
      const isAlreadyExist = this.treatmentDetails.some(x => x.tD_SRV_ID === srv.srV_ID);
      if (!isAlreadyExist) {
        this.addNewServiceRow(srv.srV_ID, srv.srV_NAME, srv.srV_PRICE);
      }
    });
    this.closeServiceModal();
  }
  openToothChart(item: ExtendedTreatmentDetail): void {
    this.selectedRowForTooth = item;
    this.isToothModalOpen = true;
  }
  closeToothChart(): void {
    this.isToothModalOpen = false;
    this.selectedRowForTooth = null;
  }
  toggleTooth(tooth: number): void {
    if (!this.selectedRowForTooth) return;

    let currentTeeth = this.selectedRowForTooth.tD_TOOTH_NUMBER
      ? this.selectedRowForTooth.tD_TOOTH_NUMBER.split(',').map(t => t.trim()).filter(t => t !== '')
      : [];

    const toothStr = tooth.toString();
    const index = currentTeeth.indexOf(toothStr);

    if (index > -1) {
      currentTeeth.splice(index, 1); // Đã chọn thì xóa bỏ
    } else {
      currentTeeth.push(toothStr); // Chưa chọn thì thêm mới
    }

    currentTeeth.sort((a, b) => parseInt(a) - parseInt(b));
    this.selectedRowForTooth.tD_TOOTH_NUMBER = currentTeeth.join(', ');

    // CẬP NHẬT: Số lượng dòng dịch vụ bằng tổng số răng đã tích chọn (Tối thiểu là 1 nếu xóa hết răng)
    this.selectedRowForTooth.tD_QUANTITY = currentTeeth.length > 0 ? currentTeeth.length : 1;

    // Tính toán lại tài chính dựa trên số lượng mới cập nhật
    this.onQuantityChange(this.selectedRowForTooth);
  }
  isSelected(tooth: number): boolean {
    if (!this.selectedRowForTooth || !this.selectedRowForTooth.tD_TOOTH_NUMBER) return false;
    const currentTeeth = this.selectedRowForTooth.tD_TOOTH_NUMBER.split(',').map(t => parseInt(t.trim()));
    return currentTeeth.includes(tooth);
  }
  selectUpperJaw(): void {
    if (!this.selectedRowForTooth) return;
    const upperTeeth = this.toothType === 'ADULT'
      ? [...this.adultTeethUR, ...this.adultTeethUL]
      : [...this.childTeethUR, ...this.childTeethUL];
    this.mergeSelectedTeeth(upperTeeth);
  }
  selectLowerJaw(): void {
    if (!this.selectedRowForTooth) return;
    const lowerTeeth = this.toothType === 'ADULT'
      ? [...this.adultTeethLR, ...this.adultTeethLL]
      : [...this.childTeethLR, ...this.childTeethLL];
    this.mergeSelectedTeeth(lowerTeeth);
  }
  selectAllTeeth(): void {
    if (!this.selectedRowForTooth) return;
    const allTeeth = this.toothType === 'ADULT'
      ? [...this.adultTeethUR, ...this.adultTeethUL, ...this.adultTeethLR, ...this.adultTeethLL]
      : [...this.childTeethUR, ...this.childTeethUL, ...this.childTeethLR, ...this.childTeethLL];
    this.mergeSelectedTeeth(allTeeth);
  }
  executeRowFinancialCalculation(item: ExtendedTreatmentDetail, triggerSource: 'UNIT_PRICE' | 'DISCOUNT' | 'FINAL_PER_UNIT' | 'QUANTITY'): void {
    if (!item) return;

    const qty = Number(item.tD_QUANTITY || 0);
    const unitPrice = Number(item.tD_UNIT_PRICE || 0);

    item.discountType = item.discountType || 'VND';
    item.discountValue = Number(item.discountValue) || 0;

    switch (triggerSource) {
      case 'UNIT_PRICE':
      case 'QUANTITY':
      case 'DISCOUNT':
        // CÔNG THỨC MỚI: Tính toán mức giảm trên ĐƠN GIÁ của 1 đơn vị trước
        let discountPerUnit = 0;

        if (item.discountType === 'PERCENT') {
          if (item.discountValue > 100) item.discountValue = 100;
          discountPerUnit = Math.round(unitPrice * (item.discountValue / 100));
        } else {
          if (item.discountValue > unitPrice) item.discountValue = unitPrice; // Không giảm quá đơn giá gốc
          discountPerUnit = item.discountValue;
        }

        // 1. Đơn giá sau khi giảm của 1 đơn vị
        item.tD_FINAL_PRICE_PER_UNIT = unitPrice - discountPerUnit;

        // 2. Thành tiền tổng của dòng = Đơn giá sau giảm x Số lượng
        item.tD_FINAL_PRICE = item.tD_FINAL_PRICE_PER_UNIT * qty;

        // 3. Tổng số tiền giảm giá của cả dòng (để lưu DB báo cáo kế toán)
        item.tD_DISCOUNT_AMOUNT = discountPerUnit * qty;
        break;

      case 'FINAL_PER_UNIT':
        // Trường hợp bác sĩ gõ thẳng vào ô "Giá sau giảm" (Đơn giá sau giảm)
        if (item.tD_FINAL_PRICE_PER_UNIT > unitPrice) item.tD_FINAL_PRICE_PER_UNIT = unitPrice;
        if (item.tD_FINAL_PRICE_PER_UNIT < 0) item.tD_FINAL_PRICE_PER_UNIT = 0;

        // 1. Thành tiền tổng = Đơn giá sau giảm mới x Số lượng
        item.tD_FINAL_PRICE = item.tD_FINAL_PRICE_PER_UNIT * qty;

        // 2. Tính mức chênh lệch giảm giá trên mỗi đơn vị
        const diffDiscountPerUnit = unitPrice - item.tD_FINAL_PRICE_PER_UNIT;
        item.tD_DISCOUNT_AMOUNT = diffDiscountPerUnit * qty;

        // 3. Quy đổi ngược lại giá trị hiển thị ở Popover giảm giá dòng
        if (item.discountType === 'PERCENT') {
          item.discountValue = unitPrice > 0 ? Math.round((diffDiscountPerUnit / unitPrice) * 100) : 0;
        } else {
          item.discountValue = diffDiscountPerUnit;
        }
        break;
    }

    // ĐỒNG BỘ TUYỆT ĐỐI các trường chữ viết hoa phục vụ Backend
    item.tD_QUANTITY = item.tD_QUANTITY;
    item.tD_UNIT_PRICE = item.tD_UNIT_PRICE;
    item.tD_DISCOUNT_AMOUNT = item.tD_DISCOUNT_AMOUNT;
    item.tD_FINAL_PRICE = item.tD_FINAL_PRICE;

    // Chạy lại bộ tính toán hóa đơn tổng toàn diện
    this.calculateInvoice();
  }
  calculateInvoice(): void {
    // A. Tổng chưa giảm (₫): Cộng dồn (Đơn giá gốc * Số lượng) của mọi dòng
    this.totalRawBeforeDiscount = this.treatmentDetails.reduce((sum, item) => {
      return sum + (Number(item.tD_UNIT_PRICE || 0) * Number(item.tD_QUANTITY || 0));
    }, 0);

    // B. Tổng tích lũy tiền giảm giá thực tế trực tiếp từ các dòng
    const totalRowDiscountAmount = this.treatmentDetails.reduce((sum, item) => {
      return sum + Number(item.tD_DISCOUNT_AMOUNT || 0);
    }, 0);

    // C. Tổng tiền tạm tính sau khi đã trừ giảm giá dòng (Làm mốc để tính tiếp Giảm giá thêm tổng)
    this.subTotal = this.treatmentDetails.reduce((sum, item) => {
      return sum + Number(item.tD_FINAL_PRICE || 0);
    }, 0);

    // D. Giảm giá thêm (₫): Xử lý ô giảm giá thêm toàn hóa đơn (Global Discount)
    this.globalDiscountType = this.globalDiscountType || 'VND';
    this.globalDiscountValue = Number(this.globalDiscountValue) || 0;

    let invoiceGlobalDiscountAmount = 0;
    if (this.globalDiscountType === 'PERCENT') {
      if (this.globalDiscountValue > 100) this.globalDiscountValue = 100;
      invoiceGlobalDiscountAmount = Math.round(this.subTotal * (this.globalDiscountValue / 100));
    } else {
      if (this.globalDiscountValue > this.subTotal) this.globalDiscountValue = this.subTotal;
      invoiceGlobalDiscountAmount = this.globalDiscountValue;
    }

    // E. Tổng giá giảm (₫): = (Tổng giảm trực tiếp trên các dòng) + (Giảm giá thêm của tổng hóa đơn)
    this.examination.exM_TOTAL_DISCOUNT = totalRowDiscountAmount + invoiceGlobalDiscountAmount;

    // F. Tổng tiền (₫): = Tổng chưa giảm - Tổng giá giảm
    this.examination.exM_FINAL_AMOUNT = this.totalRawBeforeDiscount - this.examination.exM_TOTAL_DISCOUNT;
    if (this.examination.exM_FINAL_AMOUNT < 0) this.examination.exM_FINAL_AMOUNT = 0;

    // G. Đồng bộ công nợ mặc định
    this.debtAmount = this.examination.exM_FINAL_AMOUNT;
  }
  // Khi sửa ô "Giảm giá thêm" ở phần tổng hóa đơn dưới đáy màn hình
  onGlobalDiscountValueChange(value: string): void {
    this.globalDiscountValue = this.parseFormattedNumber(value);
    this.calculateInvoice();
  }
  // Khi đổi kiểu "Giảm giá thêm" ở đáy màn hình (% <-> VND)
  onGlobalDiscountTypeChange(): void {
    this.globalDiscountValue = 0;
    this.calculateInvoice();
  }

  addNewServiceRow(srvId: string, srvName: string, price: number): void {
    const newDetail: ExtendedTreatmentDetail = {
      tD_ID: '',
      tD_EXM_ID: '',
      tD_SRV_ID: srvId,
      srV_NAME: srvName,
      tD_TOOTH_NUMBER: '',
      tD_QUANTITY: 1,
      tD_UNIT_PRICE: price,
      tD_DISCOUNT_AMOUNT: 0,
      tD_FINAL_PRICE_PER_UNIT: price,
      tD_FINAL_PRICE: price,
      tD_ASSIGNED_DOCTOR_ID: this.examination.exM_DOCTOR_ID,

      // Khởi tạo trạng thái mặc định: 0 ứng với "Chưa điều trị"
      tD_STATUS: 0,

      discountType: 'VND',
      discountValue: 0,
      showDiscountPanel: false
    } as any as ExtendedTreatmentDetail;

    this.treatmentDetails.push(newDetail);
    this.calculateInvoice();
  }
  onSearchFocus(): void {
    this.isDropdownOpen = true;
    this.filterServices();
  }
  filterServices(): void {
    const keyword = this.searchKeyword.toLowerCase().trim();

    const rawFiltered = this.cachedServices.filter(srv => {
      // 1. Kiểm tra điều kiện nhóm danh mục nếu bác sĩ đang chọn một Tab cụ thể
      const matchesType = this.selectedTypeId ? srv.srV_TYPEID === this.selectedTypeId : true;

      // 2. Kiểm tra điều kiện từ khóa (Khớp theo Tên dịch vụ hoặc Mã Procedure Code viết tắt)
      const matchesKeyword = keyword ?
        (
          srv.srV_NAME.toLowerCase().includes(keyword) ||
          srv.srV_CODE.toLowerCase().includes(keyword)
        ) : true;

      return matchesType && matchesKeyword;
    });

    // Trích xuất lấy đúng 10 bản ghi khớp nhất để render lên UI dropdown
    this.filteredServices = rawFiltered.slice(0, 10);
  }
  filterByServiceType(typeId: string | null): void {
    this.selectedTypeId = typeId;
    this.filterServices();
  }
  selectService(srv: any): void {
    // Gọi hàm nạp thêm dòng mới vào bảng chỉ định điều trị ngoài màn hình chính
    this.addNewServiceRow(srv.srV_ID, srv.srV_NAME, srv.srV_PRICE);

    // Tiến hành reset trạng thái ô tìm kiếm và đóng hộp thoại dropdown
    this.searchKeyword = '';
    this.selectedTypeId = null;
    this.isDropdownOpen = false;
  }

  removeRow(index: number): void {
    this.treatmentDetails.splice(index, 1);
    this.calculateInvoice();
  }

  onSaveExamination(): void {
    // 1. Chạy lại hàm tổng hóa đơn một lần cuối trước khi đóng gói để đảm bảo số liệu chính xác tuyệt đối
    this.calculateInvoice();

    // 2. Validate nhanh dữ liệu cơ bản
    if (!this.examination.exM_PATIENT_ID) {
      this.notify.error('Vui lòng chọn khách hàng trước khi lưu phiếu!');
      return;
    }
    if (this.treatmentDetails.length === 0) {
      this.notify.error('Vui lòng chỉ định ít nhất một dịch vụ hoặc răng điều trị!');
      return;
    }

    this.saving = true;

    // 3. Chuẩn hóa cấu trúc mảng danh sách chi tiết (Insert Data Map)
    const formattedDetails = this.treatmentDetails.map((item, index) => {
      // Khởi tạo một instance mới từ class gốc của Service Proxy
      const detail = new MED_TREATMENT_DETAIL_ENTITY();

      // Gán dữ liệu vào instance mới
      detail.tD_QUANTITY = Number(item.tD_QUANTITY || 0);
      detail.tD_UNIT_PRICE = Number(item.tD_UNIT_PRICE || 0);
      detail.tD_DISCOUNT_AMOUNT = Number(item.tD_DISCOUNT_AMOUNT || 0);
      detail.tD_FINAL_PRICE = Number(item.tD_FINAL_PRICE || 0);
      detail.discountType = Number(item.discountValue || 0) > 0 ? item.discountType : '';
      detail.discountValue = Number(item.discountValue || 0)
      detail.tD_STATUS = item.tD_STATUS !== undefined ? Number(item.tD_STATUS) : 0;

      // Đảm bảo sao chép các thuộc tính định danh quan trọng khác
      detail.tD_ID = item.tD_ID || '';
      detail.tD_EXM_ID = item.tD_EXM_ID || this.examination.exM_ID;
      detail.tD_SRV_ID = item.tD_SRV_ID;
      detail.tD_TOOTH_NUMBER = item.tD_TOOTH_NUMBER;
      detail.tD_ASSIGNED_DOCTOR_ID = item.tD_ASSIGNED_DOCTOR_ID;

      return detail; // Trả về instance có đầy đủ hàm toJSON()
    });

    // 4. Đóng gói dữ liệu tổng thể gửi lên Backend Service Proxy
    // Gán danh sách chi tiết dịch vụ đã chuẩn hóa vào thực thể phiếu khám chính
    this.examination.treatmentDetails = formattedDetails as any;

    // Gán các thông số tổng tiền cuối cùng thu được từ hàm calculateInvoice()
    this.examination.exM_DATE = this.invoiceCreationDate.toString();
    this.examination.makeR_ID = this.appSession.user.userName;
    this.examination.exM_DOCTOR_ID = this.selectedDoctor;
    this.examination.exM_TOTAL_RAW = this.totalRawBeforeDiscount; // Tổng chưa giảm
    this.examination.exM_SUB_TOTAL = this.subTotal;              // Tổng tạm tính sau giảm dòng
    console.log(this.examination);

    // Lưu ý: exM_TOTAL_DISCOUNT và exM_FINAL_AMOUNT đã được tự động đồng bộ trong hàm calculateInvoice()

    if (!this.examination.exM_ID) {
      this._examinationService
        .mED_EXAMINATION_Ins(this.examination)
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: (result) => {
            if (result.result == '0') {
              this.examination.exM_CODE = result.ids;
              this.examination.exM_ID = result.id;
              this.notify.success(this.l('Thêm mới phiếu điều trị thành công'));
            }
            else {
              this.notify.error('Thêm mới thất bại!.' + result.errorDesc);
            }
          },
          error: (err) => {
            this.notify.error('Đã xảy ra lỗi hệ thống trong quá trình lưu dữ liệu!');
            console.error('Lỗi API Insert Examination:', err);
          }
        });
    }
    else {
      this._examinationService
        .mED_EXAMINATION_Upd(this.examination)
        .pipe(finalize(() => (this.saving = false)))
        .subscribe({
          next: (result) => {
            if (result.result == '0') {
              this.notify.success(this.l('Chỉnh sửa phiếu điều trị thành công'));
            }
            else {
              this.notify.error('Chỉnh sửa thất bại!.' + result.errorDesc);
            }
          },
          error: (err) => {
            this.notify.error('Đã xảy ra lỗi hệ thống trong quá trình lưu dữ liệu!');
            console.error('Lỗi API Insert Examination:', err);
          }
        });
    }

  }
  clearSelectedTeeth(): void {
    if (this.selectedRowForTooth) {
      this.selectedRowForTooth.tD_TOOTH_NUMBER = '';
      // CẬP NHẬT: Trả số lượng dòng về 1 khi không chọn chiếc răng nào
      this.selectedRowForTooth.tD_QUANTITY = 1;
      this.onQuantityChange(this.selectedRowForTooth);
    }
    this.closeToothChart();
  }
  openReceiptModal(): void {
    this.createTransactionModal.transactionForm.fT_TYPE = 1;
    this.createTransactionModal.transactionForm.fT_EXM_ID = this.examination.exM_ID;
    this.createTransactionModal.selectedExm = this.examination.exM_ID;
    this.createTransactionModal.transactionForm.notes = this.examination.exM_CODE;
    this.createTransactionModal.transactionForm.patienT_ID = this.examination.exM_PATIENT_ID;
    this.createTransactionModal.selectedPatient = this.examination.exM_PATIENT_ID;
    this.createTransactionModal.transactionForm.categorY_ID = '1';
    this.createTransactionModal.selectedCategory = '1';
    this.createTransactionModal.show();
  }
  goBack(): void {
    this._router.navigate(['/app/admin', 'customer-list']);
  }
  getRouteParam(key: string): any {
    return (this.activeRoute.params as any).value[key];
  }

  getCustomer(id: string): void {
    this._customerService
      .cM_CUSTOMER_GetById(id)
      .pipe(finalize(() => (this.alertVisible = true)))
      .subscribe((result) => {
        this.patientInfo = result;
        this.examination.exM_PATIENT_ID = id;
      });
  }
  getTypeService(): void {
    this._serviceTypeService
      .cM_SERVICES_GetAll()
      .pipe(finalize(() => (this.alertVisible = true)))
      .subscribe((result) => {
        this.serviceTypes = result;
      });
  }
  getService(): void {
    this._serviceService
      .cM_SERVICES_GetByType('', '')
      .pipe(finalize(() => (this.alertVisible = true)))
      .subscribe((result) => {
        this.cachedServices = result;
      });
  }
  getDoctor(): void {
    this._employeeService.cM_EMPLOYEE_DROPDOWNLIST('BS').subscribe(res => {
      this.listDoctors = res;
      if (!this.selectedDoctor) {
        this.selectedDoctor = this.examination.exM_DOCTOR_ID = this.listDoctors.length > 0
          ? this.listDoctors.reduce((max, current) =>
            current.emP_NO > max.emP_NO ? current : max
          ).emP_ID
          : '';
      }
    });
  }
  getPaymentLogs(): void {
    this._transactionService.fIN_TRANSACTION_GetLogByExm(this.examination.exM_ID).subscribe(res => {
      this.paymentLogs = res;
    });
  }
  hideAlert(): void {
    this.alertVisible = false;
  }
  onQuantityChange(item: ExtendedTreatmentDetail): void {
    if (!item.tD_QUANTITY || item.tD_QUANTITY < 1) item.tD_QUANTITY = 1;
    this.executeRowFinancialCalculation(item, 'QUANTITY');
  }
  onDiscountValueChange(item: ExtendedTreatmentDetail, value: string): void {
    item.discountValue = this.parseFormattedNumber(value);
    this.executeRowFinancialCalculation(item, 'DISCOUNT');
  }

  // Khi thay đổi loại giảm giá dòng (% <-> VND)
  onDiscountTypeChange(item: ExtendedTreatmentDetail): void {
    item.discountValue = 0;
    item.tD_DISCOUNT_AMOUNT = 0;
    this.executeRowFinancialCalculation(item, 'DISCOUNT');
  }
  // Khi sửa trực tiếp ô "Giá sau giảm" trên lưới
  onFinalPricePerUnitChange(item: ExtendedTreatmentDetail, value: string): void {
    item.tD_FINAL_PRICE_PER_UNIT = this.parseFormattedNumber(value);
    this.executeRowFinancialCalculation(item, 'FINAL_PER_UNIT');
  }


  onStatusChange(item: ExtendedTreatmentDetail): void {
    if (item.tD_STATUS !== 0) {
      // Tự động đóng panel giảm giá dòng nếu dòng đó chuyển trạng thái sang Đang điều trị/Hoàn tất/Ngưng
      item.showDiscountPanel = false;
    }
    else item.showDiscountPanel = true;
  }
  toggleDiscountPanel(item: ExtendedTreatmentDetail, event: Event): void {
    event.stopPropagation(); // Ngăn sự kiện click lan ra ngoài làm đóng panel ngay lập tức

    // Chỉ cho phép mở khi ở trạng thái Chưa điều trị (0)
    if (+item.tD_STATUS === 0) {
      // Đóng tất cả các panel khác trước khi mở panel này (tùy chọn)
      this.treatmentDetails.forEach(d => {
        if (d !== item) d.showDiscountPanel = false;
      });

      item.showDiscountPanel = !item.showDiscountPanel;
    }
  }
  OnSetCreateDT(): void {
    const today = new Date();
    this.maxCurrentDate = today.toISOString().split('T')[0];

    // 2. Nếu là tạo mới: Mặc định lấy ngày hiện tại
    // Nếu là chế độ chỉnh sửa (Edit mode): Đổ dữ liệu cũ từ API vào
    if (this.examination && this.examination.exM_DATE) {
      this.rawCreationDate = new Date(this.examination.exM_DATE);
      this.invoiceCreationDate = this.rawCreationDate.toISOString().split('T')[0];
    } else {
      this.rawCreationDate = today;
      this.invoiceCreationDate = this.maxCurrentDate;

      // Đồng bộ vào object gốc ngay khi khởi tạo
      if (this.examination) {
        this.examination.exM_DATE = today.toString(); // Hoặc chuỗi ISO tùy Backend nhận định dạng nào
      }
    }
  }
  onCreationDateChange(newDateStr: string): void {
    if (!newDateStr) return;

    // Đổi về kiểu Date để gán vào Entity dữ liệu phiếu khám gửi lên API
    const selectedDate = new Date(newDateStr);

    // Đặt giờ/phút/giây theo thời gian hiện tại để tránh lỗi mốc giờ hệ thống 00:00
    const now = new Date();
    selectedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

    this.examination.exM_DATE = selectedDate.toString();
    console.log('Ngày tạo phiếu đã được điều chỉnh lùi về:', selectedDate);
  }

  onGridPriceRawChange(rawValue: string, item: ExtendedTreatmentDetail): void {
    if (!item) return;
    const cleanNumber = Number(String(rawValue).replace(/[^0-9]/g, '')) || 0;
    item.tD_UNIT_PRICE = cleanNumber;
    item.displayPrice = cleanNumber.toLocaleString('en-US');
    this.executeRowFinancialCalculation(item, 'UNIT_PRICE');
  }

  // Khi rê chuột ra ngoài ô đơn giá
  onGridPriceBlur(item: any): void {
    if (item) delete item.displayPrice;
  }

  toggleAdminBypass(): void {
    this.isAdminBypass = !this.isAdminBypass;
    if (this.isAdminBypass) {
      this.notify.info(this.l('Đã mở khóa toàn bộ lịch sử giao dịch dưới quyền Quản trị viên.'));
    }
  }
  editLog(log: FIN_TRANSACTION_ENTITY): void {
    this.createTransactionModal.transactionForm = log;
    this.createTransactionModal.selectedCategory = log.categorY_ID;
    this.createTransactionModal.selectedExm = log.fT_EXM_ID;
    this.createTransactionModal.show(log);
    this.isAdminBypass = false;
  }

  deleteLog(log: any, index: number): void {
    this.message.confirm(
      this.l('Bạn có chắc chắn muốn xóa lượt thanh toán trị giá {0} đ này?', this.formatNumber(log.totaL_AMOUNT)),
      this.l('Cảnh báo hệ thống'),
      (isConfirmed) => {
        if (isConfirmed) {
          this.saving = true;

          this._transactionService.fIN_TRANSACTION_Del(log.fT_ID, this.appSession.user.userName).subscribe({
            next: (res) => {
              
              if (res && res.result === '0') {
                this._notifyService.success('Xóa chứng từ và cập nhật công nợ thành công!');

                this.loadData();
              } else {
                this._notifyService.error(res.errorDesc || 'Xóa thất bại, vui lòng thử lại!');
              }
              this.saving = false;
            },
            error: (err) => {
              this.saving = false;
              this._notifyService.error('Có lỗi hệ thống xảy ra khi kết nối API xóa!');
              console.error(err);
            }
          });
        }
      }
    );
  }
  formatNumber(value: number | undefined | null): string {
    if (value === undefined || value === null) {
      return '';
    }

    // Chuyển số về dạng chuỗi và dùng Regex để chèn dấu phẩy mỗi 3 chữ số từ phải qua
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  private parseFormattedNumber(value: string | number): number {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;

    // Xóa tất cả dấu phẩy trong chuỗi định dạng xxx,xxx,xxx
    const cleanString = value.toString().replace(/,/g, '');
    const parsed = parseInt(cleanString, 10);

    return isNaN(parsed) ? 0 : parsed;
  }
  private mergeSelectedTeeth(newTeeth: number[]): void {
    if (!this.selectedRowForTooth) return;

    const currentTeeth = this.selectedRowForTooth.tD_TOOTH_NUMBER
      ? this.selectedRowForTooth.tD_TOOTH_NUMBER.split(',').map(t => parseInt(t.trim())).filter(t => !isNaN(t))
      : [];

    const resultSet = new Set([...currentTeeth, ...newTeeth]);
    const resultArr = Array.from(resultSet).sort((a, b) => a - b);

    this.selectedRowForTooth.tD_TOOTH_NUMBER = resultArr.map(t => t.toString()).join(', ');

    // CẬP NHẬT: Tự động đồng bộ số lượng dòng theo tổng số răng sau khi chọn hàng loạt
    this.selectedRowForTooth.tD_QUANTITY = resultArr.length > 0 ? resultArr.length : 1;

    // Tính toán lại tài chính dựa trên số lượng mới cập nhật
    this.onQuantityChange(this.selectedRowForTooth);
  }

}
