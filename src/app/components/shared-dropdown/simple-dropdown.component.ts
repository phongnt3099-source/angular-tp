import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-simple-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SimpleDropdownComponent),
      multi: true
    }
  ],
  template: `
    <select
      [(ngModel)]="value"
      (change)="onSelectChange($event)"
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
export class SimpleDropdownComponent implements ControlValueAccessor {
  @Input() dataList: string[] = []; // Chỉ nhận mảng string ["00", "01",...]
  @Input() placeholder: string = '';

  value: string = '';

  // ControlValueAccessor members
  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(val: any): void {
    this.value = val || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onSelectChange(event: any) {
    this.onChange(event.target.value);
  }
}