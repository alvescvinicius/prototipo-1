src/app
│
├── core
│   │
│   ├── interfaces
│   │   ├── application.interface.ts
│   │   ├── page.interface.ts
│   │   ├── section.interface.ts
│   │   ├── page.interface.ts
│   │   └── component-config.interface.ts
│   │
│   ├── services
│   │   ├── editor-state.service.ts
│   │   ├── application.service.ts
│   │   └── page.service.ts
│   │
│   └── constants
│       └── component-types.ts
│
├── editor
│   │
│   ├── pages
│   │   └── editor-page
│   │
│   ├── layout
│   │   ├── editor-header
│   │   ├── toolbox
│   │   ├── canvas
│   │   ├── properties
│   │   └── page-tree
│   │
│   ├── components
│   │   ├── text
│   │   ├── title
│   │   ├── button
│   │   ├── image
│   │   └── section
│   │
│   └── dialogs
│       ├── add-page-dialog
│       └── add-section-dialog
│
├── renderer
│   │
│   ├── components
│   │   ├── text-renderer
│   │   ├── button-renderer
│   │   ├── image-renderer
│   │   └── dynamic-renderer
│   │
│   └── pages
│       └── preview-page
│
├── shared
│   │
│   ├── components
│   │   ├── sidebar
│   │   ├── modal
│   │   ├── card
│   │   └── search-input
│   │
│   ├── pipes
│   │
│   └── directives
│
└── app.routes.ts

ng g c editor/pages/editor-page --standalone
ng g c renderer/pages/preview-page --standalone

ng g c editor/layout/editor-header --standalone
ng g c editor/layout/toolbox --standalone
ng g c editor/layout/canvas --standalone
ng g c editor/layout/properties --standalone
ng g c editor/layout/page-tree --standalone

ng g c editor/components/text --standalone
ng g c editor/components/title --standalone
ng g c editor/components/button --standalone
ng g c editor/components/image --standalone
ng g c editor/components/section --standalone

ng g c editor/dialogs/add-page-dialog --standalone
ng g c editor/dialogs/add-section-dialog --standalone

ng g c renderer/components/text-renderer --standalone
ng g c renderer/components/button-renderer --standalone
ng g c renderer/components/image-renderer --standalone
ng g c renderer/components/dynamic-renderer --standalone

ng g c shared/components/sidebar --standalone
ng g c shared/components/modal --standalone
ng g c shared/components/card --standalone
ng g c shared/components/search-input --standalone

ng g s core/services/editor-state
ng g s core/services/application
ng g s core/services/page

ng g interface core/interfaces/application
ng g interface core/interfaces/page
ng g interface core/interfaces/section
ng g interface core/interfaces/page
ng g interface core/interfaces/component-config

ng g class core/constants/component-types --type=const

ng g c editor/layout/device-toolbar --standalone
ng g c editor/layout/layers-panel --standalone
ng g c editor/layout/component-tree --standalone
ng g c editor/layout/page-properties --standalone

ng g s core/services/component-registry
ng g s core/services/drag-drop
ng g s core/services/history

ng g c editor/layout/editor-header
ng g c editor/layout/toolbox
ng g c editor/layout/canvas
ng g c editor/layout/properties
ng g c editor/layout/page-tree

ng g c editor/layout/editor-header --standalone
ng g c editor/layout/toolbox --standalone
ng g c editor/layout/canvas --standalone
ng g c editor/layout/properties --standalone
ng g c editor/layout/page-tree --standalone

ng g s core/services/editor-state

ng g interface core/interfaces/toolbox-item.interface
ng g interface core/interfaces/toolbox-group.interface
ng g interface core/interfaces/editor-node       
ng g interface core/interfaces/component-config
