import { Component, EventEmitter, Injector, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppointmentServiceProxy, CM_CUSTOMER_ENTITY,CM_EMPLOYEE_ENTITY, CustomerServiceProxy, EmployeeServiceProxy, MED_APPOINTMENT_ENTITY } from '@shared/service-proxies/service-proxies';
import { ModalDirective } from 'ngx-bootstrap/modal';

@Component({
    selector: 'createAppointmentModal',
    templateUrl: './create-appointment-modal.component.html',
    styleUrls: ['./create-appointment-modal.component.css']
})
export class CreateAppointmentModalComponent extends AppComponentBase {
    @ViewChild('createModal', { static: true }) modal!: ModalDirective;
    @Output() modalSave: EventEmitter<any> = new EventEmitter<any>();

    active = false;
    saving = false;
    appointmentForm!: FormGroup;
    // Data mẫu (Thực tế bạn sẽ gọi từ Service)
    listSlots = []; 
    listDoctors: Array<CM_EMPLOYEE_ENTITY> = new Array<CM_EMPLOYEE_ENTITY>();
    listAssistants: Array<CM_EMPLOYEE_ENTITY> = new Array<CM_EMPLOYEE_ENTITY>();
    staffs = [];
    today: string = new Date().toISOString().substring(0, 10);
    days: CalendarDay[] = [];
    currentMonthText = '';
    viewDate: Date = new Date();
    hours: string[] = [];
    minutes: string[] = [];
    selectedDoctor: string | null = null;
    selectedAssistant1: string | null = null;
    selectedAssistant2: string | null = null;
    customer: CM_CUSTOMER_ENTITY = new CM_CUSTOMER_ENTITY;
    isHidenAssistant = false;
    hour = '';
    minute = '';
    listExistingAppointments: MED_APPOINTMENT_ENTITY[] = [];

    constructor(injector: Injector,
        private FB: FormBuilder,
        private _appointmentService: AppointmentServiceProxy,
        private _customerService: CustomerServiceProxy,
        private _employeeService: EmployeeServiceProxy
    ) {
        super(injector);
        this.generateTimeOptions();

        this.initForm();
        console.log(this);
    }

    get rangeTimeDisplay(): string {
        const dateVal = this.appointmentForm.get('MED_DATE')?.value;
        const hour = parseInt(this.appointmentForm.get('HOUR')?.value || '0');
        const minute = parseInt(this.appointmentForm.get('MINUTE')?.value || '0');
        const duration = parseInt(this.appointmentForm.get('DURATION')?.value || '0');

        if (!dateVal) return '';

        // Xử lý ngày hiển thị dd/MM/yyyy
        const d = new Date(dateVal);
        const datePart = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;

        // Thời gian bắt đầu
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

        // Tính thời gian kết thúc
        const endTimeDate = new Date();
        endTimeDate.setHours(hour);
        endTimeDate.setMinutes(minute + duration);
        const endTime = `${endTimeDate.getHours().toString().padStart(2, '0')}:${endTimeDate.getMinutes().toString().padStart(2, '0')}`;

        return `${datePart} ${startTime} -> ${endTime}`;
    }
    get freeHours() {
        return this.hours.filter(hour => {
            // Kiểm tra xem giờ này có nằm trong bất kỳ lịch hẹn nào (APPOINTMENT_TIME) của bác sĩ không
            const isBusy = this.listExistingAppointments.some(app => 
            app.apP_DOC_ID === this.appointmentForm.get('DOCTOR_ID')?.value &&
            app.hour.startsWith(hour) // So khớp 2 chữ số đầu của giờ
            );
            return !isBusy; // Chỉ giữ lại những giờ không bận
        });
    }
    
    
    get canPrevMonth(): boolean {
        const now = new Date();
        // Nếu năm hiển thị > năm hiện tại => cho lùi
        if (this.viewDate.getFullYear() > now.getFullYear()) return true;
        
        // Nếu cùng năm nhưng tháng hiển thị > tháng hiện tại => cho lùi
        if (this.viewDate.getFullYear() === now.getFullYear() && 
            this.viewDate.getMonth() > now.getMonth()) return true;
            
        return false; // Còn lại là không cho lùi
    }

    initForm() {
        const now = new Date();
        this.appointmentForm = this.FB.group({
            MED_DATE: [this.today, Validators.required],
            HOUR: [now.getHours().toString().padStart(2, '0')],
            MINUTE: [now.getMinutes().toString().padStart(2, '0')],
            DURATION: [now.getSeconds().toString().padStart(2, '0')],
            MED_DOC_ID: [null, Validators.required],
            MED_CUST_ID: [null, Validators.required],
            MED_ASSISTANT_ID_1: [null],
            MED_ASSISTANT_ID_2: [null],
            MED_CONTENT: ['']
        });
        this.generateCalendar();
    }

    show(id?: string): void {
        this.active = true;
        this.appointmentForm.reset({
            MED_DATE: new Date().toISOString().substring(0, 10),
            DURATION: 45
        });
        this.loadDropdowns(id);
        this.modal.show();
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }

    save(): void {
        this.saving = true;
        // Gọi service lưu tại đây...
        this.saving = false;
    }

    onShown(): void { }

    loadExistingAppointments(): void {
        const medDate = this.appointmentForm.get('MED_DATE')?.value;
        const medDocId = this.appointmentForm.get('MED_DOC_ID')?.value;

        // Chỉ gọi API khi đã chọn cả bác sĩ và ngày
        if (medDate && medDocId) {
            const searchParam = new MED_APPOINTMENT_ENTITY();
            searchParam.apP_DATE = medDate;
            searchParam.apP_DOC_ID = medDocId;

            this._appointmentService.mED_APPOINTMENT_Search(searchParam)
                .subscribe(res => {
                    // Nếu res là null hoặc undefined, gán thành mảng rỗng []
                    this.listExistingAppointments = res.items??[]; ;
                }, error => {
                    // Nếu lỗi API, gán mảng rỗng để không bị lỗi filter trên giao diện
                    this.listExistingAppointments = [];
                });
        } else {
            this.listExistingAppointments = [];
        }
    }

    generateTimeOptions() {
        // Tạo mảng 24 giờ (00 - 23)
        for (let i = 6; i < 23; i++) {
            this.hours.push(i < 10 ? '0' + i : i.toString());
        }

        // Tạo mảng 60 phút (00 - 59)
        for (let i = 0; i < 60; i++) {
            this.minutes.push(i < 10 ? '0' + i : i.toString());
        }
    }

    generateCalendar() {
        const year = this.viewDate.getFullYear();
        const month = this.viewDate.getMonth();
        // Lấy ngày hiện tại và đặt giờ về 00:00:00 để so sánh chính xác ngày
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const selectedDateInForm = this.appointmentForm.get('MED_DATE').value;
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        this.days = [];
        
        // ... (logic tính startingDay và daysInMonth giữ nguyên) ...

        for (let i = 1; i <= daysInMonth; i++) {
            const dateToCheck = new Date(year, month, i);
            const dateString = `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
            
            this.days.push({
                value: i,
                date: dateToCheck,
                isActive: dateString === selectedDateInForm,
                // Vô hiệu hóa nếu ngày nhỏ hơn hôm nay
                isDisable: dateToCheck < today 
            });
        }
    }

    // Cập nhật hàm chọn ngày để chặn click vào ngày đã disable
    selectDate(day: any) {
        if (!day.value || day.isDisable) return; // Nếu bị disable thì thoát luôn, không cho chọn
        
        const d = day.date;
        const formatted = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        
        this.appointmentForm.patchValue({ MED_DATE: formatted });
        this.generateCalendar();
    }
    prevMonth() {
        if (!this.canPrevMonth) return; // Chặn logic lùi
        this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
        this.generateCalendar();
    }

    // Sang tháng kế tiếp
    nextMonth() {
        this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
        this.generateCalendar();
    }

    getDayName(dateString: string): string {
        if (!dateString) return '';
        const date = new Date(dateString);
        const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
        return days[date.getDay()];
    }
    setToToday() {
        const now = new Date();
        // 1. Tạo chuỗi yyyy-MM-dd theo giờ địa phương
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        // 2. Cập nhật giá trị vào Form
        this.appointmentForm.patchValue({
            MED_DATE: formattedDate
        });

        // 3. Đưa view của lịch về tháng hiện tại
        this.viewDate = new Date();

        // 4. Render lại giao diện lịch
        this.generateCalendar();
    }
    
    setDuration(minutes: number): void {
        this.appointmentForm.patchValue({
            DURATION: minutes
        });
    }
    isHourBusy(hour: string): boolean {
        return this.listExistingAppointments.some(app => 
            app.apP_ID === this.appointmentForm.get('DOCTOR_ID')?.value &&
            app.hour.startsWith(hour)
        );
    }

    selectHour(hour: string) {
        if (!this.isHourBusy(hour)) {
            // Nếu rảnh thì tự động điền vào form
            this.appointmentForm.patchValue({ HOUR: hour });
        }
    }
    private loadDropdowns(id?: string): void {
        this._customerService.cM_CUSTOMER_GetById(id).subscribe(res => this.customer = res);
        this._employeeService.cM_EMPLOYEE_DROPDOWNLIST('BS').subscribe(res => this.listDoctors = res);
        this._employeeService.cM_EMPLOYEE_DROPDOWNLIST('PT').subscribe(res => this.listAssistants = res);
    }
}

interface CalendarDay {
    value: number | null;
    fullDate?: string;
    isActive?: boolean;
    date?: Date;
    isDisable?: boolean;
}