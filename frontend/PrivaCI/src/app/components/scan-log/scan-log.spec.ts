import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanLog } from './scan-log';

describe('ScanLog', () => {
  let component: ScanLog;
  let fixture: ComponentFixture<ScanLog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanLog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScanLog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
