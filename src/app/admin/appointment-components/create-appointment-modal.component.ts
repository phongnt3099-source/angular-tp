import { Component, EventEmitter, Injector, Output, ViewChild } from '@angular/core';
import { FormGroup, Validators } from '@angular/forms';
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
    appointmentForm!: MED_APPOINTMENT_ENTITY;
    // Data mẫu (Thực tế bạn sẽ gọi từ Service)
    listSlots = [];
    listDoctors: Array<CM_EMPLOYEE_ENTITY> = new Array<CM_EMPLOYEE_ENTITY>();
    listAssistants: Array<CM_EMPLOYEE_ENTITY> = new Array<CM_EMPLOYEE_ENTITY>();
    staffs = [];
    days: CalendarDay[] = [];
    today: any
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
    selectedHour = '';
    selectedMinute = '';
    listExistingAppointments: MED_APPOINTMENT_ENTITY[] = [];

    constructor(injector: Injector,
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
        const dateVal = this.appointmentForm.apP_DATE;
        const hour = parseInt(this.appointmentForm.hour|| '0');
        const minute = parseInt(this.appointmentForm.minute || '0');
        const duration = parseInt(this.appointmentForm.rangE_TIME.toString() ||'0');

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
            app.apP_DOC_ID === this.appointmentForm.apP_DOC_ID&&
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
        this.appointmentForm = new MED_APPOINTMENT_ENTITY();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        this.today = `${year}-${month}-${day}`;
        this.appointmentForm.apP_DATE = this.today;
        this.appointmentForm.hour = now.getHours().toString().padStart(2, '0');
        this.appointmentForm.minute = now.getMinutes().toString().padStart(2, '0');
        this.appointmentForm.rangE_TIME = 45;
        this.generateCalendar();
    }

    show(id?: string): void {
        this.active = true;
        // this.appointmentForm.reset({
        //     MED_DATE: new Date().toISOString().substring(0, 10),
        //     DURATION: 45
        // });
        this.appointmentForm = new MED_APPOINTMENT_ENTITY();
        this.appointmentForm.apP_DATE = this.today;
        this.appointmentForm.rangE_TIME = 45;
        this.loadDropdowns(id);
        this.modal.show();
    }

    close(): void {
        this.active = false;
        this.modal.hide();
    }

    save(): void {
        this.saving = true;

        if(!this.appointmentForm.hour || !this.appointmentForm.minute) {
            this.notify.error(this.l('Vui lòng chọn giờ và phút.'));
            this.saving = false;
            return;
        }
        if(!this.appointmentForm.apP_CONTENT) {
            this.notify.error(this.l('Vui lòng nhập nội dung lịch hẹn.'));
            this.saving = false;
            return;
        }
        const medDate = this.appointmentForm.apP_DATE;
        let formattedDate = '';
        if (medDate) {
            const d = new Date(medDate);
            const year = d.getFullYear();
            const month = ('0' + (d.getMonth() + 1)).slice(-2);
            const day = ('0' + d.getDate()).slice(-2);
            formattedDate = `${year}-${month}-${day}`; // Định dạng dd/MM/yyyy để gửi lên API nếu cần, hoặc giữ nguyên yyyy-MM-dd nếu API chấp nhận định dạng đó
        }
        this.appointmentForm.apP_ASSISTANT_ID_1 = this.selectedAssistant1 || undefined;
        this.appointmentForm.apP_ASSISTANT_ID_2 = this.selectedAssistant2 || undefined;
        this.appointmentForm.apP_DATE = formattedDate || undefined;
        this.appointmentForm.apP_DOC_ID = this.selectedDoctor || undefined;
        this.appointmentForm.apP_CUST_ID = this.customer.cuS_ID || undefined;
        this.appointmentForm.starT_TIME = `${this.appointmentForm.hour}:${this.appointmentForm.minute}`;
        this._appointmentService.mED_APPOINTMENT_Ins(this.appointmentForm).subscribe(() => {
            this.notify.info(this.l('SavedSuccessfully'));
            this.close();
            this.modalSave.emit(null);
         }, () => {
            this.notify.error(this.l('AnErrorOccurredWhileSaving'));
            this.saving = false;
        });
    }

    onShown(): void { }

    loadExistingAppointments(docID: any): void {

        const medDate = this.appointmentForm.apP_DATE;
        const medDocId = docID; // Lấy giá trị bác sĩ đã chọn
        this.appointmentForm.apP_DOC_ID = docID|| undefined;
        let formattedDate = '';

        if (medDate) {
            const d = new Date(medDate);
            const year = d.getFullYear();
            const month = ('0' + (d.getMonth() + 1)).slice(-2);
            const day = ('0' + d.getDate()).slice(-2);
            formattedDate = `${year}-${month}-${day}`; // Định dạng dd/MM/yyyy để gửi lên API nếu cần, hoặc giữ nguyên yyyy-MM-dd nếu API chấp nhận định dạng đó
        }

        // Chỉ gọi API khi đã chọn cả bác sĩ và ngày
        if (formattedDate && medDocId) {
            const searchParam = new MED_APPOINTMENT_ENTITY();
            searchParam.apP_DATE = formattedDate;
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

        const selectedDateInForm = this.appointmentForm.apP_DATE;
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
        
        this.appointmentForm.apP_DATE = formatted;
        this.generateCalendar();
        this.loadExistingAppointments(this.selectedDoctor);
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
        this.appointmentForm.apP_DATE = formattedDate;

        // 3. Đưa view của lịch về tháng hiện tại
        this.viewDate = new Date();

        // 4. Render lại giao diện lịch
        this.generateCalendar();
    }
    
    setDuration(minutes: number): void {
        this.appointmentForm.rangE_TIME = minutes;
    }
    // isHourBusy(hour: string): boolean {
    //     return this.listExistingAppointments.some(app => 
    //         app.apP_DOC_ID === this.appointmentForm.apP_DOC_ID &&
    //         app.hour.startsWith(hour)
    //     );
    // }
    isHourBusy(hour: string): boolean {
        const medDate = this.appointmentForm.apP_DATE;
        if (!medDate) return false;

        // 1. Kiểm tra nếu giờ đó bác sĩ đã có lịch hẹn (Dữ liệu từ bảng MED_APPOINTMENT)
        const isBooked = this.listExistingAppointments.some(app => 
            app.apP_DOC_ID === this.appointmentForm.apP_DOC_ID &&
            app.starT_TIME?.startsWith(hour)
        );
        if (isBooked) return true;

        // 2. Kiểm tra nếu là ngày hôm nay thì set "Bận" cho những giờ đã qua
        const today = new Date();
        const selectedDate = new Date(medDate);

        // So sánh ngày (không so sánh giờ)
        const isToday = today.toDateString() === selectedDate.toDateString();

        if (isToday) {
            const currentHour = today.getHours();
            // Nếu giờ đang xét (hour) nhỏ hơn hoặc bằng giờ hiện tại thì set Busy
            if (parseInt(hour) <= currentHour) {
                return true;
            }
        }

        return false;
    }
    // Hàm kiểm tra một thời điểm cụ thể có bị trùng vào ca khám nào không
    isTimeSlotBusy(hour: string, minute: string): boolean {
        const checkTime = parseInt(hour) * 60 + parseInt(minute); // Quy đổi ra phút trong ngày

        return this.listExistingAppointments.some(app => {
            // 1. Lấy giờ bắt đầu của ca khám hiện có
            const [appH, appM] = (app.starT_TIME?.split(':').map(Number) || [0, 0]);
            const startTime = appH * 60 + appM;
            
            // 2. Tính giờ kết thúc dựa trên DURATION (mặc định 30 nếu không có)
            const endTime = startTime + (app.rangE_TIME || 30);

            // 3. Nếu thời điểm đang check nằm giữa Start và End thì là BẬN
            return checkTime >= startTime && checkTime < endTime;
        });
    }
    isTimeDisabled(hour: string, min: string): boolean {
        const medDate = this.appointmentForm.apP_DATE;
        if (!medDate) return false;

        // 1. Kiểm tra nếu bác sĩ đã có lịch hẹn (Dữ liệu từ MED_APPOINTMENT)
        if (this.isTimeSlotBusy(hour, min)) return true;

        // 2. Kiểm tra nếu là ngày hôm nay và thời gian đã trôi qua
        const today = new Date();
        const selectedDate = new Date(medDate);
        
        const isToday = today.toDateString() === selectedDate.toDateString();
        if (isToday) {
            const checkTime = parseInt(hour) * 60 + parseInt(min);
            const currentTime = today.getHours() * 60 + today.getMinutes();
            
            // Nếu thời gian đang xét nhỏ hơn hoặc bằng thời gian hiện tại
            if (checkTime <= currentTime) return true;
        }

        return false;
    }

    selectTime(hour: string, min: string) {
    if (!this.isTimeSlotBusy(hour, min)) {
        this.appointmentForm.hour = hour;
        this.appointmentForm.minute = min;
        this.selectedHour = hour;
        this.selectedMinute = min;
    }
}

    selectHour(hour: string) {
        if (!this.isHourBusy(hour)) {
            // Nếu rảnh thì tự động điền vào form
            this.appointmentForm.hour = hour;
            this.selectedHour = hour;
            this.appointmentForm.minute = '00';
        }
    }
    getHourTooltip(hour: string): string {
        const today = new Date();
        const medDate = this.appointmentForm.apP_DATE;
        
        if (this.listExistingAppointments.some(app => app.starT_TIME?.startsWith(hour))) {
            return 'Bác sĩ đã có lịch hẹn';
        }
        
        if (medDate && new Date(medDate).toDateString() === today.toDateString()) {
            if (parseInt(hour) <= today.getHours()) {
                return 'Giờ này đã trôi qua';
            }
        }
        return 'Giờ còn trống';
    }
    private loadDropdowns(id?: string): void {
        this._customerService.cM_CUSTOMER_GetById(id).subscribe(res => this.customer = res);
        this._employeeService.cM_EMPLOYEE_DROPDOWNLIST('BS').subscribe(res => {
                this.listDoctors = res;
                this.selectedDoctor = this.listDoctors.length > 0
                                        ? this.listDoctors.reduce((max, current) =>
                                            current.emP_NO > max.emP_NO ? current : max
                                        ).emP_ID
                                        : '';
                this.loadExistingAppointments(this.selectedDoctor);
        });
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