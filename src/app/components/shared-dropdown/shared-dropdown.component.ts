import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
   <select
    [(ngModel)]="selectedValue"
    (change)="onChange()"
    class="form-select w-100"
  >
    <option value="">{{ placeholder }}</option>
    @for (item of dataList; track item[valueField]) {
      <option [value]="item[valueField]">{{ item[labelField] }}</option>
    }
  </select>
  `
})
export class SharedDropdownComponent {
  @Input() dataList: any[] = [];         // Mảng dữ liệu truyền vào (tỉnh thành, nguồn KH, nhãn...)
  @Input() labelField = 'name';   // Tên cột muốn hiển thị làm Label
  @Input() valueField= 'id';     // Tên cột muốn lấy giá trị làm Value
  @Input() placeholder = '---Chọn---';

  @Input() selectedValue: any = '';       // Binding dữ liệu 2 chiều
  @Output() selectedValueChange = new EventEmitter<any>();

  onChange() {
    this.selectedValueChange.emit(this.selectedValue);
  }
}
