import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DmSectionComponent } from './dm-section.component';

describe('DmSectionComponent', () => {
  let component: DmSectionComponent;
  let fixture: ComponentFixture<DmSectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DmSectionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DmSectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
