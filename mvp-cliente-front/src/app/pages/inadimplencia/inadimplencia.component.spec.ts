import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InadimplenciaComponent } from './inadimplencia.component';

describe('InadimplenciaComponent', () => {
  let component: InadimplenciaComponent;
  let fixture: ComponentFixture<InadimplenciaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InadimplenciaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InadimplenciaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
