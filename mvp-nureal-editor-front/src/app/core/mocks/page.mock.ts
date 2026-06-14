import { ComponentType } from '../enums/component-type.enum';

export const pageMock = {

  id: 'home',

  name: 'Home',

  sections: [

    {

      id: 'section-1',

      name: 'Contato',

      order: 1,

      pageComponents: [

        {

          id: 'form-1',

          type: ComponentType.FORM,

          name: 'Formulário',

          order: 1,

          children: [

            {
              id: 'input-1',
              type: ComponentType.INPUT,
              name: 'Nome',
              order: 1,
              children: [],
              config: {}
            },

            {
              id: 'input-2',
              type: ComponentType.INPUT,
              name: 'Email',
              order: 2,
              children: [],
              config: {}
            }

          ],

          config: {}

        }

      ]

    }

  ]

};
