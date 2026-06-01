/* eslint-disable eqeqeq */
/* eslint-disable no-trailing-spaces */
import { Component, Injector, OnInit,ViewChild } from '@angular/core';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import { LazyLoadEvent } from 'primeng/api';
import { Paginator } from 'primeng/paginator';
import { finalize } from 'rxjs/operators';
import { Router } from '@node_modules/@angular/router';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import * as tippy from 'tippy.js';
import Swal from 'sweetalert2';
import { CreateAppointmentModalComponent } from './create-appointment-modal.component';
import { AppointmentServiceProxy, MED_APPOINTMENT_ENTITY } from '@shared/service-proxies/service-proxies';
const tippyDefault = (tippy as any).default || tippy;
@Component({
    templateUrl: './appointment-list.component.html',
    styleUrl: './appointment-list.component.scss',
    animations: [appModuleAnimation()]
})

export class AppointmentComponentsComponent extends AppComponentBase implements OnInit {
    @ViewChild('paginator', { static: true }) paginator!: Paginator;
    @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
    @ViewChild('createAppointmentModal', { static: true }) createAppointmentModal!: CreateAppointmentModalComponent;
        

    currentView = 'timeGridWeek';
    displayMode: 'calendar' | 'library' = 'calendar'; // Mặc định xem lịch
    isLoading = false;
    filterInput: MED_APPOINTMENT_ENTITY = new MED_APPOINTMENT_ENTITY();
    appointments: MED_APPOINTMENT_ENTITY[]=[];
    disable = false;

  // Danh sách trạng thái chuẩn 6 bước
    statusConfigs: any = {
      'chua-den':   { label: 'Chưa đến', color: '#94a3b8', icon: 'fa-user-clock' },
      'da-den':     { label: 'Đã đến',   color: '#4f46e5', icon: 'fa-user-check' },
      'khong-den':  { label: 'Không đến', color: '#f59e0b', icon: 'fa-user-times' },
      'done-pay':   { label: 'Hoàn thành', color: '#10b981', icon: 'fa-file-invoice-dollar' },
      'da-ve':      { label: 'Đã về',     color: '#6366f1', icon: 'fa-door-open' },
      'huy':        { label: 'Hủy lịch',  color: '#ef4444', icon: 'fa-trash-alt' }
    };
    

    // 1. Logic cho VIEW LỊCH
  calendarOptions: CalendarOptions = {
    // 1. Cấu hình Giao diện & Ngôn ngữ
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek', // Mặc định xem theo tuần
    locale: 'vi',                // Tiếng Việt
    firstDay: 1,                 // Bắt đầu tuần từ Thứ 2
    slotMinTime: '08:00:00',     // Thời gian bắt đầu phòng khám
    slotMaxTime: '23:00:00',     // Thời gian đóng cửa
    height: 'auto',
    allDaySlot: false,           // Ẩn hàng "Cả ngày" để lịch gọn hơn

    // 2. Tùy chỉnh Header của Lịch (Vì mình đã có Header riêng nên ẩn cái này đi)
    headerToolbar: false, 

    // 3. Hiệu ứng và Tương tác
    editable: true,               // Cho phép kéo thả cuộc hẹn
    droppable: true,
    selectable: true,             // Cho phép click vào ô trống để đặt lịch
    selectMirror: true,
    dragScroll: true, // Tự động cuộn lịch khi kéo event tới mép trên/dưới hoặc trái/phải
    longPressDelay: 0,         // Giảm trễ để bắt đầu kéo nhanh hơn
    eventLongPressDelay: 0, // Thời gian trễ (ms) để bắt đầu hành động kéo - giúp tránh việc lỡ tay chạm nhẹ
    dayMaxEvents: true,
    nowIndicator: true,           // Vạch đỏ chỉ thời gian hiện tại
    slotDuration: '00:30:00', // Mỗi ô là 30 phút
    snapDuration: '00:01:00', // Bước nhảy là 1 phút thay vì 30 phút
    slotLabelInterval: '01:00',
    slotEventOverlap: false,
    contentHeight: 'auto',    // Để lịch tự co giãn theo nội dung
    expandRows: true,
    // Điều chỉnh tốc độ cuộn khi kéo sát mép
    dragRevertDuration: 0, 
  
  
    
    // 4. LOGIC QUAN TRỌNG: Gắn Tippy.js để cập nhật trạng thái
    eventDidMount: (info) => {
      tippyDefault(info.el, {
        content: () => this.createQuickStatusMenu(info.event), // Hàm tạo menu 6 trạng thái
        allowHTML: true,
        interactive: true,
        trigger: 'click',         // Click vào để đổi trạng thái
        theme: 'light-border',
        placement: 'right-start',
        animation: 'shift-away',
        appendTo: document.body
      });
    },
    //4.1 Thêm class vào body để thông báo trạng thái đang kéo (dùng cho CSS bên dưới)
    eventDragStart: (info) => {
      document.body.classList.add('is-dragging-appointment');
    },

    eventDragStop: (info) => {
      document.body.classList.remove('is-dragging-appointment');
    },

    // 5. Xử lý khi kéo thả (Cập nhật giờ hẹn)
    eventDrop: (info) => {
      this.handleEventUpdate(info);
    },
    

    // 6. Xử lý khi thay đổi thời lượng (Kéo dài/thu ngắn ca khám)
    eventResize: (info) => {
      this.handleEventUpdate(info);
    },
    // Tùy chọn: Khi đang kéo, làm mờ các ca khám khác để dễ tập trung
    
    eventContent: (arg) => {
        const status = arg.event.extendedProps['status'];
        const doctor = arg.event.extendedProps['doctor'] || 'Chưa phân công';
        
        const startDate = arg.event.start;
        const dateDisplay = startDate ? `${startDate.getDate()}/${startDate.getMonth() + 1}` : '';
        const appDate = arg.event.startStr.split('T')[0];
        const appTime = arg.event.startStr.split('T')[1].substring(0, 5);

        let timeDiffHtml = '';
        if (status === 'chua-den') {
            timeDiffHtml = `<span class="time-diff-tag"> | ${this.getTimeStatusDiff(appDate, appTime)}</span>`;
        }

        let container = document.createElement('div');
        container.className = 'fc-event-custom-container';
        container.setAttribute('data-event-id', arg.event.id);
        container.innerHTML = `
            <div class="fc-event-time-row">
                <span class="date-badge">${dateDisplay}</span>
                ${arg.timeText}${timeDiffHtml}
            </div>
            <div class="fc-event-title-row">${arg.event.title.replace('\n', '<br/>')}</div>
            
            <div class="doctor-badge-container">
                <div class="doctor-glass-effect">
                    <i class="fas fa-user-md doctor-icon"></i>
                    <span class="doctor-name-text">${doctor.toUpperCase()}</span>
                </div>
            </div>
        `;
        return { domNodes: [container] };
    }
};


    constructor(
      injector: Injector,
      private _router: Router,
      private _appointmentService: AppointmentServiceProxy,
    ) {
        super(injector);
        console.log(this);
        setInterval(() => {
        const calendarApi = this.calendarComponent.getApi();
          calendarApi?.render();
    }, 60000);
    }
    get calendarEvents() {
      return this.appointments.map(app => ({
        id: app.apP_ID,
        title: `${app.cuS_NAME?.toUpperCase()}\n${app.apP_CONTENT}`,
        start: `${app.apP_DATE}T${app.starT_TIME}:00`,
        // Mặc định mỗi ca khám khoảng 45 phút nếu không có giờ kết thúc
        end: `${app.apP_DATE}T${this.calculateEndTime(app.apP_DATE, app.starT_TIME,app.rangE_TIME)}:00`,
        backgroundColor: this.getStatusColor(app.apP_CONTENT),
        borderColor: this.getStatusColor(app.apP_CONTENT),
        extendedProps: {
          phone: app.cuS_PHONE,
          status: app.apP_CONTENT,
          doctor: app.doC_NAME
        }
      }));
    }
    ngOnInit(): void {
      this.loadAppointmentsToCalendar();
    }
    
  // 2. Logic cho VIEW THƯ VIỆN
  initTippy(event: MouseEvent, appointment: any) {
    const target = event.currentTarget as HTMLElement;
    this.attachTippy(target, appointment);
  }

  // Hàm dùng chung để gắn Menu Tippy
  attachTippy(element: HTMLElement, data: any) {
    tippyDefault(element, {
      content: () => this.createDropdownUI(data),
      allowHTML: true,
      interactive: true,
      trigger: 'click',
      theme: 'light-border',
      placement: 'bottom',
      appendTo: document.body,
      showOnCreate: true
    });
  }

  createDropdownUI(item: any) {
    const container = document.createElement('div');
    container.className = 'quick-status-dropdown-3d'; // Class SCSS đã viết ở các bước trước

    Object.keys(this.statusConfigs).forEach(key => {
      const s = this.statusConfigs[key];
      const btn = document.createElement('button');
      btn.innerHTML = `<i class="fas ${s.icon}" style="color: ${s.color}"></i><span>${s.label}</span>`;
      btn.onclick = () => this.updateStatus(item, key);
      container.appendChild(btn);
    });
    return container;
  }
  getTimeStatusDiff(appDate: string, appTime: string): string {
      const now = new Date();
      const appointmentDate = new Date(`${appDate}T${appTime}:00`);
      
      // Reset giờ về 00:00 để tính chuẩn số ngày chênh lệch
      const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const d2 = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate());
      
      const diffInTime = d2.getTime() - d1.getTime();
      const diffInDays = Math.round(diffInTime / (1000 * 3600 * 24));

      // 1. XỬ LÝ CHO CÁC NGÀY KHÁC (CÒN XA)
      if (diffInDays > 0) {
          return `${diffInDays} ngày tới`;
      } else if (diffInDays < 0) {
          return `Đã qua`;
      }

      // 2. XỬ LÝ RIÊNG CHO NGÀY HÔM NAY (Realtime từng phút)
      const diffInMinutes = Math.floor((appointmentDate.getTime() - now.getTime()) / 60000);
      const absMinutes = Math.abs(diffInMinutes);
      const hours = Math.floor(absMinutes / 60);
      const mins = absMinutes % 60;

      if (diffInMinutes < 0) {
          // TRỄ HẸN
          return absMinutes >= 60 ? `Trễ ${hours}h ${mins}p` : `Trễ ${absMinutes}p`;
      } else {
          // SẮP TỚI TRONG NGÀY
          return diffInMinutes <= 60 ? `${diffInMinutes}p tới` : `${hours}h tới`;
      }
  }
  createQuickStatusMenu(event: any): HTMLElement {
    const container = document.createElement('div');
    container.className = 'quick-status-dropdown-3d';

    // --- PHẦN MỚI: NÚT EDIT CHÍNH ---
    const editAction = document.createElement('div');
    editAction.className = 'edit-action-header';
    editAction.innerHTML = `
      <button class="btn-full-edit">
        <i class="fas fa-edit"></i>
        <span>Chỉnh sửa chi tiết</span>
      </button>
    `;
    editAction.onclick = () => {
      this.closeAllMenus();
      this.openEditModal(event); // Hàm mở modal chỉnh sửa của bạn
    };
    container.appendChild(editAction);

    // Dòng kẻ phân cách
    const divider = document.createElement('div');
    divider.className = 'menu-divider';
    container.appendChild(divider);

    const title = document.createElement('div');
    title.className = 'menu-title';
    title.innerText = 'Đổi nhanh trạng thái';
    container.appendChild(title);

    // --- PHẦN CŨ: 6 TRẠNG THÁI ---
    const statuses = [
      { id: 'chua-den',  label: 'Chưa đến',  color: '#94a3b8', icon: 'fa-user-clock' },
      { id: 'da-den',    label: 'Đã đến',    color: '#4f46e5', icon: 'fa-user-check' },
      { id: 'khong-den', label: 'Không đến', color: '#f59e0b', icon: 'fa-user-times' },
      { id: 'done-pay',  label: 'Hoàn tất',  color: '#10b981', icon: 'fa-file-invoice-dollar' },
      { id: 'da-ve',     label: 'Đã về',     color: '#6366f1', icon: 'fa-door-open' },
      { id: 'huy',       label: 'Hủy lịch',  color: '#ef4444', icon: 'fa-trash-alt' }
    ];

    statuses.forEach(s => {
      const btn = document.createElement('div');
      btn.className = 'status-btn-item';
      btn.innerHTML = `
        <div class="status-icon-wrapper" style="background: ${s.color}15">
          <i class="fas ${s.icon}" style="color: ${s.color}"></i>
        </div>
        <div class="status-label">${s.label}</div>
      `;
      btn.onclick = (e) => {
        e.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài
        this.updateStatus(event, s.id);
        this.closeAllMenus();
      };
      container.appendChild(btn);
    });

    return container;
}

// Hàm xử lý mở Modal
  openEditModal(event: any) {
    console.log(event);
    this.createAppointmentModal.show('' ,event.id??event.apP_ID)
  }
  
  closeAllMenus() {
  const tippyInstances = document.querySelectorAll('[data-tippy-root]');
  tippyInstances.forEach((element: any) => {
    if (element._tippy) {
      element._tippy.hide();
    }
  });

}

  updateStatus(item: any, statusKey: string) {
    // Nếu là FullCalendar event dùng setProp, nếu là object thường dùng gán trực tiếp
    this.message.confirm(
        'Bạn có chắc chắn muốn cập nhật trạng thái mới lịch hẹn này không?',
        'Xác nhận cập nhật',
        (isConfirmed) => {
            if (isConfirmed) {
                const appIndex = this.appointments.findIndex(a => a.apP_ID == (item.id??item.apP_ID));
                
                if (appIndex > -1) {
                  let data = this.appointments[appIndex];
                  data.apP_STATUS = statusKey;
                  this._appointmentService.mED_APPOINTMENT_Upd(data).subscribe(() => {
                    this.notify.success(this.l('Cập nhật trạng thái thành công'));
                    const calendarApi = this.calendarComponent.getApi();
                    const event = calendarApi.getEventById(data.apP_ID);
                      if (item.setProp) {
                        item.setProp('backgroundColor', this.statusConfigs[statusKey].color);
                        item.setProp('borderColor', this.statusConfigs[statusKey].color);
                      } else if (event) {
                          // 1. Cập nhật màu sắc mới dựa trên status mới
                          event.setProp('backgroundColor', this.statusConfigs[statusKey].color);
                          event.setProp('borderColor', this.statusConfigs[statusKey].color);
                      } {
                        item.status = statusKey;
                      }
                        
                      this.appointments[appIndex].apP_STATUS = statusKey as any;
                      this.appointments[appIndex].iWarn = false;
                      if(this.appointments.some(x=>x.iWarn == true)){
                        this.checkLateAppointments();
                      }
                  });
                }
            }
        }
    );
     
    this.closeAllMenus();
  }
  getStatusLabel(statusId: string): string {
  return this.statusConfigs[statusId]?.label || 'Không xác định';
  }
  getStatusColor(statusId: string): string {
  return this.statusConfigs[statusId]?.color || '#94a3b8'; // Mặc định trả về màu xám nếu không tìm thấy
  }
  // Gọi hàm này trong ngOnInit hoặc sau khi nhận dữ liệu từ API
  loadAppointmentsToCalendar() {
    this.isLoading = true; 
    
    this.filterInput.skipCount = 0;
    this.filterInput.maxResultCount = 1000;

    this._appointmentService
        .mED_APPOINTMENT_Search(this.filterInput)
        .pipe(
            finalize(() => this.isLoading = false) 
        )
        .subscribe({
            next: (result) => {
                // SỬA TẠI ĐÂY: Dùng phép gán để RESET hoàn toàn mảng cũ, tránh lặp dữ liệu
                this.appointments = result.items || [];

                const calendarEvents = this.appointments.map(app => {
                    const isLocked = ['da-den', 'done-pay'].includes(app.apP_STATUS);
                    let formattedDate = '';
    
                    if (app.apP_DATE) {
                        const datePart = app.apP_DATE.split(' ')[0]; 
                        const parts = datePart.split('/');
                        
                        if (parts.length === 3) {
                            const [m, d, y] = parts;
                            const mm = (m || '').padStart(2, '0');
                            const dd = (d || '').padStart(2, '0');
                            // Đảm bảo năm có đủ cấu trúc yyyy
                            formattedDate = y && y.length === 4 ? `${y}-${mm}-${dd}` : '';
                        }
                    }
                    
                    if (!formattedDate) {
                        formattedDate = new Date().toISOString().split('T')[0];
                    }

                    const startTimeStr = `${formattedDate}T${app.starT_TIME || '00:00'}:00`;
                    const endTimeStr = this.calculateEndTime(formattedDate, app.starT_TIME, app.rangE_TIME);
                    
                    return {
                        id: app.apP_ID,
                        doc_id: app.doC_ID,
                        title: `${(app.cuS_NAME || '').toUpperCase()} - ${app.apP_CONTENT || ''}`,
                        start: startTimeStr,
                        end: endTimeStr,
                        backgroundColor: this.getStatusColor(app.apP_STATUS),
                        borderColor: 'transparent',
                        editable: !isLocked,
                        startEditable: !isLocked,
                        durationEditable: !isLocked,
                        extendedProps: {
                            status: app.apP_STATUS,
                            phone: app.cuS_PHONE,
                            doctor: app.doC_NAME
                        }
                    };
                });

                // Cập nhật lịch (Immutable update)
                this.calendarOptions = {
                    ...this.calendarOptions,
                    events: calendarEvents
                };

                // Kiểm tra trễ hẹn (Nên lưu ref nếu cần clear khi ngOnDestroy)
                setTimeout(() => {
                    if (typeof this.checkLateAppointments === 'function') {
                        this.checkLateAppointments();
                    }
                }, 500);
            },
            error: (err) => {
                this.notify.error("Không thể tải danh sách lịch hẹn");
                console.error(err); // Nên log lỗi ra console để dễ debug
            }
        });
}
checkLateAppointments() {
    const now = new Date();
    
    this.appointments.forEach(app => {
        // Chỉ quét những ca ở trạng thái "Chưa đến"
        if (app.apP_STATUS === 'chua-den') {
            // Tạo mốc thời gian của ca khám (Giả sử app.apP_DATE là "2026-05-13" và app.time là "14:30")
            let formattedDate = '';
    
                    if (app.apP_DATE) {
                        const datePart = app.apP_DATE.split(' ')[0]; 
                        const parts = datePart.split('/');
                        
                        if (parts.length === 3) {
                            const [m, d, y] = parts;
                            const mm = (m || '').padStart(2, '0');
                            const dd = (d || '').padStart(2, '0');
                            // Đảm bảo năm có đủ cấu trúc yyyy
                            formattedDate = y && y.length === 4 ? `${y}-${mm}-${dd}` : '';
                        }
                    }
            const appointmentTime = new Date(`${formattedDate}T${app.starT_TIME}:00`);
            
            // Tính số phút chênh lệch
            const diffInMinutes = Math.floor((now.getTime() - appointmentTime.getTime()) / 60000);

            // Nếu trễ từ 15 phút trở lên
            if (diffInMinutes >= 15) {
                const title = 'CẢNH BÁO TRỄ HẸN - ' + app.cuS_PHONE
                Swal.fire({
                    title: title,
                    text: `Bệnh nhân ${app.cuS_NAME} đã trễ ${diffInMinutes} phút! Bạn có muốn xử lý ngay?`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Xử lý ngay',
                    cancelButtonText: 'Để sau',
                    confirmButtonColor: '#4f46e5',
                    // Giữ thông báo không tự đóng nếu cần
                }).then((result) => {
                    if (result.isConfirmed) {
                        this.focusAndOpenStatusMenu(app);
                    }
                });

                app.iWarn = true;
            }
        }
    });
}
focusAndOpenStatusMenu(app: any) {
   const calendarApi = this.calendarComponent.getApi();
   const normalizedApp = this.normalizeAppData(app);
    
    let formattedDate = '';
    
    if (app.apP_DATE) {
        const datePart = app.apP_DATE.split(' ')[0]; 
        const parts = datePart.split('/');
        
        if (parts.length === 3) {
            const [m, d, y] = parts;
            const mm = (m || '').padStart(2, '0');
            const dd = (d || '').padStart(2, '0');
            // Đảm bảo năm có đủ cấu trúc yyyy
            formattedDate = y && y.length === 4 ? `${y}-${mm}-${dd}` : '';
        }
    }
    // 1. Chuyển đến ngày của ca trễ trước
    calendarApi.gotoDate(formattedDate);

    // 2. Đợi một khoảng thời gian ngắn để lịch render xong ngày mới
      setTimeout(() => {
        // CUỘN LỊCH XUỐNG GIỜ CẦN XỬ LÝ (Sau khi đã render ngày)
        // Lưu ý: app.time phải là định dạng '08:30:00'
        calendarApi.scrollToTime(app.time);

        // 3. Tìm thẻ và bật Tippy
        const eventEl = document.querySelector(`[data-event-id="${app.apP_ID}"]`);
        if (eventEl) {
            const htmlEl = eventEl as HTMLElement;
            const tippyInstance = (htmlEl as any)._tippy;

            if (tippyInstance) {
                tippyInstance.destroy();
            }

            this.bindTippyManually(htmlEl, normalizedApp); 

            const newTippy = (htmlEl as any)._tippy;
            if (newTippy) {
                newTippy.show();
            }

            // Highlight thẻ
            htmlEl.style.outline = "3px solid #fbbf24";
            setTimeout(() => htmlEl.style.outline = "none", 5000);
        }
    }, 500); // Khoảng 500ms là đủ để lịch vẽ lại scroller
}

bindTippyManually(el: HTMLElement, app: any) {
    tippyDefault(el, {
        content: () => this.createQuickStatusMenu(app), 
        allowHTML: true,
        interactive: true,
        trigger: 'click',
        theme: 'light-border',
        showOnCreate: true, // Tự động bật menu ngay khi tạo xong
        appendTo: document.body
    });
}

calculateEndTime(date: string, time: string,range: number): string {
  // Logic xử lý bên trong giữ nguyên
  const [hour, minute] = time.split(':').map(Number);
  const endDate = new Date(`${date}T${time}:00`);
  
  // Tăng 45 phút cho ca khám tại Thiên Phúc Dental
  endDate.setMinutes(endDate.getMinutes()+range);
  
  const h = endDate.getHours().toString().padStart(2, '0');
  const m = endDate.getMinutes().toString().padStart(2, '0');
  
  return `${date}T${h}:${m}:00`;
}


  // Xử lý khi đổi giờ (Kéo thả trên lịch)
  handleEventUpdate(info: any) {
    if(info){
      const newStart = info.event.start;
      const now = new Date();

      const today = new Date().setHours(0, 0, 0, 0);
      const selectedDate = new Date(newStart).setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        // Thông báo lỗi cho người dùng
        this.notify.error(
            'Không được phép chuyển lịch hẹn về quá khứ!',
            'LỖI CẬP NHẬT'
        );

        info.revert();
        return; 
    }
    this.message.confirm(
        'Bạn có chắc chắn muốn cập nhật thời gian hẹn mới cho lịch hẹn này không?',
        'Xác nhận cập nhật',
        (isConfirmed) => {
            if (isConfirmed) {
                const index =this.appointments.findIndex(x=>x.apP_ID == info.event.id);
                if (index > -1) {
                  const newStart = new Date(info.event.start).toLocaleString('sv-SE').replace(' ', 'T');
                  const newEnd = new Date(info.event.end).toLocaleString('sv-SE').replace(' ', 'T');

                  const datePart = newStart.split('T')[0];
                  const startTimePart = newStart.split('T')[1].substring(0, 5); 
                  const endTimePart = newEnd ? newEnd.split('T')[1].substring(0, 5) : '';

                  const [startH, startM] = startTimePart.split(':').map(Number);
                  const [endH, endM] = endTimePart.split(':').map(Number);

                  const totalStartMinutes = (startH * 60) + startM;
                  const totalEndMinutes = (endH * 60) + endM;

                  const durationInMinutes = totalEndMinutes - totalStartMinutes;


                  // 4. Gán giá trị mới vào mảng appointments
                  this.appointments[index].apP_DATE = datePart;
                  this.appointments[index].starT_TIME = startTimePart;
                  this.appointments[index].rangE_TIME = durationInMinutes;

                  const data = this.appointments[index];
                  this._appointmentService.mED_APPOINTMENT_Upd(data).subscribe((response) => {
                    if(response.result == '0'){
                      this.notify.success(this.l('Thay đổi thời gian hẹn thành công'));
                      
                    }
                    else{
                        this.notify.error(this.l('Cập Nhật Thất Bại! ') + ': ' + response.errorDesc);
                        info.revert();
                    }
                  });

                  
              } else {
                  this.notify.error("Không tìm thấy ca khám trong danh sách local để cập nhật!");
                  info.revert();
              }
            }
            else{
                info.revert();
            }
        }
    );
        
    }
  }
  changeView(viewType: string) {
    this.currentView = viewType;
    const calendarApi = this.calendarComponent.getApi();
    calendarApi.changeView(viewType);
    setTimeout(() => {
      this.loadAppointmentsToCalendar();
    }, 100);
  }
  goToday() {
    this.calendarComponent.getApi().today();
  }

  goPrev() {
    this.calendarComponent.getApi().prev();
  }

  goNext() {
    this.calendarComponent.getApi().next();
  }
  openAddModal(): void{
    this.createAppointmentModal.show('','');
  }
  handleEventDrop(info: any) {
  console.log('Đã thả cuộc hẹn tại:', info.event.start);
}

handleEventResize(info: any) {
  console.log('Đã đổi thời lượng cuộc hẹn');
}
private normalizeAppData(app: any) {
    return {
        ...app,
        // Ưu tiên lấy từ JSON thô (doC_ID), nếu không có thì lấy từ extendedProps (doc_id)
        doC_ID: app.doC_ID || app.apP_DOC_ID || (app.extendedProps ? app.extendedProps.doc_id : null),
        apP_ID: app.apP_ID || app.id,
        cuS_NAME: app.cuS_NAME || app.title?.split(' - ')[0],
        apP_STATUS: app.apP_STATUS || (app.extendedProps ? app.extendedProps.status : null)
    };
}
}


