import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Repo } from './repo';

describe('Repo', () => {
  let component: Repo;
  let fixture: ComponentFixture<Repo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Repo]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Repo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
