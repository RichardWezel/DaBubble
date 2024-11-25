import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelMemberDialogComponent } from './channel-member-dialog.component';

describe('ChannelMemberDialogComponent', () => {
  let component: ChannelMemberDialogComponent;
  let fixture: ComponentFixture<ChannelMemberDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelMemberDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChannelMemberDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
