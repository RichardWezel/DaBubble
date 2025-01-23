import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultDropdownComponent } from './result-dropdown.component';

describe('ResultDropdownComponent', () => {
  let component: ResultDropdownComponent;
  let fixture: ComponentFixture<ResultDropdownComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResultDropdownComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResultDropdownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
