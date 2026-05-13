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
const tippyDefault = (tippy as any).default || tippy;
@Component({
    templateUrl: './appointment-list.component.html',
    styleUrl: './appointment-list.component.css',
    animations: [appModuleAnimation()]
})

export class AppointmentComponentsComponent extends AppComponentBase implements OnInit {
    @ViewChild('paginator', { static: true }) paginator!: Paginator;
    @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

    currentView = 'timeGridWeek';
    displayMode: 'calendar' | 'library' = 'calendar'; // Mặc định xem lịch

  // Danh sách trạng thái chuẩn 6 bước
    statusConfigs: any = {
      'chua-den':   { label: 'Chưa đến', color: '#94a3b8', icon: 'fa-user-clock' },
      'da-den':     { label: 'Đã đến',   color: '#4f46e5', icon: 'fa-user-check' },
      'khong-den':  { label: 'Không đến', color: '#f59e0b', icon: 'fa-user-times' },
      'done-pay':   { label: 'Hoàn thành', color: '#10b981', icon: 'fa-file-invoice-dollar' },
      'da-ve':      { label: 'Đã về',     color: '#6366f1', icon: 'fa-door-open' },
      'huy':        { label: 'Hủy lịch',  color: '#ef4444', icon: 'fa-trash-alt' }
    };
    appointments = [
  {
    id: '1',
    customerName: 'Nguyễn Anh Tuấn',
    phone: '0901 234 567',
    time: '08:00',
    date: '2026-05-13',
    service: 'Nhổ răng khôn (Piezotome)',
    doctor: 'BS. Quang',
    status: 'da-den', // Indigo
    note: 'Bệnh nhân có tiền sử dị ứng thuốc tê.'
  },
  {
    id: '2',
    customerName: 'Lê Thị Mỹ Linh',
    phone: '0988 777 666',
    time: '09:30',
    date: '2026-05-13',
    service: 'Chỉnh nha (Niềng răng)',
    doctor: 'BS. Lan',
    status: 'chua-den', // Xám
    note: 'Tái khám định kỳ, thay dây cung.'
  },
  {
    id: '3',
    customerName: 'Trần Minh Hoàng',
    phone: '0912 333 444',
    time: '10:45',
    date: '2026-05-13',
    service: 'Cắm Implant (Straumann)',
    doctor: 'BS. Quang',
    status: 'done-pay', // Xanh lá
    note: 'Đã hoàn tất thanh toán đợt 1.'
  },
  {
    id: '4',
    customerName: 'Phạm Thanh Thảo',
    phone: '0933 111 222',
    time: '14:00',
    date: '2026-05-13',
    service: 'Tẩy trắng răng (Laser)',
    doctor: 'BS. Lan',
    status: 'khong-den', // Vàng
    note: 'Gọi điện không nghe máy.'
  },
  {
    id: '5',
    customerName: 'Hoàng Văn Đức',
    phone: '0944 555 888',
    time: '15:30',
    date: '2026-05-13',
    service: 'Bọc răng sứ (Zirconia)',
    doctor: 'BS. Hùng',
    status: 'da-ve', // Indigo nhạt
    note: 'Hẹn tái khám sau 3 ngày.'
  },
  {
    id: '6',
    customerName: 'Đặng Bảo Ngọc',
    phone: '0977 444 111',
    time: '17:00',
    date: '2026-05-13',
    service: 'Lấy cao răng',
    doctor: 'BS. Hùng',
    status: 'huy', // Đỏ
    note: 'Khách đổi lịch sang tuần sau.'
  }
];

    // 1. Logic cho VIEW LỊCH
  calendarOptions: CalendarOptions = {
    // 1. Cấu hình Giao diện & Ngôn ngữ
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: 'timeGridWeek', // Mặc định xem theo tuần
    locale: 'vi',                // Tiếng Việt
    firstDay: 1,                 // Bắt đầu tuần từ Thứ 2
    slotMinTime: '08:00:00',     // Thời gian bắt đầu phòng khám
    slotMaxTime: '22:00:00',     // Thời gian đóng cửa
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
    eventLongPressDelay: 50, // Thời gian trễ (ms) để bắt đầu hành động kéo - giúp tránh việc lỡ tay chạm nhẹ
    dayMaxEvents: true,
    nowIndicator: true,           // Vạch đỏ chỉ thời gian hiện tại
    slotDuration: '00:15:00', // Mỗi ô là 30 phút
    slotLabelInterval: '01:00',
    slotEventOverlap: false,
    contentHeight: 'auto',    // Để lịch tự co giãn theo nội dung
    expandRows: true,
    // Điều chỉnh tốc độ cuộn khi kéo sát mép
  dragRevertDuration: 500, 
  
  
    
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
      this.handleEventUpdate(info.event);
    },
    

    // 6. Xử lý khi thay đổi thời lượng (Kéo dài/thu ngắn ca khám)
    eventResize: (info) => {
      this.handleEventUpdate(info.event);
    },
    // Tùy chọn: Khi đang kéo, làm mờ các ca khám khác để dễ tập trung
    
    eventContent: (arg) => {
      let arrayOfDomNodes = [];
      
      // Nội dung text
      let titleEl = document.createElement('div');
      titleEl.innerHTML = `<b>${arg.timeText}</b><br/>${arg.event.title}`;
      titleEl.className = 'fc-event-title-custom';
      
      // Nút edit nhỏ ở góc
      let editBtn = document.createElement('i');
      editBtn.className = 'fas fa-pen-square event-edit-icon';
      editBtn.onclick = (e) => {
        e.stopPropagation();
        this.openEditModal(arg.event);
      };

      arrayOfDomNodes = [ titleEl, editBtn ];
      return { domNodes: arrayOfDomNodes };
    }
};


    constructor(
      injector: Injector,
      private _router: Router
    ) {
        super(injector);
    }
    get calendarEvents() {
      return this.appointments.map(app => ({
        id: app.id,
        title: `${app.customerName.toUpperCase()}\n${app.service}`,
        start: `${app.date}T${app.time}:00`,
        // Mặc định mỗi ca khám khoảng 45 phút nếu không có giờ kết thúc
        end: `${app.date}T${this.calculateEndTime(app.date, app.time)}:00`,
        backgroundColor: this.getStatusColor(app.status),
        borderColor: this.getStatusColor(app.status),
        extendedProps: {
          phone: app.phone,
          status: app.status,
          doctor: app.doctor
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
  console.log("Đang mở chỉnh sửa ca khám ID:", event.id);
  // Code mở dialog/modal của bạn ở đây
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
    if (item.setProp) {
      item.setProp('backgroundColor', this.statusConfigs[statusKey].color);
      item.setProp('borderColor', this.statusConfigs[statusKey].color);
    } else {
      item.status = statusKey;
    }
    // Tìm cuộc hẹn trong mảng và cập nhật trạng thái mới
    const appIndex = this.appointments.findIndex(a => a.id == item.id);
    if (appIndex > -1) {
      this.appointments[appIndex].status = statusKey as any;
    
    // Nạp lại để lịch đổi màu ngay lập tức
    this.loadAppointmentsToCalendar();
  }
    // API Call...
    console.log("Cập nhật trạng thái thành công!");
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
  const calendarEvents = this.appointments.map(app => {
    // Kết hợp date và time thành định dạng ISO (YYYY-MM-DDTHH:mm:ss)
    const startDateTime = `${app.date}T${app.time}:00`;
    
    // Tính toán thời gian kết thúc (mặc định 45 phút cho mỗi ca khám tại Thiên Phúc Dental)
    const endDateTime = this.calculateEndTime(app.date, app.time);
    const isLocked = app.status === 'da-den' || app.status === 'done-pay';

    return {
      id: app.id.toString(),
      title: `${app.customerName.toUpperCase()}\n${app.service}`,
      start: `${app.date}T${app.time}:00`,
      end: this.calculateEndTime(app.date, app.time),
      // Đổ màu theo trạng thái đã thiết lập
      backgroundColor: this.getStatusColor(app.status),
      borderColor: 'transparent',
      editable: !isLocked, 
      startEditable: !isLocked, 
      durationEditable: !isLocked,
      // Lưu thêm thông tin phụ để dùng cho Tippy hoặc Modal
      extendedProps: {
        status: app.status,
        phone: app.phone,
        doctor: app.doctor
      }
    };
  });

  // Gán mảng đã xử lý vào lịch
  this.calendarOptions.events = calendarEvents;
}


calculateEndTime(date: string, time: string): string {
  // Logic xử lý bên trong giữ nguyên
  const [hour, minute] = time.split(':').map(Number);
  const endDate = new Date(`${date}T${time}:00`);
  
  // Tăng 45 phút cho ca khám tại Thiên Phúc Dental
  endDate.setMinutes(endDate.getMinutes() + 45); 
  
  const h = endDate.getHours().toString().padStart(2, '0');
  const m = endDate.getMinutes().toString().padStart(2, '0');
  
  return `${date}T${h}:${m}:00`;
}
  // Cập nhật trạng thái cuộc hẹn
  // updateStatus(event: any, statusKey: string) {
  //   const selectedStatus = this.statusConfigs[statusKey];
    
  //   // Đổi màu ngay lập tức trên giao diện
  //   event.setProp('backgroundColor', selectedStatus.color);
  //   event.setProp('borderColor', selectedStatus.color);
    
  //   // Lưu vào database
  //   // this.appointmentService.update(event.id, { status: statusKey }).subscribe(() => {
  //   //   console.log('Đã cập nhật trạng thái Thiên Phúc Dental thành công!');
  //   // });
  // }

  // Xử lý khi đổi giờ (Kéo thả trên lịch)
  handleEventUpdate(info: any) {
    setTimeout(() => {
      const calendarApi = this.calendarComponent.getApi();
      // Lấy ID từ event cũ (vẫn tồn tại trong info)
      const eventId = info.event.id; 
      const event = calendarApi.getEventById(eventId);

      if (event) {
        console.log("Đã sang ngày mới:", event.startStr);
        // Gọi API cập nhật Database của Thiên Phúc Dental
        // this.updateAppointmentOnServer(event);
      }
    }, 2000);
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
    
  }
  handleEventDrop(info: any) {
  console.log('Đã thả cuộc hẹn tại:', info.event.start);
}

handleEventResize(info: any) {
  console.log('Đã đổi thời lượng cuộc hẹn');
}
}
