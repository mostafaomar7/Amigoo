import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SlimfitComponent } from './slimfit.component';

describe('SlimfitComponent', () => {
  let component: SlimfitComponent;
  let fixture: ComponentFixture<SlimfitComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SlimfitComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SlimfitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
