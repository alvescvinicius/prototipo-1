import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InadimplentesComponent } from './inadimplentes.component';

describe('InadimplentesComponent', () => {
  let component: InadimplentesComponent;
  let fixture: ComponentFixture<InadimplentesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InadimplentesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InadimplentesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
