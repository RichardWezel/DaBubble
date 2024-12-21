import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddChannelMemberDialogComponent } from './add-channel-member-dialog.component';

describe('AddChannelMemberDialogComponent', () => {
  let component: AddChannelMemberDialogComponent;
  let fixture: ComponentFixture<AddChannelMemberDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddChannelMemberDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddChannelMemberDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
