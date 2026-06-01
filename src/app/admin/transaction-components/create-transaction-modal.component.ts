import { Component, EventEmitter, Injector, Output, ViewChild } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CM_CUSTOMER_ENTITY, CustomerServiceProxy, ExaminationServiceProxy, FIN_TRANSACTION_ENTITY, MED_EXAMINATION_ENTITY, TransactionServiceProxy } from '@shared/service-proxies/service-proxies';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { DateTime } from 'luxon';
import { BsModalService } from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'createTransactionModal',
    templateUrl: './create-transaction-modal.component.html',
    styleUrls: ['./create-transaction-modal.component.scss']
})
export class CreateTransactionModalComponent extends AppComponentBase {
    @ViewChild('createModal', { static: true }) modal!: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();


    active = false;
    saving = false;

    oldTotalAmount = 0;
    oldExmId = '';

    transactionForm: FIN_TRANSACTION_ENTITY = new FIN_TRANSACTION_ENTITY();

    // Mock Data danh mục (Trong thực tế bạn sẽ inject Service vào constructor để gọi từ DB)
    categories: any[] = [];
    allCategories = [
        { id: '1', name: 'Thu tiền điều trị theo phiếu khám', isInflow: true },
        { id: '2', name: 'Thu tiền đặt cọc giữ chỗ dịch vụ', isInflow: true },
        { id: '3', name: 'Thu thanh lý tài sản cố định', isInflow: true },
        { id: '4', name: 'Thu các khoản thu nhập bằng tiền khác', isInflow: true },

        { id: '5', name: 'Chi mua vật tư y tế tiêu hao', isInflow: false },
        { id: '6', name: 'Chi lương, thưởng và phụ cấp nhân sự', isInflow: false },
        { id: '7', name: 'Chi ứng lương nhân sự', isInflow: false },
        { id: '8', name: 'Chi phí sửa chữa và bảo dưỡng thiết bị', isInflow: false },
        { id: '9', name: 'Chi phí điện, nước và internet quầy hành chính', isInflow: false },
        { id: '10', name: 'Chi mua công cụ, dụng cụ và thiết bị nha khoa', isInflow: false },
        { id: '11', name: 'Chi trả tiền Labo (Phục hình răng)', isInflow: false },
        { id: '12', name: 'Chi trả tiền rác thải y tế và môi trường', isInflow: false },
        { id: '13', name: 'Chi phí tiếp khách và đối ngoại', isInflow: false },
        { id: '14', name: 'Chi phí marketing và quảng cáo', isInflow: false },
        { id: '15', name: 'Chi mua văn phòng phẩm và tạp vụ', isInflow: false },
        { id: '16', name: 'Chi hoàn trả tiền cọc/tiền điều trị cho khách hàng', isInflow: false },
        { id: '17', name: 'Chi các khoản chi phí bằng tiền khác', isInflow: false }
    ];



    examinations: any[] = [];
    totalPaidItem = 0;
    allExaminations: MED_EXAMINATION_ENTITY[] = []
    customers: CM_CUSTOMER_ENTITY[] = []
    selectedPatient = '';
    selectedExm = '';
    selectedCategory = '';

    // Đối tượng theo dõi trạng thái công nợ hiện thời
    currentDebtInfo = {
        totalCost: 0,
        totalPaid: 0,
        remainingDebt: 0
    };
    constructor(injector: Injector,
        private _modalService: BsModalService,
        private _customerService: CustomerServiceProxy,
        private _examinationService: ExaminationServiceProxy,
        private _transactionService: TransactionServiceProxy
    ) {
        super(injector,);
        console.log(this);
    }

    // Hàm kích hoạt hiển thị Modal từ trang quản lý danh sách (Index)
    show(id?: FIN_TRANSACTION_ENTITY): void {
        this.active = true;
        this.saving = false;
        this.modal.show();

        if (!id) {
            const now = new Date();
            const tzOffset = now.getTimezoneOffset() * 60000; // Tính số miliseconds chênh lệch múi giờ
            const vietnamTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);
            this.transactionForm.documenT_DATE = vietnamTime;
            this.resetDebtInfo();
        } else {
            if (this.transactionForm.documenT_DATE) {
                const dateObj = new Date(this.transactionForm.documenT_DATE);

                // Trích xuất cấu trúc để ghép thành chuỗi YYYY-MM-DDThh:mm
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                const hours = String(dateObj.getHours()).padStart(2, '0');
                const minutes = String(dateObj.getMinutes()).padStart(2, '0');

                this.transactionForm.documenT_DATE = `${year}-${month}-${day}T${hours}:${minutes}`;
                this.oldExmId = this.transactionForm.fT_EXM_ID;
                this.oldTotalAmount = this.transactionForm.totaL_AMOUNT;
            }
        }
        this.filterCategories(1);
        this.loadDropdowns();
    }

    onShown(): void {
        this.filterCategories(this.transactionForm.fT_TYPE);
    }

    // Chuyển đổi qua lại giữa Tab Thu và Tab Chi trên giao diện
    changeTransactionType(type: number): void {
        this.transactionForm.fT_TYPE = type;
        this.transactionForm.categorY_ID = undefined; // Reset lý do thu chi cũ

        // Cấu hình lại bộ lọc lý do tương ứng dòng tiền
        this.filterCategories(1);

        // Nếu chuyển sang phiếu Chi, mặc định không cần ràng buộc công nợ phiếu khám bệnh
        if (type === 2) {
            this.transactionForm.fT_EXM_ID = null;
            this.resetDebtInfo();
        }
    }



    // Khi chọn một Phiếu khám cụ thể -> Tính toán lũy kế tiền và công nợ thời gian thực hiển thị lên Card Công Nợ
    onExaminationChange(item: any): void {
    if (!item) {
        this.resetDebtInfo();
        return;
    }

    const exam = this.allExaminations.find(e => e.exM_ID === item);
    if (!exam) return;

    this.selectedPatient = exam.exM_PATIENT_ID;

    // --- TRƯỜNG HỢP 1: THÊM MỚI CHỨNG TỪ (fT_ID trống) ---
    if (!this.transactionForm.fT_ID) {
        if (this.transactionForm.fT_TYPE == 1) { // Phiếu thu
            this.currentDebtInfo.totalCost = exam.exM_FINAL_AMOUNT || 0;
            this.currentDebtInfo.totalPaid = exam.totaL_PAID || 0;
            this.currentDebtInfo.remainingDebt = this.currentDebtInfo.totalCost - this.currentDebtInfo.totalPaid;

            // Gợi ý luôn số tiền thu lần này bằng chính số tiền còn nợ
            this.transactionForm.totaL_AMOUNT = this.currentDebtInfo.remainingDebt > 0 ? this.currentDebtInfo.remainingDebt : 0;
        }
    } 
    // --- TRƯỜNG HỢP 2: SỬA CHỨNG TỪ (fT_ID đã tồn tại) ---
    else {
        this.currentDebtInfo.totalCost = exam.exM_FINAL_AMOUNT || 0;

        // Nếu người dùng giữ nguyên phiếu khám cũ để sửa tiền
        if (item === this.oldExmId) {
            if (this.transactionForm.fT_TYPE == 1) { // Bản chất là phiếu thu
                // Lũy kế thực tế của các phiếu khác = Tổng đã trả trừ đi số tiền cũ của chính nó
                const paidByOtherTransactions = (exam.totaL_PAID || 0) - this.oldTotalAmount;
                
                this.currentDebtInfo.totalPaid = paidByOtherTransactions;
                this.currentDebtInfo.remainingDebt = this.currentDebtInfo.totalCost - paidByOtherTransactions;
            }
        } 
        // Nếu người dùng đổi sang chọn hẳn một phiếu khám hoàn toàn khác trên form sửa
        else {
            // Đối với phiếu khám mới được chọn, số tiền của chứng từ hiện tại chưa hề tác động vào nó
            this.currentDebtInfo.totalPaid = exam.totaL_PAID || 0;
            this.currentDebtInfo.remainingDebt = this.currentDebtInfo.totalCost - this.currentDebtInfo.totalPaid;
            
            this.transactionForm.totaL_AMOUNT = this.currentDebtInfo.remainingDebt > 0 ? this.currentDebtInfo.remainingDebt : 0;
        }
    }
}
    onAmountInput(event: any): void {
        const rawValue = event.target.value;
        const numericValue = this.parseFormattedNumber(rawValue);

        // Thêm dấu phẩy hiển thị lại ngay trên ô nhập
        event.target.value = this.formatNumber(numericValue);

        // Gán số sạch nguyên bản vào thực thể Form để tính toán
        this.transactionForm.totaL_AMOUNT = numericValue;
    }
    parseFormattedNumber(value: string | number): number {
        if (value === null || value === undefined) return 0;
        if (typeof value === 'number') return value;

        const cleanString = value.toString().replace(/,/g, '');
        const parsed = parseInt(cleanString, 10);

        return isNaN(parsed) ? 0 : parsed;
    }

    formatNumber(value: number): string {
        if (!value) return '';
        return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    resetDebtInfo(): void {
        this.currentDebtInfo = { totalCost: 0, totalPaid: 0, remainingDebt: 0 };
    }

    // XỬ LÝ LƯU DỮ LIỆU CHỨNG TỪ XUỐNG CƠ SỞ DỮ LIỆU
    save(): void {
        // Kiểm tra tính hợp lệ logic trước khi Submit
        if (this.transactionForm.fT_TYPE === 1 && this.transactionForm.fT_EXM_ID) {
            if (this.transactionForm.totaL_AMOUNT > this.currentDebtInfo.remainingDebt) {
                this.notify.warn(this.l('Số tiền thu đợt này không được vượt quá số dư công nợ hiện tại của phiếu khám!'));
                return;
            }
        }
        if (this.transactionForm.fT_TYPE === 2 && this.transactionForm.fT_EXM_ID) {
            if (this.transactionForm.totaL_PAID > this.currentDebtInfo.totalPaid) {
                this.notify.warn(this.l('Số tiền chi đợt này không được vượt quá số tiền đã thu hiện tại của phiếu khám!'));
                return;
            }
        }
        if (!this.transactionForm.methoD_ID) {
            this.notify.warn(this.l('Vui lòng chọn hình thức thanh toán!'));
            return;
        }

        this.saving = true;

        this.transactionForm.makeR_ID = this.appSession.user.userName?.toString();
        this.transactionForm.categorY_ID = this.selectedCategory;
        this.transactionForm.patienT_ID = this.selectedPatient;
        this.transactionForm.fT_EXM_ID = this.selectedExm;
        if (this.transactionForm.fT_ID) {
            this._transactionService
                .fIN_TRANSACTION_Upd(this.transactionForm)
                .pipe(finalize(() => (this.saving = false)))
                .subscribe((response) => {
                    if (response.result == '0') {
                        this.notify.info(this.l('SavedSuccessfully'));
                        this.close();
                        this.modalSave.emit(null);
                    }
                    else {
                        this.notify.error(this.l('Cập Nhật Thất Bại! ') + ': ' + response.errorDesc);
                    }
                });
        }
        else {
            this._transactionService
                .fIN_TRANSACTION_Ins(this.transactionForm)
                .pipe(finalize(() => (this.saving = false)))
                .subscribe((response) => {
                    if (response.result == '0') {
                        this.notify.info(this.l('SavedSuccessfully'));
                        this.close();
                        this.modalSave.emit(null);
                    }
                    else {
                        this.notify.error(this.l('Thêm Thất Bại! ') + ': ' + response.errorDesc);
                    }
                });
        }
    }
    printOnly(): void {
        // Chờ 100ms để Angular đồng bộ chắc chắn dữ liệu từ ô gõ ra mẫu in ngầm
        setTimeout(() => {
            window.print();
        }, 100);
    }

    onDelete(): void {
        this.message.confirm(
            this.l('Bạn có chắc chắn muốn hủy bỏ chứng từ tài chính này? Hệ thống sẽ hoàn tác lại toàn bộ tiền lũy kế.', this.transactionForm.fT_ID),
            this.l('Cảnh báo hệ thống'),
            (isConfirmed) => {
                if (isConfirmed) {
                    // Gọi API xóa: this._financeServiceProxy.delete(id).subscribe(() => { ... });
                }
            }
        );
    }

    close(): void {
        this.active = false;
        // this.transactionForm.resetForm();
        this.modal.hide();
    }

    onTypeChange(type: number): void {
        this.transactionForm.fT_TYPE = type;
        this.selectedCategory = '';
        // Reset lại ô lý do đã chọn về undefined để bắt buộc người dùng chọn lại lý do mới
        this.transactionForm.categorY_ID = undefined;

        // Tiến hành lọc mảng
        this.filterCategories(type);
    }
    private filterCategories(type: number): void {
        if (type === 1) {
            // Nếu là Phiếu Thu (fT_TYPE = 1) -> Lấy các loại có isInflow = true
            this.categories = this.allCategories.filter(cat => cat.isInflow === true);
        } else {
            // Nếu là Phiếu Chi (fT_TYPE = 2) -> Lấy các loại có isInflow = false
            this.categories = this.allCategories.filter(cat => cat.isInflow === false);
        }
    }

    private loadDropdowns(id?: string): void {
        this._customerService.cM_CUSTOMER_DROPDOWNLIST().subscribe(res => this.customers = res);
        this._examinationService.mED_EXAMINATION_DROPDOWNLIST().subscribe(res => {
            this.allExaminations = res
            if (this.allExaminations && this.transactionForm.fT_EXM_ID) {
                this.onExaminationChange(this.transactionForm.fT_EXM_ID);
            }
        });
    }
}