import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelHeadComponent } from './channel-head.component';

describe('ChannelHeadComponent', () => {
  let component: ChannelHeadComponent;
  let fixture: ComponentFixture<ChannelHeadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelHeadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChannelHeadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
