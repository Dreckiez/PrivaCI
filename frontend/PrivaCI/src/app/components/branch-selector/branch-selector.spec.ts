import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BranchSelector } from './branch-selector';

describe('BranchSelector', () => {
  let component: BranchSelector;
  let fixture: ComponentFixture<BranchSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BranchSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BranchSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
