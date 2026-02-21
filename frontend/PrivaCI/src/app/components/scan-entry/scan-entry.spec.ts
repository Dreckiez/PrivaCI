import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScanEntry } from './scan-entry';

describe('ScanEntry', () => {
  let component: ScanEntry;
  let fixture: ComponentFixture<ScanEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScanEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScanEntry);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
