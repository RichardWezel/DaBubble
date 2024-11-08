import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BackgroundWithSignInComponent } from './background-with-sign-in.component';

describe('BackgroundWithSignInComponent', () => {
  let component: BackgroundWithSignInComponent;
  let fixture: ComponentFixture<BackgroundWithSignInComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BackgroundWithSignInComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BackgroundWithSignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
