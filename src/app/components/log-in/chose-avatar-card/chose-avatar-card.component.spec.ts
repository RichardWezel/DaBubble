import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChoseAvatarCardComponent } from './chose-avatar-card.component';

describe('ChoseAvatarCardComponent', () => {
  let component: ChoseAvatarCardComponent;
  let fixture: ComponentFixture<ChoseAvatarCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChoseAvatarCardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChoseAvatarCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
