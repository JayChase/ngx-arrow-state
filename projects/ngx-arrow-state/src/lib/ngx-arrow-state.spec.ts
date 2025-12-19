import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxArrowState } from './ngx-arrow-state';

describe('NgxArrowState', () => {
  let component: NgxArrowState;
  let fixture: ComponentFixture<NgxArrowState>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxArrowState]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxArrowState);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
