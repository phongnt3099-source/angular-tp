import { Component, Input, Output, EventEmitter } from '@angular/core';
import packageInfo from '../../../../package.json';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  appVersion: string = packageInfo.version;
  @Input() showSwitcher: boolean = false;
  @Input() permission: boolean = false;
  @Input() activeView: string = 'timeGridWeek'; 
  @Input() buttonText: string = 'Đặt lịch mới';
  @Input() title: string = '';

  @Output() viewChanged = new EventEmitter<string>();
  @Output() addClicked = new EventEmitter<void>();

  clickChangeView(view: string) {
    this.viewChanged.emit(view);
  }
  onViewChange(viewName: string): void {
    this.activeView = viewName; // Cập nhật trạng thái active tại chỗ để đổi màu nút
    this.viewChanged.emit(viewName); // Bắn sự kiện ra ngoài cho Calendar nhận diện
  }

  onAddClick() {
    this.addClicked.emit();
  }
}