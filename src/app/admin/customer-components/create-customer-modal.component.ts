import { Component, EventEmitter, Injector, Output, ViewChild, HostListener } from '@angular/core';
import { co } from '@node_modules/@fullcalendar/core/internal-common';
import { pipe } from '@node_modules/rxjs/dist/types/internal/util/pipe';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    SubscribableEditionComboboxItemDto,
    CM_CUSTOMER_ENTITY,
    CM_RELATIONSHIP_ENTITY,
    CommonLookupServiceProxy,
    CustomerServiceProxy,
    RelationshipServiceProxy,
} from '@shared/service-proxies/service-proxies';
import { filter as _filter } from 'lodash-es';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';
import { NgForm } from '@angular/forms';

export interface CM_CUSTOMER_SUGGEST_ENTITY extends CM_CUSTOMER_ENTITY {
    selectedRelType?: string;
    isDropdownOpen: boolean;
    isFamilyMember?: number;
}
@Component({
    selector: 'createCustomerModal',
    templateUrl: './create-customer-modal.component.html',
    styleUrls: ['./create-customer-modal.component.css'],
})
export class CreateCustomerModalComponent extends AppComponentBase {
    @ViewChild('createModal', { static: true }) modal!: ModalDirective;
    @ViewChild('tenantCreateForm', { static: false }) tenantCreateForm!: NgForm;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;
    setRandomPassword = true;
    useHostDb = true;
    editions: SubscribableEditionComboboxItemDto[] = [];
    customer: CM_CUSTOMER_ENTITY = new CM_CUSTOMER_ENTITY();
    isUnlimited = false;
    isSubscriptionFieldsVisible = false;
    isSelectedEditionFree = false;
    tenantAdminPasswordRepeat = '';
    enableScanner = true;
    selectedCity = '';
    provinces: any[] = [];
    selectedWard = '';
    wards: any[] = [];
    selectedNationality = '';
    nationalities: any[] = [];
    isAutoGenerate = true;
    isLoad = false;
    
    // Mảng hứng dữ liệu danh sách tìm kiếm được từ Số điện thoại trùng
    relatedCustomers: CM_CUSTOMER_SUGGEST_ENTITY[] = [];
    isRelationLoading = false;

    constructor(
        injector: Injector,
        private _commonLookupService: CommonLookupServiceProxy,
        private _customerService: CustomerServiceProxy,
        private _relationshipService: RelationshipServiceProxy
    ) {
        super(injector);
    }
    @HostListener('document:click', ['$event'])
    onDocumentClick(event: MouseEvent): void {
        // Nếu danh sách gợi ý đang trống, không cần xử lý
        if (!this.relatedCustomers || this.relatedCustomers.length === 0) return;

        // Kiểm tra xem vị trí click có nằm trong lòng một nút bấm Dropdown nào không
        const target = event.target as HTMLElement;
        const isClickInsideDropdown = target.closest('.luxury-dropdown-wrapper');

        // Nếu người dùng click ra hoàn toàn ngoài khu vực Dropdown -> Tắt toàn bộ menu đang mở
        if (!isClickInsideDropdown) {
            this.relatedCustomers.forEach(x => x.isDropdownOpen = false);
        }
    }

    show(id?: string): void {
        this.isLoad = true;
        this.relatedCustomers = [];
        (this.customer as any).relationList = [];
        (this.customer as any).familY_ID = null;

        if (id) {
            this._customerService.cM_CUSTOMER_GetById(id).subscribe((result) => {
                this.customer = result;
                this.selectedCity = this.customer.cuS_CITY || '';
                this.selectedWard = this.customer.cuS_WARD || '';
                this.selectedNationality = this.customer.cuS_NATIONALITY || '';
                (this.customer as any).cuS_DOB = new Date(result['cuS_DOB']);
                this.checkDuplicatePhone(this.customer.cuS_PHONE, this.customer.cuS_ID);
                this.refreshRelationList();
                this.loadDropdowns();
            });
        } else {
            this.init();
            this.loadDropdowns();
        }
        this.active = true;
        this.modal.show();
    }

    onShown(): void {
        // this.enableScanner = false;
        // this.active = false;
        // document.getElementById('TenancyName').focus();
    }

    init(): void {
        this.customer = new CM_CUSTOMER_ENTITY();
        this.customer.cuS_PHONE_OWNER = 'Chính chủ';
        this.selectedCity = this.customer.cuS_CITY = '28';
        this.selectedWard = this.customer.cuS_WARD = '71317009';
        this.selectedNationality = this.customer.cuS_NATIONALITY = 'VN';
        this.customer.cuS_ETHNICITY = 'Kinh';
        this.customer.creatE_DT = new Date() as any;
        this.customer.isHuyetAp = false;
        this.customer.isDongKinh = false;
        this.customer.isMauKhongDong = false;
        this.customer.isBenhTim = false;
        this.customer.isTieuDuongType1 = false;
        this.customer.isTieuDuongType2 = false;
        this.customer.isDiUng = false;
        this.customer.isSocPhanVe = false;
        this.customer.isStentVanh = false;
        this.customer.isDotQuy = false;
        this.customer.isLoangXuong = false;
    }



    onCityChange(cityCode: any) {
        if (cityCode) {
            this.wards = [];
            this.selectedWard = '';
            this._commonLookupService.cM_ALLCODE_DROPDOWNLIST('WARD', cityCode).subscribe((res) => {
                this.wards = res;
            });
        } else if (!this.isLoad) {
            this.wards = [];
            this.selectedWard = '';
        }
    }

    save(): void {
        this.saving = true;
        this.tenantCreateForm.form.markAllAsTouched();

        if (this.tenantCreateForm.form.invalid) {
            this.saving = false;
            return;
        }

        this.customer.cuS_CITY = this.selectedCity;
        this.customer.cuS_WARD = this.selectedWard;
        this.customer.cuS_NATIONALITY = this.selectedNationality;
        this.customer.makeR_ID = this.appSession.user.userName?.toString();
        this.customer.cuS_MEDICAL_HISTORY = this.concatMedicalHistory();
        
        if (this.customer.cuS_ID) {
            this.customer.makeR_ID = this.appSession.user.userName?.toString();
            this._customerService
                .cM_CUSTOMER_Upd(this.customer)
                .pipe(finalize(() => (this.saving = false)))
                .subscribe((response) => {
                    if (response.result == '0') {
                        this.notify.info(this.l('SavedSuccessfully'));
                        this.close();
                        this.modalSave.emit(null);
                    } else {
                        this.notify.error(this.l('Cập Nhật Thất Bại! ') + ': ' + response.errorDesc);
                    }
                });
        } else {
            this.customer.updatE_ID = this.appSession.user.userName?.toString();
            this._customerService
                .cM_CUSTOMER_Ins(this.customer)
                .pipe(finalize(() => (this.saving = false)))
                .subscribe((response) => {
                    if (response.result == '0') {
                        this.notify.info(this.l('SavedSuccessfully'));
                        this.close();
                        this.modalSave.emit(null);
                    } else {
                        this.notify.error(this.l('Thêm Thất Bại! ') + ': ' + response.errorDesc);
                    }
                });
        }
    }

    concatMedicalHistory(): string {
        const medicalMap = {
            isHuyetAp: 'Huyết áp',
            isDongKinh: 'Động kinh',
            isMauKhongDong: 'Máu không đông',
            isBenhTim: 'Bệnh tim',
            isTieuDuongType1: 'Đái tháo đường type 1',
            isTieuDuongType2: 'Đái tháo đường type 2',
            isDiUng: 'Dị ứng',
            isSocPhanVe: 'Sốc phản vệ',
            isStentVanh: 'Đặt stent ĐM vành',
            isDotQuy: 'Đột quỵ',
            isLoangXuong: 'Loãng xương',
            cuS_MEDICAL_HISTORY_NOTES: this.customer.cuS_MEDICAL_HISTORY_NOTES
        };

        const selectedFromCheckboxes = Object.keys(medicalMap)
            .filter(key => this.customer[key] === true)
            .map(key => medicalMap[key]);

        if (this.customer.cuS_MEDICAL_HISTORY_NOTES && this.customer.cuS_MEDICAL_HISTORY_NOTES.trim() !== '') {
            selectedFromCheckboxes.push(this.customer.cuS_MEDICAL_HISTORY_NOTES.trim());
        }

        return selectedFromCheckboxes.join(', ');
    }

    close(): void {
        this.active = false;
        this.tenantAdminPasswordRepeat = '';
        this.modal.hide();
    }
    changeTextCase(formatType: 'ABC' | 'Abc' | 'abc'): void {
        if (!this.customer || !this.customer.cuS_NAME) return;

        // Lấy chuỗi gốc hiện tại trong ô Input và dọn sạch khoảng trắng thừa
        const currentName = this.cleanWhitespace(this.customer.cuS_NAME);
        if (!currentName) return;

        switch (formatType) {
            case 'ABC':
                this.customer.cuS_NAME = currentName.toUpperCase();
                break;

            case 'abc':
                this.customer.cuS_NAME = currentName.toLowerCase();
                break;

            case 'Abc':
                this.customer.cuS_NAME = currentName
                    .toLowerCase()
                    .split(' ')
                    .filter(word => word.length > 0) // Loại bỏ các phần tử rỗng nếu người dùng lỡ gõ nhiều dấu cách
                    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');
                break;
        }
    }
    cleanWhitespace(value: string | null | undefined): string {
        if (!value) return '';
        return value.trim().replace(/\s+/g, ' ');
    }
    checkDuplicatePhone(phone: string, current_cus_id?: string): void {
        if (!phone) {
            this.relatedCustomers = [];
            return;
        }
        const phoneTrimmed = phone.trim();
        const phonePattern = /^(0[3|5|7|8|9])+([0-9]{8})$/;

        if (!phonePattern.test(phoneTrimmed)) {
            this.relatedCustomers = [];
            return;
        }

        if (!(this.customer as any).relationList) {
            (this.customer as any).relationList = [];
        }

        this._customerService.cM_CUSTOMER_CheckPhone(phone.trim(), current_cus_id)
            .subscribe((result: any) => {
                if (result && result.length > 0) {
                    if(!current_cus_id)
                        this.relatedCustomers = result.map(item => ({
                            ...item,
                            selectedRelType: '',
                            isDropdownOpen: false
                        }));
                    else{
                        this.relatedCustomers = result.map(item => ({
                            ...item,
                            selectedRelType: item['reL_TYPE'],
                            isDropdownOpen: false
                        }));
                    }
                    this.syncSearchStateWithDb();
                } else {
                    this.relatedCustomers = [];
                }
            });
    }

    isCustomerConnected(cusId: any): boolean {
        const list = (this.customer as any).relationList;
        if (!list) return false;
        return list.some((x: any) => x.relateD_CUS_ID === cusId || x.cuS_ID === cusId);
    }

    onSelectRole(rel: any, role: string): void {
        rel.selectedRelType = role;
        rel.isDropdownOpen = false;
    }

    connectCustomer(rel: any): void {
        if (!rel.selectedRelType) {
            this.notify.warn(this.l('Vui lòng chọn vai trò mối quan hệ trước khi kết nối.'));
            return;
        }

        if (!this.customer.cuS_ID) {
            this.notify.warn(this.l('Vui lòng lưu thông tin khách hàng hiện tại trước khi tạo liên kết!'));
            return;
        }

        const isFamilyRole = ['Cha', 'Mẹ', 'Con', 'Vợ/Chồng', 'Anh ruột', 'Chị ruột'].includes(rel.selectedRelType);

        if (isFamilyRole) {
            const payload = new CM_RELATIONSHIP_ENTITY
            payload.relateD_CUS_ID = rel.cuS_ID;
            payload.familY_ID = (this.customer as any).familY_ID || this.customer.cuS_ID;
            payload.reL_TYPE = rel.selectedRelType;
            payload.makeR_ID =  this.appSession.user.userName?.toString()
            // {
            //     p_CUS_ID: rel.cuS_ID,
            //     p_FAMILY_ID: (this.customer as any).familY_ID || this.customer.cuS_ID,
            //     p_FAMILY_ROLE: rel.selectedRelType,
            //     p_USER_ID: this.appSession.user.userName?.toString()
            // };

            this._relationshipService.cM_RELATIONSHIP_UpdateFamilyRole(payload).subscribe((res: any) => {
                if (res && res.result === '0') {
                    this.notify.success(this.l('Đã đưa khách hàng vào cụm hộ gia đình.'));
                    this.refreshRelationList();
                } else {
                    this.notify.error(res.errorDesc || this.l('Lỗi khi đồng bộ cụm gia đình.'));
                }
            });
        } else {
            // const payload = {
            //     p_CUS_ID: this.customer.cuS_ID,
            //     p_RELATED_CUS_ID: rel.cuS_ID,
            //     p_REL_TYPE: rel.selectedRelType,
            //     p_ACTION: 'CONNECT',
            //     p_USER_ID: this.appSession.user.userName?.toString()
            // };
            const payload = new CM_RELATIONSHIP_ENTITY
            payload.cuS_ID = this.customer.cuS_ID;
            payload.relateD_CUS_ID = rel.cuS_ID;
            payload.reL_TYPE = rel.selectedRelType;
            payload.action = 'CONNECT';
            payload.makeR_ID =  this.appSession.user.userName?.toString();

            this._relationshipService.cM_RELATIONSHIP_SaveSingle(payload).subscribe((res: any) => {
                if (res && res.result === '0') {
                    this.notify.success(this.l('Thiết lập mối quan hệ 1-1 thành công.'));
                    this.refreshRelationList();
                } else {
                    this.notify.error(res.errorDesc || this.l('Lỗi khi lưu quan hệ xã hội.'));
                }
            });
        }
    }
    disconnectCustomer(rel: any): void {
        const targetCusId = rel.cuS_ID || rel.relateD_CUS_ID;
        const targetName = rel.cuS_NAME || rel.cuS_NAME_TEMP;
        const currentRole = rel.selectedRelType || rel.reL_TYPE;

        if (!targetCusId) return;

        if (!confirm(`Bạn có chắc chắn muốn hủy mối quan hệ [${currentRole}] với khách hàng ${targetName}?`)) {
            return;
        }

        const isFamilyRole = ['Cha', 'Mẹ', 'Ba', 'Vợ/Chồng', 'Anh ruột', 'Chị ruột', 'Con', 'Con trai', 'Con gái', 'Em trai', 'Em gái', 'Thành viên gia đình', 'Gia đình'].includes(currentRole);

        if (isFamilyRole) {
            // const payload = {
            //     p_CUS_ID: targetCusId,
            //     p_USER_ID: this.appSession.user.userName?.toString()
            // };
            const payload = new CM_RELATIONSHIP_ENTITY
            payload.cuS_ID = targetCusId;
            payload.makeR_ID =  this.appSession.user.userName?.toString();

            this._relationshipService.cM_RELATIONSHIP_RemoveFromFamily(payload).subscribe((res: any) => {
                if (res && res.result === '0') {
                    this.notify.success(this.l('Đã gỡ thành viên khỏi hộ gia đình.'));
                    this.refreshRelationList();
                } else {
                    this.notify.error(res.errorDesc || this.l('Gỡ thành viên thất bại.'));
                }
            });
        } else {
            // const payload = {
            //     p_CUS_ID: this.customer.cuS_ID,
            //     p_RELATED_CUS_ID: targetCusId,
            //     p_REL_TYPE: currentRole,
            //     p_ACTION: 'DISCONNECT',
            //     p_USER_ID: this.appSession.user.userName?.toString()
            // };
            const payload = new CM_RELATIONSHIP_ENTITY
            payload.cuS_ID = this.customer.cuS_ID;
            payload.relateD_CUS_ID = targetCusId;
            payload.reL_TYPE = currentRole;
            payload.action = 'DISCONNECT';
            payload.makeR_ID =  this.appSession.user.userName?.toString();

            this._relationshipService.cM_RELATIONSHIP_SaveSingle(payload).subscribe((res: any) => {
                if (res && res.result === '0') {
                    this.notify.success(this.l('Đã gỡ bỏ mối quan hệ 1-1.'));
                    this.refreshRelationList();
                } else {
                    this.notify.error(res.errorDesc || this.l('Gỡ liên kết thất bại.'));
                }
            });
        }
    }

    refreshRelationList(): void {
        if (!this.customer || !this.customer.cuS_ID) return;

        this.isRelationLoading = true;

        this._relationshipService.cM_RELATIONSHIP_ById(this.customer.cuS_ID).subscribe({
            next: (res: any) => {
                if (res && res.resultList) {
                    (this.customer as any).relationList = res.resultList;

                    const familyNode = (this.customer as any).relationList.find(
                        (x: any) => x.familY_ID !== null && x.familY_ID !== ''
                    );
                    (this.customer as any).familY_ID = familyNode ? familyNode.familY_ID : null;

                    this.syncSearchStateWithDb();
                } else {
                    (this.customer as any).relationList = [];
                    (this.customer as any).familY_ID = null;
                    this.syncSearchStateWithDb();
                }
            },
            error: (err) => {
                console.error(err);
            },
            complete: () => {
                this.isRelationLoading = false;
            }
        });
    }
    
    formatPhoneOwnerOnBlur(): void {
        let val = this.customer.cuS_PHONE_OWNER;
        if (!val) {
            this.customer.cuS_PHONE_OWNER = '';
            return;
        }

        val = val.toLowerCase().trim();
        const formatted = val.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        this.customer.cuS_PHONE_OWNER = formatted;
    }

    openSelectCustomerModal(): void {
        // Mở modal chọn khách hàng (có thể là một component khác hoặc một thư viện modal)
        // Ví dụ: this.selectCustomerModal.show();
    }

    toggleDropdown(currentRel: any): void {
        const targetState = !currentRel.isDropdownOpen;
        this.relatedCustomers.forEach(x => x.isDropdownOpen = false);
        currentRel.isDropdownOpen = targetState;
    }
    
    private syncSearchStateWithDb(): void {
        const list = (this.customer as any).relationList;
        if (this.relatedCustomers && this.relatedCustomers.length > 0 && list) {
            this.relatedCustomers.forEach(searchedCus => {
                const matchInDb = list.find(
                    (dbRel: any) => dbRel.relateD_CUS_ID === searchedCus.cuS_ID || dbRel.cuS_ID === searchedCus.cuS_ID
                );

                if (matchInDb) {
                    searchedCus.selectedRelType = matchInDb.reL_TYPE;
                    searchedCus.isDropdownOpen = false;
                } else {
                    searchedCus.selectedRelType = '';
                }
            });
        }
    }

    private loadDropdowns(): void {
        this._commonLookupService.cM_ALLCODE_DROPDOWNLIST('PROVINCE', 'CITY_PROVINCE').subscribe(res => this.provinces = res);
        this._commonLookupService.cM_ALLCODE_DROPDOWNLIST('NAT', 'NATIONALITY').subscribe(res => this.nationalities = res);
        this._commonLookupService.cM_ALLCODE_DROPDOWNLIST('WARD', this.customer.cuS_CITY).subscribe(res => {
            this.wards = res;
            this.isLoad = false;
        });
    }
    
}
