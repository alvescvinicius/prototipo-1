import { Pipe, PipeTransform } from '@angular/core';
import { Section } from '../interfaces/section';
import { PageComponent } from '../interfaces/page-component';

@Pipe({
  name: 'totalComponents',
  standalone: true,
  pure: false
})
export class TotalComponentsPipe implements PipeTransform {

  transform(sections: Section[]): number {
    if (!sections?.length) return 0;
    return sections.reduce(
      (total, section) => total + this._count(section.pageComponents),
      0
    );
  }

  private _count(components: PageComponent[]): number {
    return components.reduce((acc, c) => {
      return acc + 1 + (c.children?.length ? this._count(c.children) : 0);
    }, 0);
  }

}
