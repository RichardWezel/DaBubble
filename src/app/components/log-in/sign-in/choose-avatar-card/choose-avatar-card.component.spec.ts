import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChooseAvatarCardComponent } from './choose-avatar-card.component';

describe('ChooseAvatarCardComponent', () => {
  let component: ChooseAvatarCardComponent;
  let fixture: ComponentFixture<ChooseAvatarCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChooseAvatarCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChooseAvatarCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
