import { Component, EventEmitter, Injector, Output, ViewChild } from '@angular/core';
import { co } from '@node_modules/@fullcalendar/core/internal-common';
import { AppComponentBase } from '@shared/common/app-component-base';
import {
    SubscribableEditionComboboxItemDto,
    CM_CUSTOMER_ENTITY,
    CommonLookupServiceProxy,
    CustomerServiceProxy,
} from '@shared/service-proxies/service-proxies';
import { filter as _filter } from 'lodash-es';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'createCustomerModal',
    templateUrl: './create-customer-modal.component.html',
    styleUrls: ['./create-customer-modal.component.css'],
})
export class CreateCustomerModalComponent extends AppComponentBase {
    @ViewChild('createModal', { static: true }) modal!: ModalDirective;

    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;
    setRandomPassword = true;
    useHostDb = true;
    editions: SubscribableEditionComboboxItemDto[] = [];
    customer: CM_CUSTOMER_ENTITY= new CM_CUSTOMER_ENTITY();
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

    constructor(
        injector: Injector,
        private _commonLookupService: CommonLookupServiceProxy,
        private _customerService: CustomerServiceProxy
    ) {
        super(injector);
        console.log(this);
    }

    show() {
        this.active = true;
        this.init();
        this._commonLookupService.cM_ALLCODE_DROPDOWNLIST('PROVINCE','CITY_PROVINCE').subscribe((res) => {
            this.provinces = res;
            this.selectedCity = '28';
        });
        this._commonLookupService.cM_ALLCODE_DROPDOWNLIST('NAT','NATIONALITY').subscribe((res) => {
            this.nationalities = res;
        });
        this._commonLookupService.cM_ALLCODE_DROPDOWNLIST('WARD','28').subscribe((res) => {
                this.wards = res;
        });
        this.selectedWard = '71317009';
        this.selectedNationality = 'VN';
        this.modal.show();
    }

    onShown(): void {
        // this.enableScanner = false;
        // this.active = false;
        // document.getElementById('TenancyName').focus();
    }

    init(): void {
        this.customer = new CM_CUSTOMER_ENTITY();
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

    toggleCamera() {
    this.enableScanner = !this.enableScanner;
    }

    onCityChange(cityCode: any) {
        // Ví dụ: Load danh sách quận huyện dựa trên cityCode
        if (cityCode) {
            this.wards = [];
            this.selectedWard = '';
            this._commonLookupService.cM_ALLCODE_DROPDOWNLIST('WARD',cityCode).subscribe((res) => {
                this.wards = res;
            });
        } else {
            this.wards = [];
            this.selectedWard = '';
        }
        }

    save(): void {
        this.saving = true;

        this.customer.cuS_CITY = this.selectedCity;
        this.customer.cuS_WARD = this.selectedWard;
        this.customer.cuS_NATIONALITY = this.selectedNationality;
        this.customer.makeR_ID = this.appSession.user.userName?.toString();
        this.customer.creatE_DT = new Date() as any;
        this.customer.cuS_MEDICAL_HISTORY = this.concatMedicalHistory() + ', ' + this.customer.cuS_MEDICAL_HISTORY_NOTES;
        this._customerService
            .cM_CUSTOMER_Ins(this.customer)
            .pipe(finalize(() => (this.saving = false)))
            .subscribe((response) => {
                if(response.result == '0'){
                    this.notify.info(this.l('SavedSuccessfully'));
                    this.close();
                    this.modalSave.emit(null);
                }
                else{
                    this.notify.error(this.l('Thêm Thất Bại! ') + ': ' + response.errorDesc);
                }
            });
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
        isLoangXuong: 'Loãng xương'
    };

        return Object.keys(medicalMap)
            .filter(key => this.customer[key] === true)
            .map(key => medicalMap[key])
            .join(', ');
    }

    close(): void {
        this.active = false;
        this.tenantAdminPasswordRepeat = '';
        this.modal.hide();
    }
}
