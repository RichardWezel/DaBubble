import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMemberToChannelDialogComponent } from './add-member-to-channel-dialog.component';

describe('AddMemberToChannelDialogComponent', () => {
  let component: AddMemberToChannelDialogComponent;
  let fixture: ComponentFixture<AddMemberToChannelDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddMemberToChannelDialogComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddMemberToChannelDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
