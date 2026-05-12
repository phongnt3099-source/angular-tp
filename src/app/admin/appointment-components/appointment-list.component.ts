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

@Component({
    templateUrl: './appointment-list.component.html',
    styleUrl: './appointment-list.component.css',
    animations: [appModuleAnimation()]
})

export class AppointmentComponentsComponent extends AppComponentBase implements OnInit {

    @ViewChild('paginator', { static: true }) paginator!: Paginator;
    @ViewChild('calendar') calendarComponent!: FullCalendarComponent;
    // Dữ liệu giả lập - Sau này bạn map từ SQL (ONLY_TIME, timE_DISTANCE) vào đây
    calendarTitle = '';
    currentView = 'timeGridWeek';
    calendarEvents: EventInput[] = [
    { 
      title: 'Khách hàng: Nguyễn Văn A', 
      start: '2026-05-11T13:45:00', 
      end: '2026-05-11T15:45:00',
      extendedProps: { cusId:'KH0000000000016',phone:'0933768512',timeDistance: '', status: 'late' } 
    },
    { 
      title: 'Khách hàng: Lê Thị B', 
      start: '2026-05-11T16:00:00', 
      end: '2026-05-11T15:45:00',
      extendedProps: { cusId:'KH0000000000014',phone:'0933768512',timeDistance: '',status:'soon' }
    }
  ];
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    initialView: this.currentView,
    locale: 'vi',
    headerToolbar: false, // Tắt toolbar mặc định để dùng bản custom
    slotMinTime: '07:00:00',
    slotMaxTime: '21:00:00',
    allDaySlot: false,
    nowIndicator: true,
    events: this.calendarEvents,
    // Cập nhật calendarTitle mỗi khi thay đổi ngày/tuần/tháng
    datesSet: (arg) => {
      this.calendarTitle = arg.view.title;
      this.currentView = arg.view.type;
    },
    eventClassNames: (arg) => {
      const status = arg.event.extendedProps['status'];
      return status === 'late' ? ['event-late-grad'] : ['event-soon-grad'];
    }
  };


    constructor(
      injector: Injector,
      private _router: Router
    ) {
        super(injector);
    }
    ngOnInit(): void {
    }

    navCalendar(action: 'prev' | 'next' | 'today') {
    const api = this.calendarComponent.getApi();
    if (action === 'prev') api.prev(); 
    else if (action === 'next')  api.next();
    else api.today();
  }

  // Chuyển chế độ xem
  changeView(view: string) {
    this.calendarComponent.getApi().changeView(view);
    this.currentView = view;
  }
  openAddModal(): void{

  }
    createCustomer(): void{
      // this.createCustomerModal.show();
    }
    hideAlert(): void{
        // this.alertVisible = false;
    }
    viewDetail(record: any): void{
      this._router.navigate(['/app/admin/customer-detail', record.cuS_ID]);
    }
    
}
interface EventInput {
    title: string;
    start: string;
    end: string;
    extendedProps: {
        cusId: string;
        phone?: string;
        timeDistance: string; // Để hiển thị "Trễ X phút" trên lịch
        status: string;
        //status: 'late' | 'soon' | 'future';
    };
}