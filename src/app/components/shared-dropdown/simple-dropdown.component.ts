import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-simple-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <select
      [(ngModel)]="selectedValue"
      (change)="onChange()"
      class="form-select form-select-sm shadow-none"
    >
      <option [value]="''">{{ placeholder }}</option>
      <option *ngFor="let item of dataList" [value]="item">
        {{ item }}
      </option>
    </select>
  `,
  styles: [`
    select { cursor: pointer; font-weight: 600; color: #475569; text-align: center; }
  `]
})
export class SimpleDropdownComponent {
  @Input() dataList: string[] = []; // Chỉ nhận mảng string ["00", "01",...]
  @Input() placeholder: string = '';

  @Input() selectedValue: any = '';
  @Output() selectedValueChange = new EventEmitter<any>();

 onChange() {
    this.selectedValueChange.emit(this.selectedValue);
  }
}