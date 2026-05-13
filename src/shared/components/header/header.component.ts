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
  @Input() permission: boolean = false;
  @Input() activeView: string = 'timeGridWeek'; 
  @Input() buttonText: string = '';
  @Input() title: string = '';

  @Output() viewChanged = new EventEmitter<string>();
  @Output() addClicked = new EventEmitter<void>();


  onAddClick() {
    this.addClicked.emit();
  }
}