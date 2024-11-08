import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendEmailCardComponent } from './send-email-card.component';

describe('SendEmailCardComponent', () => {
  let component: SendEmailCardComponent;
  let fixture: ComponentFixture<SendEmailCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SendEmailCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SendEmailCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
