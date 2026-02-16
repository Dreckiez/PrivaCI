import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RepoDetails } from './repo-details';

describe('RepoDetails', () => {
  let component: RepoDetails;
  let fixture: ComponentFixture<RepoDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RepoDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RepoDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
