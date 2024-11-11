import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateSeperatorComponent } from './date-seperator.component';

describe('DateSeperatorComponent', () => {
  let component: DateSeperatorComponent;
  let fixture: ComponentFixture<DateSeperatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateSeperatorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DateSeperatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
