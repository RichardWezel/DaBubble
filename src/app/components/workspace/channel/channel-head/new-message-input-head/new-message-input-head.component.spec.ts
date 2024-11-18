import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewMessageInputHeadComponent } from './new-message-input-head.component';

describe('NewMessageInputHeadComponent', () => {
  let component: NewMessageInputHeadComponent;
  let fixture: ComponentFixture<NewMessageInputHeadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewMessageInputHeadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(NewMessageInputHeadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
