import { Component, Injector, OnInit } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CM_EMPLOYEE_ENTITY, EmployeeServiceProxy } from '@shared/service-proxies/service-proxies';
import * as moment from 'moment';
import { CalendarModule } from 'primeng/calendar';

@Component({
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss'],
  animations: [appModuleAnimation()],
})
export class EmployeeListComponent extends AppComponentBase implements OnInit {
  employeeList: any[] = []; // Chuyển sang dạng any[] để map động thuộc tính mở rộng (isSynced) linh hoạt
  isDrawerOpen = false;
  isEditMode = false;

  filterInput = new CM_EMPLOYEE_ENTITY();
  currentEmp = new CM_EMPLOYEE_ENTITY();

  constructor(
    injector: Injector,
    private _employeeService: EmployeeServiceProxy
  ) {
    super(injector);
    console.log(this);
  }

  ngOnInit(): void {
    // Khởi tạo bộ lọc ban đầu chuẩn dữ liệu không lọc
    this.filterInput.emP_ROLE = '';
    this.filterInput.synC_STATUS = undefined;
    this.loadData();
  }

  loadData(resetList = false) {
    this.primengTableHelper.showLoadingIndicator();
    
    if (resetList) {
      this.employeeList = [];
    }

    this.filterInput.skipCount = 0;
    this.filterInput.maxResultCount = 1000;
    
    this._employeeService.cM_EMPLOYEE_Search(this.filterInput).subscribe({
      next: (res: any) => {
        // Map dữ liệu chuẩn hóa kết quả từ Stored Procedure trả về
        this.employeeList = res.items || [];
      },
      error: (err) => this.notify.error('Lỗi tải dữ liệu nhân sự trên hệ thống')
    });
  }

  // Tự sinh Username không dấu chuẩn quy tắc: Nguyễn Hữu Tài -> tainh
  onNameChange() {
    if (!this.currentEmp.emP_NAME) {
      this.currentEmp.useR_NAME = '';
      return;
    }
    const unsigned = this.removeVietnameseTones(this.currentEmp.emP_NAME.toLowerCase().trim());
    const parts = unsigned.split(/\s+/);
    if (parts.length > 1) {
      const mainName = parts[parts.length - 1]; // Lấy phần tên chính
      const initials = parts.slice(0, parts.length - 1).map(p => p.charAt(0)).join(''); // Chữ cái đầu của họ và đệm
      this.currentEmp.useR_NAME = mainName + initials;
      this.currentEmp.email = `${this.currentEmp.useR_NAME}@gmail.com`; // Đổi sang email doanh nghiệp
    } else {
      this.currentEmp.useR_NAME = unsigned;
      this.currentEmp.email = `${unsigned}@gmail.com`;
    }
  }

  removeVietnameseTones(str: string) {
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd').replace(/Đ/g, 'D');
  }

  getInitials(name: string): string {
    if (!name) return 'NV';
    const tokens = name.trim().split(/\s+/);
    return tokens.length > 1 ? (tokens[0][0] + tokens[tokens.length - 1][0]).toUpperCase() : tokens[0][0].toUpperCase();
  }

  openDrawer(emp: any) {
    this.isDrawerOpen = true;
    if (emp) {
      this.isEditMode = true;
      // Khởi tạo bản sao chỉnh sửa để tránh ghi đè trực tiếp lên bảng lưới khi chưa bấm lưu
      this.currentEmp = { 
        ...emp, 
        // Xử lý chuyển đổi định dạng ngày tháng tương thích với thẻ input[type="date"]
        emP_DOB: emp.emP_DOB ? moment(emp.emP_DOB).format('YYYY-MM-DD') : '',
        iS_CREATE_USER: emp.isSynced, 
        email: emp.email || (emp.useR_NAME ? `${emp.useR_NAME}@thienphucdental.com` : '') 
      };
    } else {
      this.isEditMode = false;
      this.currentEmp = new CM_EMPLOYEE_ENTITY();
      this.currentEmp.emP_GENDER = undefined;
      this.currentEmp.emP_ROLE = undefined;
      this.currentEmp.emP_ROLE = undefined;
      this.currentEmp.iS_CREATE_USER = false;
    }
  }

  // MỞ KHÓA LUỒNG XỬ LÝ ĐỒNG BỘ TÀI KHOẢN NHANH QUA ICON SẤM SÉT ⚡
  executeQuickSync(emp: CM_EMPLOYEE_ENTITY) {
    // this.message.confirm(
    //   `Hệ thống sẽ tự động cấp tài khoản cho nhân sự [${emp.emP_NAME}]. Bạn có chắc chắn muốn thực hiện?`,
    //   'Xác nhận đồng bộ nhanh',
    //   (isConfirmed) => {
    //     if (isConfirmed) {
    //       // Tính toán Username tự động ngay lập tức tại luồng bấm nhanh bên ngoài lưới
    //       const unsigned = this.removeVietnameseTones(emp.emP_NAME.toLowerCase().trim());
    //       const parts = unsigned.split(/\s+/);
    //       let generatedUserName = unsigned;
    //       if (parts.length > 1) {
    //          generatedUserName = parts[parts.length - 1] + parts.slice(0, parts.length - 1).map(p => p.charAt(0)).join('');
    //       }

    //       const syncPayload = {
    //         emP_ID: emp.emP_ID,
    //         email: `${generatedUserName}@thienphucdental.com`,
    //         passworD_HASH: 'ThienPhuc@2026', // Mật khẩu mặc định hệ thống tự sinh bảo mật
    //         roleId: emp.emP_ROLE === 'DOCTOR' ? 2 : 3, // Tự động nhận diện Role phân quyền phù hợp
    //         makeR_ID: this.appSession.user.userName.toString()
    //       };

    //       this._employeeService.cM_EMPLOYEE_Sync(syncPayload).subscribe({
    //         next: (res: any) => {
    //           if (res.result === '1') {
    //             this.notify.success('Kích hoạt tài khoản nhân sự thành công');
    //             this.loadData(true);
    //           } else {
    //             this.message.error(`Đồng bộ thất bại: ${res.errorDesc}`);
    //           }
    //         },
    //         error: (err) => console.error('Lỗi API Hệ thống', err)
    //       });
    //     }
    //   }
    // );
  }

  closeDrawer() { 
    this.isDrawerOpen = false; 
  }

  openSyncQuick(emp: CM_EMPLOYEE_ENTITY) { 
    this.openDrawer(emp); 
    this.currentEmp.iS_CREATE_USER = true; 
  }

  deleteEmployee(id: string) {
    this.message.confirm(
      `Bạn có chắc chắn muốn ngừng hoạt động nhân sự [${id}] trên hệ thống?`,
      'Xác nhận xóa dữ liệu',
      (isConfirmed) => {
        if (isConfirmed) {
          this._employeeService.cM_EMPLOYEE_Del(id, this.appSession.user.userName.toString()).subscribe({
            next: (res: any) => {
              if (res.result === '1') {
                this.notify.success('Xóa hồ sơ nhân sự thành công');
                this.loadData(true);
              } else {
                this.message.error(`Lỗi xóa: ${res.errorDesc}`);
              }
            },
            error: (err) => console.error('Lỗi kết nối xóa mềm dữ liệu', err)
          });
        }
      }
    );
  }
  

  saveData() {
    this.currentEmp.makeR_ID = this.appSession.user.userName.toString();

    if (this.isEditMode) {
      this._employeeService.cM_EMPLOYEE_Upd(this.currentEmp).subscribe({
        next: (res: any) => {
          if (res.result === '1') {
            this.notify.success('Cập nhật thông tin nhân viên thành công');
            this.closeDrawer();
            this.loadData(true);
          } else {
            this.message.error(`Cảnh báo: ${res.errorDesc}`);
          }
        },
        error: (err) => console.error('Lỗi kết nối API Update', err)
      });
    } else {
      this._employeeService.cM_EMPLOYEE_Ins(this.currentEmp).subscribe({
        next: (res: any) => {
          if (res.result === '1') {
            this.notify.success('Thêm mới nhân sự Thiên Phúc thành công');
            this.closeDrawer();
            this.loadData(true);
          } else {
            this.message.error(`Cảnh báo: ${res.errorDesc}`);
          }
        },
        error: (err) => console.error('Lỗi kết nối API Insert', err)
      });
    }
  }
}