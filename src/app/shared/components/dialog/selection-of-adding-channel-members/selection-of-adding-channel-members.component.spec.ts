import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectionOfAddingChannelMembersComponent } from './selection-of-adding-channel-members.component';

describe('SelectionOfAddingChannelMembersComponent', () => {
  let component: SelectionOfAddingChannelMembersComponent;
  let fixture: ComponentFixture<SelectionOfAddingChannelMembersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectionOfAddingChannelMembersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SelectionOfAddingChannelMembersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
