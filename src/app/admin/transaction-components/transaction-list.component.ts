/* eslint-disable eol-last */
import { Component, Injector, OnInit, ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { LazyLoadEvent } from 'primeng/api';
import { Paginator } from 'primeng/paginator';
import { finalize, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Table } from 'primeng/table';
import { Subject } from 'rxjs';
import { FIN_TRANSACTION_ENTITY, FinancialDashboardDto, TransactionServiceProxy } from '@shared/service-proxies/service-proxies';
import { CreateTransactionModalComponent } from './create-transaction-modal.component';



@Component({
  templateUrl: './transaction-list.component.html',
  animations: [appModuleAnimation()],
  styleUrls: ['./transaction-list.component.scss']
})
export class TransactionListComponent extends AppComponentBase implements OnInit {

  @ViewChild('paginator', { static: true }) paginator!: Paginator;
  @ViewChild('dataTable') dataTable!: Table;
  @ViewChild('createTransactionModal', { static: true }) createTransactionModal!: CreateTransactionModalComponent;
  // Trạng thái xử lý màn hình (Loading States)
  isTableLoading = false;
  isDashboardLoading = false;
  selectedId: string | null = null;
  selectedTransaction: any;

  // CHUYỂN ĐỔI SANG ĐỐI TƯỢNG ENTITY DUY NHẤT THEO YÊU CẦU
  filterInput: FIN_TRANSACTION_ENTITY = new FIN_TRANSACTION_ENTITY();

  // Luồng quản lý riêng cho ô nhập ký tự tìm kiếm để xử lý DebounceTime
  searchSubject: Subject<string> = new Subject<string>();

  dashboardData: FinancialDashboardDto = new FinancialDashboardDto();
  transactions: FIN_TRANSACTION_ENTITY[] = [];
  datePresetMode: 'today' | 'week' | 'month' | 'year' | 'all' | 'custom' = 'today';

  constructor(
    injector: Injector,
    private _transactionService: TransactionServiceProxy
  ) {
    super(injector);
    console.log(this);
  }

  ngOnInit(): void {
    // 1. Khởi tạo giá trị bộ lọc mặc định ban đầu
    this.resetFilters();

    // 2. Tải toàn bộ số liệu màn hình lần đầu
    this.refreshAllData();

    // 3. Đăng ký lắng nghe luồng hoãn phím (Debounce) cho ô gõ từ khóa
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(keyword => {
      this.filterInput.searcH_KEYWORD = keyword; // Đã cập nhật thành search_KEYWORD
      this.refreshAllData();
    });
  }
  onSearchChange(keyword: string): void {
    this.searchSubject.next(keyword);
  }
  onFilterChange(): void {
    this.refreshAllData();
  }

  resetFilters(): void {
    this.filterInput.searcH_KEYWORD = '';
    this.filterInput.fT_TYPE = 0;
    this.filterInput.methoD_ID = 0;

    this.datePresetMode = 'today';
    this.applyDatePreset('today');
  }
  onDatePresetChange(): void {
    if (this.datePresetMode !== 'custom') {
      this.applyDatePreset(this.datePresetMode);
    }
    // Thực hiện reload dữ liệu ngay lập tức
    this.refreshAllData();
  }

  create(): void {
    this.notify.info(this.l('Mở chức năng lập phiếu giao dịch tài chính mới'));
  }
  edit(item: FIN_TRANSACTION_ENTITY): void {
    if (!item) return;
    
    this.createTransactionModal.transactionForm = item;
    this.createTransactionModal.selectedCategory = item.categorY_ID;
    this.createTransactionModal.selectedExm = item.fT_EXM_ID;
    this.createTransactionModal.show(item);
  }
  delete(item: any): void {
    if (!item || !item.fT_ID) return;

    const documentCode = `#${item.fT_ID}`;
    const transactionTypeName = item.fT_TYPE === 1 ? 'Phiếu Thu' : 'Phiếu Chi';

    // Sử dụng Message Service chuẩn của ABP để hiển thị hộp thoại xác nhận Luxury
    this.message.confirm(
      this.l('Bạn có chắc chắn muốn hủy bỏ {0} {1} này không?', transactionTypeName, documentCode),
      this.l('Xác nhận hoàn tác dòng tiền'),
      (isConfirmed) => {
        if (isConfirmed) {
          // Kích hoạt trạng thái tải để khóa màn hình trong lúc gọi API xóa
          this.isTableLoading = true;

          // Triệu gọi Service Proxy của ABP đẩy xuống Backend để thực thi Store Procedure xóa/hủy
          this._transactionService.fIN_TRANSACTION_Del(item.fT_ID, this.appSession.user.userName)
            .pipe(
              finalize(() => {
                this.isTableLoading = false;
              })
            )
            .subscribe({
              next: () => {
                // 1. Thông báo thành công lên góc màn hình
                this.notify.success(this.l('Đã xóa bỏ chứng từ {0} thành công.', documentCode));

                // 2. Tiện ích UX: Nếu xóa đúng dòng đang được click chọn thì reset biến selectedId
                if (this.selectedId === item.fT_ID) {
                  this.selectedId = null;
                }

                // 3. Gọi hạt nhân để tái cấu trúc lại toàn bộ tiền tệ trên 3 thẻ Dashboard và bảng lưới
                this.refreshAllData();
              },
              error: (err) => {
                this.notify.error(this.l('Hệ thống gặp lỗi, không thể hủy bỏ chứng từ này.'));
                console.error('Delete Transaction API Error:', err);
              }
            });
        }
      }
    );
  }

  selectRow(id: string): void {
    this.selectedId = (this.selectedId === id) ? null : id;
  }

  exportExcel(): void {
    this.notify.success(this.l('Tải xuống tệp Excel thành công.'));
  }
  filterByPatient(patientId: string): void {
    if (!patientId) return;

    // Gán mã bệnh nhân vào ô tìm kiếm chính của bộ lọc
    this.filterInput.searcH_KEYWORD = patientId;
    this.filterInput.froM_DATE = undefined;
    this.filterInput.tO_DATE = undefined;
    this.datePresetMode = 'all';

    // Thông báo trải nghiệm người dùng bằng bộ tiện ích ABP
    this.notify.info(this.l('Đang lọc danh sách thu chi theo bệnh nhân: {0}', patientId));

    // Gọi hạt nhân làm mới toàn bộ luồng số liệu bảng và KPI
    this.refreshAllData();
  }

  refreshAllData(event?: LazyLoadEvent): void {
    // 1. Kích hoạt trạng thái tải (Loading Skeleton/Spinner) trên giao diện Luxury
    this.isDashboardLoading = true;
    this.isTableLoading = true;

    // 3. LUỒNG TIẾN TRÌNH 1: Triệu gọi API lấy số liệu 3 khối Dashboard (Thẻ Tổng thu, Tổng chi, Số dư)
    this._transactionService.fIN_TRANSACTION_GetDashboard(
      this.filterInput
    ).pipe(
      // Tự động tắt trạng thái quay loading của Dashboard khi có kết quả hoặc lỗi xảy ra
      finalize(() => this.isDashboardLoading = false)
    ).subscribe({
      next: (result: FinancialDashboardDto) => {
        this.dashboardData = result;
      },
      error: (err) => {
        this.notify.error(this.l('Không thể tải số liệu tổng quan Dashboard tài chính.'));
        console.error('Dashboard API Error:', err);
      }
    });


    const skipCount = event && event.first !== undefined ? event.first : this.primengTableHelper.getSkipCount(this.paginator, event);
    const maxResultCount = event && event.rows !== undefined ? event.rows : this.primengTableHelper.getMaxResultCount(this.paginator, event);

    this.filterInput.skipCount = skipCount;
    this.filterInput.maxResultCount = maxResultCount > 0 ? maxResultCount : 10;

    // 4. LUỒNG TIẾN TRÌNH 2: Triệu gọi API tìm kiếm danh sách chi tiết phiếu thu chi đổ lên Table Grid
    this._transactionService.fIN_TRANSACTION_Search(
      this.filterInput
    ).pipe(
      // Tự động tắt trạng thái quay loading của Bảng khi dữ liệu kết xuất xong
      finalize(() => this.isTableLoading = false)
    ).subscribe({
      next: (result) => {
        this.transactions = result.items ?? [];
        this.primengTableHelper.totalRecordsCount = result.totalCount;
        // Tiện ích UX: Tự động bỏ chọn dòng cũ nếu dòng đó không còn nằm trong kết quả tìm kiếm mới
        if (this.selectedId && !this.transactions.some(t => t.fT_ID === this.selectedId)) {
          this.selectedId = null;
        }
      },
      error: (err) => {
        this.notify.error(this.l('Không thể kết xuất danh sách phiếu thu chi chi tiết.'));
        console.error('Table Search API Error:', err);
      }
    });
  }
  openExaminationDetail(exmId: any): void {
    if (!exmId) {
        this.notify.warn(this.l('Giao dịch này không đính kèm liên kết hồ sơ điều trị gốc.'));
        return;
    }

    // Thiết lập đường dẫn động trỏ thẳng tới phân hệ examination-edit
    const url = `/app/admin/examination-edit/${exmId}`;
    
    // Sử dụng window.open với thuộc tính '_blank' để trình duyệt mở tab mới, bảo toàn màn hình sổ quỹ hiện tại
    window.open(url, '_blank');
}
  getTransactions(event: any): void {
    this.loadTransactionTable(event);
  }

  /**
      * API 1: Lấy số liệu 3 khối Dashboard tổng quan
      */
  private loadDashboardMetrics(): void {
    this.isDashboardLoading = true;

    this._transactionService.fIN_TRANSACTION_GetDashboard(
      this.filterInput
    ).pipe(
      // Tự động tắt trạng thái quay loading của Dashboard khi có kết quả hoặc lỗi xảy ra
      finalize(() => this.isDashboardLoading = false)
    ).subscribe({
      next: (result: FinancialDashboardDto) => {
        this.dashboardData = result;
      },
      error: (err) => {
        this.notify.error(this.l('Không thể tải số liệu tổng quan Dashboard tài chính.'));
        console.error('Dashboard API Error:', err);
      }
    });
  }

  /**
   * API 2: Lấy dữ liệu lưới danh sách phiếu thu chi chi tiết
   */
  private loadTransactionTable(event?: LazyLoadEvent): void {
    this.isTableLoading = true;
    const skipCount = event && event.first !== undefined ? event.first : this.primengTableHelper.getSkipCount(this.paginator, event);
    const maxResultCount = event && event.rows !== undefined ? event.rows : this.primengTableHelper.getMaxResultCount(this.paginator, event);

    this.filterInput.skipCount = skipCount;
    this.filterInput.maxResultCount = maxResultCount;

    this._transactionService.fIN_TRANSACTION_Search(
      this.filterInput
    ).pipe(
      // Tự động tắt trạng thái quay loading của Bảng khi dữ liệu kết xuất xong
      finalize(() => this.isTableLoading = false)
    ).subscribe({
      next: (result) => {
        this.transactions = result.items ?? [];
        // Tiện ích UX: Tự động bỏ chọn dòng cũ nếu dòng đó không còn nằm trong kết quả tìm kiếm mới
        if (this.selectedId && !this.transactions.some(t => t.fT_ID === this.selectedId)) {
          this.selectedId = null;
        }
      },
      error: (err) => {
        this.notify.error(this.l('Không thể kết xuất danh sách phiếu thu chi chi tiết.'));
        console.error('Table Search API Error:', err);
      }
    });
  }
  private applyDatePreset(mode: 'today' | 'week' | 'month' | 'year' | 'all'): void {
    const today = new Date();

    // Mốc kết thúc luôn luôn là cuối ngày hôm nay (23:59:59) để hứng trọn vẹn chứng từ trong ngày
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    switch (mode) {
      case 'today': {
        // Hôm nay: 00:00:00 -> 23:59:59
        const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
        this.filterInput.froM_DATE = startOfToday.toISOString();
        this.filterInput.tO_DATE = endOfToday.toISOString();
        break;
      }
      case 'week': {
        // Tuần này: Tính từ 00:00:00 Thứ Hai của tuần hiện tại
        const currentDay = today.getDay(); // 0: Chủ Nhật, 1: Thứ 2, ..., 6: Thứ 7
        const distanceToMonday = currentDay === 0 ? 6 : currentDay - 1; // Số ngày cần lùi về Thứ Hai

        const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - distanceToMonday, 0, 0, 0);
        this.filterInput.froM_DATE = monday.toISOString();
        this.filterInput.tO_DATE = endOfToday.toISOString();
        break;
      }

      case 'month': {
        // Tháng này: Tính từ 00:00:00 Ngày 1 của tháng hiện tại
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0);
        this.filterInput.froM_DATE = firstDayOfMonth.toISOString();
        this.filterInput.tO_DATE = endOfToday.toISOString();
        break;
      }

      case 'year': {
        // Năm này: Tính từ 00:00:00 Ngày 01/01 cho đến hết 23:59:59 Ngày 31/12 của năm đó
        const firstDayOfYear = new Date(today.getFullYear(), 0, 1, 0, 0, 0);
        const lastDayOfYear = new Date(today.getFullYear(), 11, 31, 23, 59, 59);
        this.filterInput.froM_DATE = firstDayOfYear.toISOString();
        this.filterInput.tO_DATE = lastDayOfYear.toISOString();
        break;
      }

      case 'all': {
        // Toàn bộ dữ liệu: Xóa trắng khoảng ngày để Store Procedure quét toàn bộ lịch sử sổ quỹ
        this.filterInput.froM_DATE = undefined;
        this.filterInput.tO_DATE = undefined;
        break;
      }
    }
  }

}