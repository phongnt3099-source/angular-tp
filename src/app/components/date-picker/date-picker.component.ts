import { Component, Input, forwardRef, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { CalendarModule } from 'primeng/calendar';
import { PrimeNGConfig } from 'primeng/api';

@Component({
    selector: 'date-picker',
    templateUrl: './date-picker.component.html',
    styleUrls: ['./date-picker.component.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, CalendarModule],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => DatePickerComponent),
            multi: true
        }
    ]
})
export class DatePickerComponent implements ControlValueAccessor, OnInit {
    @Input() placeholder: string = 'Chọn ngày sinh (DD/MM/YYYY)';
    @Input() required: boolean = false;
    @Input() disabled: boolean = false;
    
    // NHẬN DÙNG CHUNG CLASS TỪ BÊN NGOÀI TRUYỀN VÀO
    @Input() inputClass: string = 'form-control'; 
    @Input() maxDate: Date | null = null;

    innerValue: any;

    constructor(private primengConfig: PrimeNGConfig) {}

    ngOnInit() {
        this.primengConfig.setTranslation({
            dayNames: ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"],
            dayNamesShort: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
            dayNamesMin: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
            monthNames: ["Tháng Một", "Tháng Hai", "Tháng Ba", "Tháng Tư", "Tháng Năm", "Tháng Sáu", "Tháng Bảy", "Tháng Tám", "Tháng Chín", "Tháng Mười", "Tháng Mười Một", "Tháng Mười Hai"],
            monthNamesShort: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
            today: 'Hôm nay',
            clear: 'Xóa'
        });
    }

    onChange: any = () => {};
    onTouched: any = () => {};

    writeValue(value: any): void {
        if (value) {
            if (typeof value.toDate === 'function') {
                value = value.toDate();
            }
            this.innerValue = new Date(value);
            return;
        }
        this.innerValue = null;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    onDateSelect() {
        this.onChange(this.innerValue);
        this.onTouched();
    }
}