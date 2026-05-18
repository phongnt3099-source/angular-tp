import { Component, Input, Output, EventEmitter, forwardRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
   <div class="tp-dropdown" (clickOutside)="isOpen = false" [class.is-disabled]="disable">
  <div class="tp-select-trigger" [class.active]="isOpen && !disable" (click)="toggle()" >
    <span [class.placeholder]="!selectedValue">
      {{ getDisplayLabel() || placeholder }}
    </span>
    <i class="fas fa-chevron-down arrow"></i>
  </div>

  <div class="tp-dropdown-panel" *ngIf="isOpen">
    <div class="search-sticky">
      <input 
        #searchInput
        type="text" 
        class="search-control" 
        placeholder="Tìm nhanh..." 
        [(ngModel)]="filterText"
        (click)="$event.stopPropagation()"
      >
    </div>
    
    <div class="options-container">
      @for (item of filteredList; track item[valueField]) {
        <div class="option-item" 
             [class.selected]="item[valueField] === selectedValue"
             (click)="select(item)">
          {{ getLabel(item) }}
          <i class="fas fa-check" *ngIf="item[valueField] === selectedValue"></i>
        </div>
      }
      <div *ngIf="filteredList.length === 0" class="no-data">
        Không tìm thấy dữ liệu
      </div>
    </div>
  </div>
</div>
  `,
  styleUrl:'./shared-dropdown.component.css'
})
export class SharedDropdownComponent {
  @Input() dataList: any[] = [];         // Mảng dữ liệu truyền vào (tỉnh thành, nguồn KH, nhãn...)
  @Input() labelField: string = 'name';   // Tên cột muốn hiển thị làm Label
  @Input() valueField= 'id';     // Tên cột muốn lấy giá trị làm Value
  @Input() placeholder = '';
  @Input() disable : boolean = false;

  @Input() selectedValue: any = '';       // Binding dữ liệu 2 chiều
  @Output() selectedValueChange = new EventEmitter<any>();
  @ViewChild('searchInput') searchInput!: ElementRef;

  isOpen = false;
  filterText = '';
  
   get filteredList() {
    return this.dataList.filter(item => 
      this.getLabel(item).toLowerCase().includes(this.filterText.toLowerCase())
    );
  }
  
  toggle() {
    if (this.disable) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.filterText = '';
      setTimeout(() => this.searchInput.nativeElement.focus(), 100);
    }
  }

 

  getLabel(item: any): string {
    if (this.labelField.includes('|')) {
        const fields = this.labelField.split('|');
        return fields.map(f => item[f]).join(' - ');
    }
    return item[this.labelField];
  }
  getDisplayLabel() {
      const selected = this.dataList.find(i => i[this.valueField] === this.selectedValue);
      return selected ? this.getLabel(selected) : '';
  }
  select(item: any) {
    if (this.disable) return;
    this.selectedValue = item[this.valueField];
    this.selectedValueChange.emit(this.selectedValue);
    this.isOpen = false;
  }

}
