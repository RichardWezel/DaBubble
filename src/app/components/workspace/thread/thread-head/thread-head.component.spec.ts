import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreadHeadComponent } from './thread-head.component';

describe('ThreadHeadComponent', () => {
  let component: ThreadHeadComponent;
  let fixture: ComponentFixture<ThreadHeadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreadHeadComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ThreadHeadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
