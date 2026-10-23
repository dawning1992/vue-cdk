# Vue CDK

English | [简体中文](README.zh-CN.md)

Vue CDK is a Vue 3 component development kit inspired by [Angular CDK](https://material.angular.io/cdk/overview).

Vue CDK provides composable building blocks for component libraries and complex interfaces, including overlays, dialogs, drag and drop, steppers, trees, and virtual scrolling. It does not provide ready-made buttons, forms, or themes. Applications supply their own visual styles; structural styles are included.

For complete API documentation and runnable examples, see the [online documentation](https://dawning1992.github.io/vue-cdk).

## Features

- **Zero runtime dependencies**: Event streams use `Emitter` (`vue-cdk/emitter`) instead of RxJS.
- **Subpath imports**: All 19 modules have independent entry points and support tree shaking; the root entry exports only the version, as in Angular CDK
- **Written in TypeScript**: Published output includes complete `.d.ts` declarations
- **Structural styles available out of the box**: Automatically injected at runtime, `style.css` can also be introduced explicitly (with automatic injection and deduplication)
- **SSR safe**: Modules can be imported without `document`; platform detection and clipboard operations have defined fallback behavior
- **Angular CDK compatible APIs**: Most classes, configuration options, and event payloads retain their names and semantics

## Contents

- [Features](#features)
- [Installation and requirements](#installation-and-requirements)
- [Quick start](#quick-start)
- [Module overview](#module-overview)
- Modules: [accordion](#accordion) / [a11y](#a11y) / [bidi](#bidi) / [clipboard](#clipboard) / [coercion](#coercion) / [collections](#collections) / [dialog](#dialog) / [drag-drop](#drag-drop) / [emitter](#emitter) / [layout](#layout) / [observers](#observers) / [overlay](#overlay) / [platform](#platform) / [portal](#portal) / [scrolling](#scrolling) / [stepper](#stepper) / [text-field](#text-field) / [tree](#tree) / [virtual-tree](#virtual-tree)
- [Angular CDK mapping](#angular-cdk-mapping)
- [Development](#development)
- [Notes](#notes)
- [FAQ](#faq)
- [License](#license)

## Installation and requirements

Requires Vue 3.3+ and the Composition API. Install with npm, pnpm, or yarn:

```bash
npm install vue-cdk

pnpm add vue-cdk

yarn add vue-cdk
```

The root entry exports only the version:

```ts
import {version} from 'vue-cdk';

console.log(version);
```

Import features from their subpaths:

```ts
import {useOverlay} from 'vue-cdk/overlay';
import {VTree} from 'vue-cdk/tree';
```

See each module section and the documentation site for its exports.

## Quick start

### Declarative overlay dropdown

```vue
<script setup lang="ts">
import {ref} from 'vue';
import {STANDARD_DROPDOWN_BELOW_POSITIONS, VConnectedOverlay, VOverlayOrigin} from 'vue-cdk/overlay';

const open = ref(false);
</script>

<template>
  <VOverlayOrigin>
    <button @click="open = !open">Open menu</button>
    <VConnectedOverlay
      :open="open"
      :positions="STANDARD_DROPDOWN_BELOW_POSITIONS"
      @overlay-outside-click="open = false"
      @update:open="open = $event"
    >
      <div class="menu">
        <div class="menu-item">Menu item 1</div>
        <div class="menu-item">Menu item 2</div>
      </div>
    </VConnectedOverlay>
  </VOverlayOrigin>
</template>
```

`origin` can also directly pass elements, ref or coordinate points:

```vue
<VConnectedOverlay :open="open" :origin="triggerElement">
  ...
</VConnectedOverlay>
```

### Imperative modal dialog

```ts
import {useDialog} from 'vue-cdk/dialog';
import MyDialog from './MyDialog.vue';

const dialog = useDialog();

async function openConfirm() {
  const dialogRef = dialog.open(MyDialog, {
    data: {title: 'Delete this item?'},
    panelClass: 'my-dialog-panel',
  });
  const result = await dialogRef.closedPromise;
  console.log(result);
}
```

For a complete `MyDialog.vue` example, see [dialog](#dialog).

## Module overview

| Subpath | Module | Description | Structural Style Export |
| --- | --- | --- | --- |
| `vue-cdk/accordion` | accordion | Unstyled expansion coordination: `CdkAccordion` / `CdkAccordionItem` and `useAccordion()` / `useAccordionItem()` | — |
| `vue-cdk/a11y` | a11y | Accessibility: keyboard navigation (`ListKeyManager` series), focus trap (`FocusTrap`), focus source monitoring (`FocusMonitor`) | `vue-cdk/a11y/style.css` |
| `vue-cdk/bidi` | bidi | Text direction: `Directionality`, `VDir` / `Dir`, `useDirectionality()` and `provideDirectionality()` | — |
| `vue-cdk/clipboard` | clipboard | Clipboard: imperative `useClipboard()` / `Clipboard`, delayed copy `PendingCopy`, declarative `vCopyToClipboard` directives | — |
| `vue-cdk/coercion` | coercion | Type/value coercion tools (`coerceArray`, `coerceCssPixelValue`, `coerceElement`, `coerceNumberProperty`) | — |
| `vue-cdk/collections` | collections | Collection abstractions: `DataSource` / `ArrayDataSource` / `ListRange` / `CollectionViewer` / `SelectionModel` | — |
| `vue-cdk/dialog` | dialog | Modal dialog: imperative `useDialog()`, aligned Angular CDK `@angular/cdk/dialog` | `vue-cdk/dialog/style.css` |
| `vue-cdk/drag-drop` | drag-drop | Drag and drop sorting: `VDropList` / `VDrag` / `VDropListGroup` / `vDragHandle`, aligned Angular CDK `@angular/cdk/drag-drop` | `vue-cdk/drag-drop/style.css` |
| `vue-cdk/emitter` | emitter | Zero-dependency typed event emitter (`Emitter`) | — |
| `vue-cdk/layout` | layout | Responsive layout: `Breakpoints`, `MediaMatcher`, `BreakpointObserver` and `useBreakpoints()` | — |
| `vue-cdk/observers` | observers | DOM content observation: `ContentObserver`, `useObserveContent()` and `vCdkObserveContent` sharing `MutationObserver` | — |
| `vue-cdk/overlay` | overlay | Overlay panel: imperative `useOverlay()` + declarative `VConnectedOverlay` / `VOverlayOrigin` | `vue-cdk/overlay/style.css` |
| `vue-cdk/platform` | platform | Platform capability detection and event tools: `Platform` service (browser/engine identification + `usePlatform` injection), `getSupportedInputTypes`, Shadow DOM / Popover / scroll-behavior detection | — |
| `vue-cdk/portal` | portal | Programmable content mounting: `Portal` classes, `TemplateRef` template sources, and `VPortal` / `VPortalOutlet`; the foundation for overlay/dialog | — |
| `vue-cdk/scrolling` | scrolling | Scroll capabilities: scroll distribution, container and viewport measurement, and fixed size/variable height virtual scrolling (`VVirtualScrollViewport` / `VVirtualFor`) | `vue-cdk/scrolling/style.css` |
| `vue-cdk/stepper` | stepper | Styleless multi-step process: linear validation, keyboard navigation, step status and universal form adaptation contract | — |
| `vue-cdk/text-field` | text-field | Text field: textarea auto-scaling, browser auto-fill monitoring, and Composition API/command/Sass entry | `vue-cdk/text-field/style.css` |
| `vue-cdk/tree` | tree | Tree structure: `VTree` / `VTreeNode` / `VNestedTreeNode` / `vTreeNodeToggle` / `vTreeNodePadding`, aligned Angular CDK `@angular/cdk/tree` | — |
| `vue-cdk/virtual-tree` | virtual-tree | Virtual scrolling tree: `VVirtualScrollTree`, two data modes of full/lazy loading, independent paging and scrolling boundary loading for each layer, reusing scrolling virtual scrolling and tree node capabilities | — |

## accordion

Aligns the state coordination semantics of the Angular CDK accordion, which does not provide visual styles, animations, or a fixed accessibility DOM.
The Vue version provides both unstyled components and Composition API functions:

```vue
<script setup lang="ts">
import {CdkAccordion, CdkAccordionItem} from 'vue-cdk/accordion';
</script>

<template>
  <CdkAccordion>
    <CdkAccordionItem v-slot="item">
      <button :aria-expanded="item.expanded" @click="item.toggle">Title</button>
      <div v-show="item.expanded" role="region">Content</div>
    </CdkAccordionItem>
  </CdkAccordion>
</template>
```

`multi` enables multiple selection; the container instance provides `openAll()` / `closeAll()`, sub-item support
`v-model:expanded`, `disabled` and `open()` / `close()` / `toggle()`.

## a11y

`@angular/cdk/a11y`, ported from Angular CDK, provides three theme capabilities: keyboard navigation, focus trap and focus source monitoring.
The core classes maintain the same Angular API semantics (RxJS is replaced by zero dependency `Emitter`) and provide Vue-specific
Combined functions (`useFocusTrap` / `useFocusMonitor`) and directives (`vFocusTrap` / `vFocusMonitor`).

### Features

- Keyboard navigation: `ListKeyManager` / `FocusKeyManager` / `ActiveDescendantKeyManager` / `Typeahead`, entry source supports array or `Ref`
- Focus trap: `FocusTrap` / `ConfigurableFocusTrap` / `FocusTrapManager` / `InteractivityChecker` and inert strategy, supports directives and combined dual entries, nested modal boxes
- Focus source: `FocusMonitor` / `InputModalityDetector`, automatically maintains `vcdk-*` focus class, supports `.subtree` modifier

### Quick start

#### Keyboard navigation: ListKeyManager family

```vue
<script setup lang="ts">
import {onBeforeUnmount, ref} from 'vue';
import {ListKeyManager, type ListKeyManagerOption} from 'vue-cdk/a11y';

interface Item extends ListKeyManagerOption {
  id: string;
  getLabel(): string;
}

const items = ref<Item[]>([]);
const manager = new ListKeyManager(items).withWrap().withTypeAhead();

function onKeydown(event: KeyboardEvent) {
  manager.onKeydown(event);
}

onBeforeUnmount(() => manager.destroy());
</script>

<template>
  <ul tabindex="0" @keydown="onKeydown">
    <li v-for="(item, index) in items" :key="item.id"
        :class="{active: index === manager.activeItemIndex}">
      {{ item.getLabel() }}
    </li>
  </ul>
</template>
```

`FocusKeyManager` (active item automatically `focus(origin)`) and `ActiveDescendantKeyManager`
(Active item automatic switching `setActiveStyles` / `setInactiveStyles`) is also available.

#### Focus trapping: FocusTrap

Declarative (directive):

```vue
<div v-focus-trap.autoCapture role="dialog" aria-modal="true">
</div>
```

Imperative/combined (configurable trap access stack management, supports nested modal boxes):

```ts
import {ref} from 'vue';
import {useFocusTrap} from 'vue-cdk/a11y';

const modalRoot = ref<HTMLElement | null>(null);
const {enabled, focusInitial, destroy} = useFocusTrap(modalRoot, {configurable: true});
```

Region tag: `vcdk-focus-initial` specifies the initial focus element, `vcdk-focus-region-start/end`
Specify the first/last tab boundary (corresponding to Angular's `cdkFocusInitial` / `cdkFocusRegionStart|End`).

#### Focus origin: FocusMonitor

```vue
<input v-focus-monitor="origin => console.log(origin)" />
<div v-focus-monitor.subtree> </div>
```

```ts
import {useFocusMonitor} from 'vue-cdk/a11y';

const monitor = useFocusMonitor();
const unsubscribe = monitor.monitor(inputRef).subscribe(origin => {
  // origin: 'mouse' | 'keyboard' | 'touch' | 'program' | null
});
```

The monitor will automatically maintain the focus classes: `vcdk-focused`, `vcdk-mouse-focused`,
`vcdk-keyboard-focused`, `vcdk-touch-focused`, `vcdk-program-focused`.

### Key APIs

#### Angular ↔ Vue API mapping

| Angular(`@angular/cdk/a11y`) | Vue CDK(`vue-cdk/a11y`) |
| --- | --- |
| `ListKeyManager` | `ListKeyManager` (entry source supports array or `Ref`) |
| `FocusKeyManager` / `ActiveDescendantKeyManager` / `Typeahead` | Class with the same name |
| `CdkTrapFocus` command | `vFocusTrap` command + `useFocusTrap()` |
| `FocusTrapFactory` / `ConfigurableFocusTrapFactory` | Class with the same name + module-level singleton |
| `FocusTrapManager` / `FocusTrapInertStrategy` / `EventListenerFocusTrapInertStrategy` | Classes with the same name (strategies are injected through factory/combined options) |
| `InteractivityChecker` | `InteractivityChecker` + module-level singleton |
| `CdkMonitorFocus` directive | `vFocusMonitor` directive (`.subtree` modifier corresponds to `cdkMonitorSubtreeFocus`) |
| `FocusMonitor` / `InputModalityDetector` | Class with the same name + `useFocusMonitor()` + module-level singleton |
| `FocusMonitorDetectionMode` | Enumeration with the same name (IMMEDIATE / EVENTUAL) |

#### CSS class mapping

| Angular | Vue CDK |
| --- | --- |
| `cdk-focused` / `cdk-mouse-focused` / `cdk-keyboard-focused` / `cdk-touch-focused` / `cdk-program-focused` | `vcdk-focused` / `vcdk-mouse-focused` / `vcdk-keyboard-focused` / `vcdk-touch-focused` / `vcdk-program-focused` |
| `cdk-visually-hidden` / `cdk-focus-trap-anchor` | `vcdk-visually-hidden` / `vcdk-focus-trap-anchor` |
| `cdkFocusInitial` / `cdkFocusRegionStart` / `cdkFocusRegionEnd` | `vcdk-focus-initial` (or `vcdkFocusInitial`) / `vcdk-focus-region-start` / `vcdk-focus-region-end` |
| `div.cdk-overlay-pane` exempt | `div.vcdk-overlay-pane` exempt |

The structural style (`.vcdk-visually-hidden`) is automatically injected with the `vue-cdk/a11y` entrance;
`vue-cdk/a11y/style.css` can also be introduced explicitly (will automatically inject and remove duplicates).
The focus source class is only responsible for marking, and the specific visual style is defined by the user (the "Accessibility" page of the documentation site shows an example of color coding).

## bidi

Aligning orientation context, partial overrides and change notifications for Angular CDK bidi. Vue custom directive cannot be
Descendants inject the provider, so use the unstyled `VDir` component to host the local direction:

```vue
<script setup lang="ts">
import {VDir, useDirectionality} from 'vue-cdk/bidi';

const directionality = useDirectionality();
</script>

<template>
  <p>Application direction: {{ directionality.valueSignal.value }}</p>
  <VDir dir="rtl" v-slot="{direction}">
    Local direction: {{ direction }}
    <VDir dir="ltr">Nested region overrides to LTR</VDir>
  </VDir>
</template>
```

`Dir` is the Angular alias of `VDir`. `provideDirectionality(refOrGetter)` can be used to build
Custom Composition API container; `DIR_DOCUMENT` supports iframes, tests and SSR. `auto` by browser
Language parsing, text content is not scanned; invalid input and no DOM environment fallback to `ltr`.

## clipboard

Clipboard capabilities aligned with the Angular CDK clipboard: imperative copy, deferred copy, and declarative copy directives.

### Features

- API aligned with Angular CDK clipboard: `Clipboard` class (`copy` / `beginCopy`), singleton `clipboard`, combined `useClipboard()`, delayed copy `PendingCopy`
- Declarative `vCopyToClipboard` directive: string abbreviation `v-copy-to-clipboard="text"` or object `{text, attempts, onCopied}`, click to copy
- Large text retry: `attempts` default 1, upper limit 50 (consistent with Angular), `beginCopy` retries at 1ms interval after preloading the textarea, and can automatically retry when the browser refuses to copy.
- Global default configuration: `CDK_COPY_TO_CLIPBOARD_CONFIG` injection key + `provideCopyToClipboardConfig()`, App-level or component-level provide can be used
- The copy mechanism is the same as Angular: hide textarea + `execCommand('copy')`, return success or failure synchronously, restore focus after copying; does not rely on `navigator.clipboard`
- SSR security: `copy()` returns `false` when there is no `document`, `beginCopy()` throws a clear error, and the module can be imported safely

### Quick start

First register the directive globally (or register it locally in `directives` using the component):

```ts
import {createApp} from 'vue';
import {vCopyToClipboard} from 'vue-cdk/clipboard';

const app = createApp(App);
app.directive('copy-to-clipboard', vCopyToClipboard);
```

```vue
<script setup lang="ts">
import {ref} from 'vue';

const text = ref('Text to copy');
const copied = ref<boolean | null>(null);

function onCopied(successful: boolean) {
  copied.value = successful;
}
</script>

<template>
  <button v-copy-to-clipboard="text">Copy</button>

  <button v-copy-to-clipboard="{text, attempts: 3, onCopied}">Retry copy</button>
  <span v-if="copied !== null">{{ copied ? 'Copy succeeded' : 'Copy failed' }}</span>
</template>
```

Imperative copy:

```ts
import {useClipboard} from 'vue-cdk/clipboard';

const clipboard = useClipboard();
const successful = clipboard.copy('Content'); // true | false
```

## coercion

`@angular/cdk/coercion`, ported from Angular CDK, provides the ability to normalize external inputs into arrays, CSS sizes,
A conversion tool between elements and numbers, often used for boundary processing of component props.

### Features

- `coerceArray`: Single value/array/null value are unified into array (`null`/`undefined` returns empty array)
- `coerceCssPixelValue`: The number is appended to `px`, the string is returned as is, and the null value returns an empty string (convenient for clearing inline styles)
- `coerceElement`: The element or its ref is normalized to the element, and an explicit exception is thrown when the ref is currently empty.
- `coerceNumberProperty`: parsed as a number, returns the bottom value if it cannot be parsed (default `0`)
- `ElementOrRef` type: Union type of element or its reactive reference, normalized imperative and declarative calling forms

### Quick start

```ts
import {ref} from 'vue';
import {coerceArray, coerceCssPixelValue, coerceElement, coerceNumberProperty} from 'vue-cdk/coercion';

coerceArray(null);          // []
coerceArray('a');           // ['a']
coerceArray(['a', 'b']);    // ['a', 'b']

coerceCssPixelValue(16);    // '16px'
coerceCssPixelValue('50%'); // '50%'

coerceNumberProperty('42');     // 42
coerceNumberProperty('abc', 10); // 10

const el = ref<HTMLElement | null>(null);
const element = coerceElement(el);
```

### Key APIs

| Members | Signature | Description |
| --- | --- | --- |
| `coerceArray` | `coerceArray<T>(value: T \| T[] \| null \| undefined): T[]` | Single values or arrays are unified into arrays, and empty values return empty arrays |
| `coerceCssPixelValue` | `coerceCssPixelValue(value: number \| string \| null \| undefined): string` | The number is appended with `px`, the string is returned as is, and the empty value is returned as an empty string |
| `coerceElement` | `coerceElement<T extends HTMLElement>(value: T \| Ref<T \| null \| undefined>): T` | Elements or refs are normalized to elements, and an error is thrown when ref is empty |
| `coerceNumberProperty` | `coerceNumberProperty(value: unknown, fallback = 0): number` | Forced conversion to a number, use the bottom value when it cannot be parsed |
| `ElementOrRef` | `type ElementOrRef<T extends HTMLElement = HTMLElement> = T \| Ref<T \| null \| undefined>` | The union type of the element or its ref |

## collections

`@angular/cdk/collections`, transplanted from Angular CDK, provides data source abstraction, view protocol and selection model.
For virtual scrolling, tree and other consumer and business code reuse.

### Features

- `DataSource` abstraction + `ArrayDataSource` (packaging ordinary array, reactive array or `Emitter` data stream) + `isDataSource` structure determination
- `CollectionViewer` / `ListRange`: Collection view protocol, `viewChange` is dispatched when the viewed data range changes
- `SelectionModel`: single/multiple selection, batch operation, custom equality comparison; internal `shallowRef` storage, reading `selected` can be tracked responsively

### Quick start

```ts
import {ref} from 'vue';
import {ArrayDataSource, SelectionModel} from 'vue-cdk/collections';

const items = ref(['A', 'B', 'C']);
const dataSource = new ArrayDataSource(items);
const unsubscribe = dataSource.connect().subscribe(data => {
  console.log(data); // ['A', 'B', 'C']
});
unsubscribe();

const selection = new SelectionModel<string>(true);
selection.select('A', 'B');
selection.changed.subscribe(change => {
  console.log(change.added, change.removed);
});
selection.toggle('C');
console.log(selection.selected); // ['A', 'B', 'C']
```

### Key APIs

| Members | Description |
| --- | --- |
| `DataSource<T>` | Data source abstract base class: `connect` returns a subscribable data stream, `disconnect` releases resources; the same viewer should not be connected repeatedly |
| `ArrayDataSource<T>` | Array data source: The array dispatches the first value in a microtask after connect; `Ref` continues to dispatch with reactive changes (deep watch); `Emitter` directly transmits transparently |
| `ArrayDataSourceInput<T>` | `readonly T[] \| Ref<readonly T[]> \| Emitter<readonly T[]>` three packaging forms |
| `isDataSource` | Structural check (the `connect` method is sufficient), and you can access consumers such as virtual scrolling without inheritance |
| `CollectionViewer` | `{viewChange: Emitter<ListRange>}` view contract |
| `ListRange` | `{start, end}` index interval (start inclusive, end exclusive) |
| `SelectionModel<T>` | Selection model: `select` / `deselect` / `toggle` / `isSelected` / `setSelection` / `clear` / `sort`; `bulk` batch entry; `changed` is `Emitter<SelectionChange>`; `compareWith` Custom equality comparison |
| `SelectionChange<T>` | `{source, added, removed}` selection change payload |
| `getMultipleValuesInSingleSelectionError` | The error factory thrown when multiple values are passed in the single-selection mode |

## dialog

Ported from Angular CDK's `@angular/cdk/dialog`. Open a modal with `useDialog()`; its `DialogRef` exposes the result and event streams. Content receives data through `provide/inject` (`DIALOG_DATA` / `DIALOG_REF`) or `contentProps`. The default `VDialogContainer` handles focus trapping, `autoFocus` / `restoreFocus`, ARIA attributes, and scroll blocking. Pass `config.container` to use a custom container built with `useDialogContainerCore`.

### Quick start

```vue
<!-- MyDialog.vue -->
<script setup lang="ts">
import {useDialogData, useDialogRef} from 'vue-cdk/dialog';

const data = useDialogData<{title: string}>();
const dialogRef = useDialogRef<string>();
</script>

<template>
  <div class="my-dialog">
    <h3>{{ data.title }}</h3>
    <button @click="dialogRef.close('Confirm')">Confirm</button>
    <button @click="dialogRef.close('Cancel')">Cancel</button>
  </div>
</template>
```

```ts
import {useDialog} from 'vue-cdk/dialog';
import MyDialog from './MyDialog.vue';

const dialog = useDialog();
async function openConfirm() {
  const dialogRef = dialog.open<string>(MyDialog, {
    data: {title: 'Delete this item?'},
    panelClass: 'my-dialog-panel',
  });

  console.log(dialogRef.id);
  const result = await dialogRef.closedPromise;
  console.log(result); // 'Confirm' | 'Cancel' | undefined
}
```

Use `dialogRef.closed.subscribe(listener)` to react to closing events. For a single result, await `closedPromise`.

Content may be a component, render function, or VNode. A render function corresponds to Angular's `TemplateRef` and receives a context containing `$implicit` (the data), `dialogRef`, and values from `templateContext`.

### Shared backdrop and z-index management

Dialogs opened by the same Dialog service share one `.vcdk-overlay-backdrop`. The service maintains their z-index order:

- Each dialog host uses `base + 2 × rank`, where rank starts at 1. `base` comes from the container's `--vcdk-overlay-container-z-index` CSS variable and defaults to 1000.
- The shared backdrop uses `base + 2 × (topRank − 1) + 1`. It sits below the topmost dialog with a backdrop and above lower dialogs. Closing the top dialog lowers the backdrop so the next dialog becomes visible.
- Backdrop clicks reach only the topmost participating dialog through `DialogRef.backdropClick`. Its `backdropClass` controls the shared backdrop. If any participating dialog sets `disableAnimations`, the backdrop uses no-op animations.

When native Popover is available and enabled, dialogs render in the top layer. The shared backdrop moves into the top dialog host; top-layer order determines stacking. Otherwise, the backdrop is a child of the overlay container and z-index places it between dialogs.

Only dialogs participate in this z-index scheme. In container mode, tooltips and dropdowns retain their own z-index and may appear below a dialog. In Popover mode, the top layer determines their order. For dialogs, `DialogRef.overlayRef.backdropElement` is always `null` because the Dialog service owns the shared backdrop.

### Key APIs

#### Common configuration (`DialogConfig`)

| Field | Default Value | Description |
| --- | --- | --- |
| `id` / `role` | Automatically generated / `'dialog'` | Unique id and ARIA role (can be set to `'alertdialog'`) |
| `data` | `null` | Data injected into the content (`useDialogData` / `contentProps` dual channel) |
| `panelClass` / `backdropClass` / `hasBackdrop` | `''` / `''` / `true` | Panels, masks and backdrop toggle |
| `disableClose` / `closePredicate` | `false` / — | Closing restrictions; `closePredicate` returns false to prevent closing and recapturing focus |
| `width/height/minWidth/minHeight/maxWidth/maxHeight` | — | Panel size (numbers in pixels) |
| `autoFocus` | `'first-tabbable'` | `'dialog'` / `'first-heading'` / CSS selector / `false` |
| `restoreFocus` | `true` | Restore focus after closing: `boolean` / CSS selector / `HTMLElement` |
| `scrollStrategy` / `closeOnNavigation` | block / `true` | Scrolling strategy and routing navigation closed |
| `closeOnOverlayDetachments` | `true` | Whether the overlay is closed when it is externally detached |
| `disableAnimations` / `direction` | `false` / Root element dir | Animation switch and text direction |
| `container` | `VDialogContainer` | Custom container component (reuse `useDialogContainerCore`) |
| `contentProps` / `templateContext` | — | Content props (Vue-specific) and rendering function context |

#### Service and references

- `useDialog()` / `dialogService` expose `open(content, config?)`, `closeAll()`, `getDialogById(id)`, `openDialogs`, `afterOpened`, and `afterAllClosed`. As in Angular, `afterAllClosed` fires immediately on subscription if no dialog is open.
- `DialogRef` exposes `close(result?, {focusOrigin?})`, `closedPromise`, and the `closed`, `backdropClick`, `keydownEvents`, and `outsidePointerEvents` event streams. `backdropClick` fires only for the topmost dialog participating in the shared backdrop. It also provides `updatePosition()`, `updateSize()`, `addPanelClass()`, and `removePanelClass()`.
- Structural CSS is injected when a dialog opens. You can also import `vue-cdk/dialog/style.css` explicitly.

## drag-drop

`@angular/cdk/drag-drop` ported from Angular CDK: declarative drag-and-drop sorting component, imperative
`DragRef` / `DropListRef`, input aligned with event payload Angular.

### Features

- Complete API corresponding to Angular CDK drag-drop: declarative `VDropList` / `VDrag` components, `vDragHandle` handle directives, `VDropListGroup` grouping, imperative `createDragRef` / `createDropListRef` / `DragRef` / `DropListRef` / `DragDropRegistry`
- All inputs are aligned with event payload Angular: `lockAxis` / `boundaryElement` / `constrainPosition` / `dragStartDelay` / `freeDragPosition` / `previewClass` / `previewContainer` / `scale` / `rootElementSelector`; `started` / `released` / `ended` / `entered` / `exited` / `dropped` / `moved` / `sorted` event carrying `previousIndex` / `currentIndex` / `container` / `previousContainer` / `isPointerOverContainer` / `distance` / `dropPoint` and other fields
- Sorting capabilities: vertical/horizontal (including RTL visual order reversal), `mixed` line wrapping grid, `connectedTo` and grouping cross-container transmission, `enterPredicate` / `sortPredicate`, edge automatic scrolling, `sortingDisabled` / `disabled` / `hasAnchor`
- Custom preview and placeholder: `#preview="{data}"` / `#placeholder="{data}"` slot, supports `previewMatchSize` to align the original item size
- Structural styles are automatically injected out of the box; `vue-cdk/drag-drop/style.css` can also be introduced explicitly

### Quick start

```vue
<script setup lang="ts">
import {ref} from 'vue';
import {moveItemInArray, VDrag, VDropList} from 'vue-cdk/drag-drop';
import type {VDragDrop} from 'vue-cdk/drag-drop';

const items = ref(['A', 'B', 'C']);

function onDrop(event: VDragDrop<string>) {
  moveItemInArray(items.value, event.previousIndex, event.currentIndex);
}
</script>

<template>
  <VDropList :data="items" @dropped="onDrop">
    <VDrag v-for="item in items" :key="item" :data="item">{{ item }}</VDrag>
  </VDropList>
</template>
```

#### Transfer between containers

```ts
import {transferArrayItem} from 'vue-cdk/drag-drop';

function onDrop(event: VDragDrop<string>) {
  transferArrayItem(
    event.previousContainer.data as string[],
    event.container.data as string[],
    event.previousIndex,
    event.currentIndex,
  );
}
```

## emitter

Zero-dependency typed event emitter, semantically aligned with RxJS `Subject`. Event flow of each module
(`changed` / `closed` / `backdropClick`, etc.) are all implemented based on it, and users can also directly use it for business communication.

### Features

- `subscribe(listener)` returns the unsubscribe function, repeated unsubscription is idempotent
- `next(value)` is distributed synchronously, traverses subscription snapshots, and can be safely unsubscribed during callbacks
- `complete()` ends the event stream and clears the listener. Subsequent subscriptions are rejected.
- `hasListeners` determines whether there is a listener (the dispatcher skips the empty stream accordingly)

### Quick start

```ts
import {Emitter} from 'vue-cdk/emitter';

const emitter = new Emitter<string>();
const unsubscribe = emitter.subscribe(value => console.log(value));

emitter.next('hello'); // hello
unsubscribe();
emitter.next('world');

const done = new Emitter<void>();
done.complete();
done.subscribe(() => console.log('never'));
```

### Key APIs

| Members | Description |
| --- | --- |
| `Emitter<T = void>` | Typed event emitter; `subscribe` returns the idempotent unsubscription function, `next` dispatches it synchronously, `complete` rejects new subscriptions, and `hasListeners` can determine whether the listener exists |

## observers

DOM content change observation capability, corresponding to Angular CDK `@angular/cdk/observers`. Multiple subscriptions to the same element share the underlying
`MutationObserver`, automatically disconnected after the last subscription is canceled; only changes caused by Vue annotation anchors will be filtered.

### Quick start

```vue
<script setup lang="ts">
import {ref} from 'vue';
import {useObserveContent} from 'vue-cdk/observers';

const content = ref<Element | null>(null);
const changeCount = ref(0);

useObserveContent(content, records => {
  changeCount.value += records.length;
}, {debounce: 100});
</script>

<template>
  <div ref="content">Observed content</div>
  <p>Observed {{ changeCount }} changes</p>
</template>
```

Directives can also be used in templates (Vue will automatically expose them to the template after importing them in `<script setup>`):

```vue
<script setup lang="ts">
import {vCdkObserveContent} from 'vue-cdk/observers';
</script>

<div v-cdk-observe-content="records => console.log(records)">...</div>
```

Core exports include `ContentObserver` / `contentObserver`, `useObserveContent()`,
`vCdkObserveContent` / `cdkObserveContent`, `provideContentObserver()` and
`MutationObserverFactory`. When the SSR or runtime environment is missing `MutationObserver`, the service can be created safely, but no change notification will be generated.

## layout

Aligns Angular CDK `@angular/cdk/layout` and provides Vue 3 Composition API reactive bridge:

```vue
<script setup lang="ts">
import {Breakpoints, useBreakpoints} from 'vue-cdk/layout';

const {matches: isHandset, breakpoints} = useBreakpoints(Breakpoints.Handset);
</script>

<template>
  <nav :class="{compact: isHandset}">Handset: {{ breakpoints }}</nav>
</template>
```

Imperative code preserves Angular-style subscriptions:

```ts
import {BreakpointObserver} from 'vue-cdk/layout';

const observer = new BreakpointObserver();
const subscription = observer.observe(['(orientation: portrait)', '(prefers-reduced-motion: reduce)'])
  .subscribe(state => console.log(state.matches, state.breakpoints));

subscription.unsubscribe();
observer.destroy();
```

`BreakpointObserver` will reuse the native listener for the same query and merge and dispatch multiple changes in the same task.
`MediaMatcher` uses safe empty implementation under SSR; SSR should provide services separately for each application instance to avoid sharing across requests.

## overlay

Floating surface panel system: imperative `useOverlay()` + declarative `VConnectedOverlay` / `VOverlayOrigin`.

### Features

- Complete API corresponding to Angular CDK Overlay: `OverlayConfig`, `OverlayRef`, `GlobalPositionStrategy`, `FlexibleConnectedPositionStrategy`, four scroll strategies, backdrop, keyboard/external click dispatcher
- Automatic selection of connection positioning: automatic flipping if the candidate position cannot fit, flexible size constraints, push back to screen, position locking, RTL support, offset/viewportMargin, transform-origin animation anchor point
- Zero dependence on the event system (self-developed typed event emitter, does not rely on RxJS)
- Structural styles are automatically injected out of the box; `vue-cdk/overlay/style.css` can also be introduced explicitly
- Supports native Popover API (`usePopover`), automatically downgrades to container rendering when the browser does not support it

### Key APIs

#### `useOverlay()`

Corresponding to Angular's `Overlay` service, call it in the component setup:

| Members | Description |
| --- | --- |
| `create(config?)` | Create and return `OverlayRef` (caller app context will be captured, imperative content supports app-level provide) |
| `position()` | Return to positioning builders: `global()` and `flexibleConnectedTo(origin)` |
| `scrollStrategies` | Scroll strategy Factory: `noop()` / `close(config?)` / `block()` / `reposition(config?)` |

#### `OverlayConfig`

| Field | Default Value | Description |
| --- | --- | --- |
| `positionStrategy` | — | Positioning strategy (`PositionStrategy` interface) |
| `scrollStrategy` | `noop` | Scroll strategy |
| `panelClass` / `backdropClass` | `''` / `'vcdk-overlay-dark-backdrop'` | Panel/backdrop custom class |
| `hasBackdrop` | `false` | Whether to enable backdrop |
| `disableAnimations` | `false` | Whether to disable backdrop animation |
| `width/height/minWidth/minHeight/maxWidth/maxHeight` | — | Panel size (numbers in pixels) |
| `direction` | Root element `dir` | `'ltr'` / `'rtl'` |
| `disposeOnNavigation` | `false` | Automatically destroyed during route navigation (popstate/hashchange) |
| `usePopover` | `true` (when capability is available) | Whether to render in native Popover |
| `eventPredicate` | — | Determines whether the overlay receives dispatched events |

#### `OverlayRef`

| Method/Property | Description |
| --- | --- |
| `attach(content?)` | Mounted content (VNode or rendering function; if not passed, Teleport is responsible for rendering) |
| `detach()` / `dispose()` / `hasAttached()` | Uninstall / Destroy / Status Query |
| `updatePosition()` / `updatePositionStrategy()` / `updateScrollStrategy()` | Update positioning and strategy |
| `updateSize()` / `setDirection()` | Update size and orientation |
| `addPanelClass()` / `removePanelClass()` | Panel management |
| `overlayElement` / `hostElement` / `backdropElement` | Panel / Host / Mask Element |
| `attachments()` / `detachments()` / `backdropClick()` / `keydownEvents()` / `outsidePointerEvents()` | Event stream (subscription returns unsubscribe function) |

#### Position strategies

- `GlobalPositionStrategy`: `top()/bottom()/left()/right()/start()/end()/centerHorizontally()/centerVertically()/width()/height()`
- `FlexibleConnectedPositionStrategy`: `setOrigin()`, `withPositions()`, `withViewportMargin()`, `withFlexibleDimensions()`, `withGrowAfterOpen()`, `withPush()`, `withLockedPosition()`, `withDefaultOffsetX/Y()`, `withTransformOriginOn()`, `withScrollableContainers()`, `withPopoverLocation()`, `reapplyLastPosition()`, `positionChanges`

Standard position constants: `STANDARD_DROPDOWN_BELOW_POSITIONS`, `STANDARD_DROPDOWN_ADJACENT_POSITIONS`.

#### `VConnectedOverlay` component

Main props: `open`, `origin`, `positions`, `positionStrategy`, `offsetX/offsetY`, `width/height/minWidth/minHeight/maxWidth/maxHeight`, `backdropClass`, `panelClass`, `viewportMargin`, `scrollStrategy`, `disableClose`, `transformOriginSelector`, `hasBackdrop`, `lockPosition`, `flexibleDimensions`, `growAfterOpen`, `push`, `disposeOnNavigation`, `usePopover`, `matchWidth`, `direction`.

emits: `backdropClick`, `positionChange`, `attach`, `detach`, `overlayKeydown`, `overlayOutsideClick`, `update:open`.

## platform

Platform capability detection and event tools: browser/engine identification, input type detection, Shadow DOM penetration and modifier key judgment.

### Features

- Align Angular CDK `Platform` service: `Platform` class (`isBrowser` / `EDGE` / `TRIDENT` / `BLINK` / `WEBKIT` / `IOS` / `FIREFOX` / `ANDROID` / `SAFARI`, construction-time snapshot) + Global singleton `platform` + `createPlatform({userAgent})` factory
- Combined injection: `usePlatform()` returns the current scope instance, `providePlatform()` component-level coverage, and App-level `app.provide(CDK_PLATFORM, platform)` (corresponding to Angular `PlatformModule`)
- `getSupportedInputTypes()`: Returns the `<input>` type set supported by the current browser, and caches the results; returns the complete candidate set under SSR
- `isTestEnvironment()`: detect `__karma__` / `jasmine` / `jest` / `Mocha` global tags (corresponding to Angular `_isTestEnvironment`)
- Other capabilities: Shadow DOM penetration (`getEventTargetPierceShadowDom` / `getFocusedElementPierceShadowDom` / `getShadowRoot`), passive monitoring normalization, RTL scroll axis detection, `hasModifierKey` modifier key judgment, all can be safely called in SSR environment

### Quick start

```vue
<script setup lang="ts">
import {createPlatform, getSupportedInputTypes, isTestEnvironment, usePlatform} from 'vue-cdk/platform';

const platform = usePlatform();

const serverPlatform = createPlatform({userAgent: ''});

const supportedInputTypes = Array.from(getSupportedInputTypes());
const inTestEnv = isTestEnvironment();
</script>

<template>
  <p>Blink: {{ platform.BLINK }}; Safari: {{ platform.SAFARI }}</p>
  <p>Supported input types: {{ supportedInputTypes.join(', ') }}; test environment: {{ inTestEnv }}</p>
</template>
```

App-level injection (equivalent to Angular introducing `PlatformModule`):

```ts
import {createApp} from 'vue';
import {CDK_PLATFORM, platform} from 'vue-cdk/platform';

const app = createApp(App);
app.provide(CDK_PLATFORM, platform);
```

## portal

Programmable content mounting system: three content sources (Portal) and unified outlet (PortalOutlet), overlay/dialog is built based on it.

### Features

- Ported from Angular CDK `@angular/cdk/portal`: `Portal` abstract class and `ComponentPortal` / `TemplatePortal` / `DomPortal` three content sources; `PortalOutlet` interface and `BasePortalOutlet` / `DomPortalOutlet` two types of exports
- Declarative components: `VPortal` (no rendering template source, capture slot is `TemplatePortal`) and `VPortalOutlet` (export components, `portal` prop, `attached` event, `attachedRef` and three sets of `attachXxxPortal` exposed methods)
- The template content is rendered by the internal packaging component, and the parent's responsive state changes can drive the update of the mounted content (equivalent to the change detection semantics of Angular's embedded view)
- Vue capability mapping: Angular `Injector` → `appContext` (provide/inject), `bindings/directives` → props, `TemplateRef` / `$implicit` → render function parameters/slot props; `DomPortal` moved elements will lose responsiveness if they contain Vue bindings (consistent with Angular warnings)
- Overlay/dialog has been reconstructed based on portal content mounting: `overlayRef.attach(portal)` can directly mount three types of portals

### Quick start

Declarative:

```vue
<script setup lang="ts">
import {ref} from 'vue';
import {VPortal, VPortalOutlet, type Portal} from 'vue-cdk/portal';

const source = ref<{portal: Portal<unknown>} | null>(null);
const activePortal = ref<Portal<unknown> | null>(null);
</script>

<template>
  <VPortal ref="source">
    <template #default="{data}">{{ data }}</template>
  </VPortal>
  <VPortalOutlet :portal="activePortal" tag="section" />
  <button @click="activePortal = source?.portal ?? null">Attach</button>
</template>
```

Imperative (component/template/DOM):

```ts
import {ComponentPortal, DomPortal, DomPortalOutlet} from 'vue-cdk/portal';
import MyComponent from './MyComponent.vue';

const outlet = new DomPortalOutlet(document.querySelector('#slot')!);
outlet.attach(new ComponentPortal(MyComponent, {props: {title: 'Hello'}}));
outlet.detach();
outlet.attach(new DomPortal(document.querySelector('#movable')!));
```

### Explicit template references

Use a component ref to obtain a `TemplateRefHandle<C>` from `TemplateRef`, then mount it with `TemplatePortal`:

```vue
<script setup lang="ts">
import {onBeforeUnmount, ref, shallowRef} from 'vue';
import {TemplateRef, TemplatePortal, type TemplateRefHandle} from 'vue-cdk/portal';
import {useOverlay, type OverlayRef} from 'vue-cdk/overlay';

const tpl = shallowRef<TemplateRefHandle<{msg: string}> | null>(null);
const count = ref(0);
const overlay = useOverlay();
let panel: OverlayRef | null = null;
/** 挂载后用户事件中检查引用就绪，关闭后允许重开。 */
function open() {
  if (!tpl.value || panel?.hasAttached()) return;
  panel ??= overlay.create();
  panel.attach(new TemplatePortal<{msg: string}>(tpl.value, {msg: 'Hello'}));
}
/** 关闭内容但保留浮层引用以便重开。 */
function close() {
  panel?.detach();
}

onBeforeUnmount(() => panel?.dispose());
</script>
<template>
  <button @click="open">Open</button>
  <TemplateRef ref="tpl" v-slot="{msg}">
    <button @click="count++">{{ msg }}: {{ count }}</button>
    <button @click="close">Close</button>
  </TemplateRef>
</template>
```

`TemplateRef` renders no content itself. A bare Vue `<template ref="tpl">` does not produce a template handle. The component ref is null during setup; check it in `onMounted` or an event after mounting before use.

- The slot receives the supplied context and retains the parent’s reactive state and event closures. Use a reactive object for mutable context; mutating a plain object does not trigger updates.
- `detach()` unmounts the content. Reattaching creates new content component instances and resets their local state. The handle can be reused while its source remains mounted.
- Unmounting the source automatically unmounts its content and permanently invalidates the handle; attaching it again throws. Callers must still `dispose()` overlays or outlets they create to release containers and other resources.
- The source application’s `appContext` is inherited. Inheritance of the source component’s local `provide/inject` is not guaranteed.
- The existing `new TemplatePortal(render, context?, appContext?)` render-function constructor remains supported. `dialog.open()` currently does not accept a template handle or `TemplatePortal` directly.

See the repository’s [template reference guide](https://github.com/dawning1992/vue-cdk/blob/main/packages/cdk/src/portal/TEMPLATE_REF.md) (Chinese) for context, reattachment, and cleanup details.

## scrolling

Scroll capabilities: global scroll distribution, scroll containers, viewport measurements, and virtual scrolling.

### Features

- Complete API corresponding to Angular CDK scrolling: `ScrollDispatcher` (register/deregister, `scrolled`, `ancestorScrolled`, `getAncestorScrollContainers`), `ViewportRuler` (size/rect/scroll position, resize + orientationchange), `vScrollable` command and `useScrollable` combined (corresponds to `cdkScrollable`, incl. LTR/RTL six-way `scrollTo` / `measureScrollOffset`)
- Virtual scrolling: `VVirtualScrollViewport` + `VVirtualFor` scope slot, supports fixed size strategy (`itemSize`) and vertical variable height strategy (`autosize` / `estimatedItemSize`), as well as `appendOnly`, `scrollWindow` window scrolling, `vVirtualScrollableElement` external scrolling container, DataSource / Responsive array data source, `scrollToIndex` / `scrollToOffset`
- Bidirectional data appending: variable height strategy to stabilize `trackBy` cache entry size and restore scroll anchor point; unique `trackBy` must be provided when appending data at the top, `ResizeObserver` is used to respond to entry runtime height changes
- The event stream follows `Emitter`, including zero runtime dependencies (does not depend on RxJS)
- Structural styles are automatically injected out of the box; `vue-cdk/scrolling/style.css` can also be introduced explicitly

### Quick start

```vue
<script setup lang="ts">
import {ref} from 'vue';
import {VVirtualFor, VVirtualScrollViewport} from 'vue-cdk/scrolling';

const items = ref(Array.from({length: 1000}, (_, i) => `Item ${i + 1}`));
</script>

<template>
  <VVirtualScrollViewport :item-size="40" style="height: 320px" @scrolled-index-change="onChange">
    <VVirtualFor :of="items" v-slot="{item, index}">
      <div style="height: 40px">{{ index + 1 }}: {{ item }}</div>
    </VVirtualFor>
  </VVirtualScrollViewport>
</template>
```

The `VVirtualFor` slot context is consistent with Angular `*cdkVirtualFor`:
`item` / `$implicit` / `of` / `index` / `count` / `first` / `last` / `even` / `odd`.

Enable `autosize` for the variable height list, and do not pass in `itemSize` at the same time:

```vue
<VVirtualScrollViewport
  autosize
  :estimated-item-size="56"
  style="height: 320px"
>
  <VVirtualFor :of="items" :track-by="(_index, item) => item.id" v-slot="{item}">
    <article>{{ item.content }}</article>
  </VVirtualFor>
</VVirtualScrollViewport>
```

`autosize` currently only supports vertical scrolling. When appending data from the top of the list is required, `trackBy` must return a stable and unique key for each entry.

Declare the scroll container:

```vue
<div v-scrollable class="scroll-area">...</div>
```

```ts
import {ref} from 'vue';
import {useScrollable} from 'vue-cdk/scrolling';

const area = ref<HTMLElement | null>(null);
const scrollable = useScrollable(area);
```

## stepper

Unstyled multi-step process coordinator, corresponding to Angular CDK `@angular/cdk/stepper`. Provides linear step verification,
Editable/optional/error states, LTR/RTL keyboard navigation and reset capabilities, but does not specify visual styles for step headers, content areas and transition animations.

### Quick start

```vue
<script setup lang="ts">
import {computed, ref} from 'vue';
import {
  CdkStep,
  CdkStepHeader,
  CdkStepper,
  CdkStepperNext,
  type CdkStepPublicApi,
} from 'vue-cdk/stepper';

const stepper = ref<{steps: CdkStepPublicApi[]} | null>(null);
const steps = computed(() => stepper.value?.steps ?? []);
</script>

<template>
  <CdkStepper ref="stepper" linear>
    <nav role="tablist">
      <CdkStepHeader v-for="step in steps" :key="step.id" :step="step">
        {{ step.label.value }}
      </CdkStepHeader>
    </nav>
    <CdkStep v-slot="step" label="Enter details">
      <section v-show="step.isSelected">
        Step 1 content
        <CdkStepperNext type="button">Next</CdkStepperNext>
      </section>
    </CdkStep>
    <CdkStep v-slot="step" label="Complete">
      <section v-show="step.isSelected">Completed {{ steps.length }} steps</section>
    </CdkStep>
  </CdkStepper>
</template>
```

The linear process can be connected to any form library through `stepControl`. It only requires `valid` (optional `invalid` / `pending`)
and `reset()`, these states can use normal values, Ref, computed or getters. Component entrances include `CdkStepper`,
`CdkStep`, `CdkStepHeader`, `CdkStepperNext` and `CdkStepperPrevious`; the Composition API entrance is
`useStepper()` / `useStep()`.

## text-field

Text field tool, corresponding to Angular CDK `@angular/cdk/text-field`: automatically adjust textarea height and use CSS animation
Probe monitors browser autofill status for Chromium/WebKit. Modules can be safely imported in SSR.

### Quick start

```vue
<script setup lang="ts">
import {ref} from 'vue';
import {useAutofill, useTextareaAutosize} from 'vue-cdk/text-field';

const textarea = ref<HTMLTextAreaElement | null>(null);
const input = ref<HTMLInputElement | null>(null);
const {isAutofilled} = useAutofill(input);

useTextareaAutosize(textarea, {minRows: 2, maxRows: 8});
</script>

<template>
  <textarea ref="textarea" />
  <input ref="input" autocomplete="email" />
  <span v-if="isAutofilled">Browser autofill detected</span>
</template>
```

The template command entrances are `vTextareaAutosize` and `vAutofill`; the command entrances are `TextareaAutosize` and
`AutofillMonitor`. Structural styles are automatically injected, or `vue-cdk/text-field/style.css` can be imported explicitly.
When using Sass, you can use `@use 'vue-cdk/text-field/index'` to introduce autosize, autofill, and color mixins.

## tree

Tree structure: two rendering pipelines, flat tree and nested tree, aligned with Angular CDK `@angular/cdk/tree`.

### Features

- Complete reproduction of Angular CDK tree design pattern: data source (`DataSource` / `Emitter` / `Ref` / array) → flat / hierarchical rendering pipeline → node component (ARIA + focus management) → directive
- Two tree types: flat tree (`VTreeNode` + `levelAccessor`) and nested tree (`VNestedTreeNode` + `childrenAccessor`), `childrenAccessor` also supports `Emitter` asynchronous child nodes
- Dual data entry: classic `FlatTreeControl` / `NestedTreeControl` (including `BaseTreeControl` / `TreeControl` interface) and Angular 21 recommended `levelAccessor` / `childrenAccessor` / `expansionKey` / `trackBy`
- Complete ARIA treeview accessibility: `role` / `aria-level` / `aria-posinset` / `aria-setsize` / `aria-expanded`, roving tabindex, `TreeKeyManager` keyboard navigation (arrow keys, left and right keys to expand/collapse and focus on child/parent nodes, Home/End, Enter/Space activation, `*` Sibling expansion, typeahead, RTL)
- `vTreeNodeToggle` directive (supports recursive switching) and `vTreeNodePadding` directive (level indentation, supports CSS units and RTL)
- Events: nodes `activation` (keyboard activation) and `expandedChange` (expansion state change); tree instances expose imperative methods such as `expandAll` / `collapseAll` / `expandDescendants`
- Zero new runtime dependencies; differences with Angular (scope slot replacement structure directives, automatic rendering of nested child nodes, and v-if for conditional templates) can be found on the tree page of the documentation site (started by `apps/document` and `pnpm dev` in this warehouse)

### Quick start

Flat tree:

```vue
<script setup lang="ts">
import {ref} from 'vue';
import {VTree, VTreeNode} from 'vue-cdk/tree';

interface Item {
  name: string;
  level: number;
  expandable: boolean;
}

const items = ref<Item[]>([
  {name: 'root', level: 0, expandable: true},
  {name: 'child', level: 1, expandable: false},
]);
</script>

<template>
  <VTree :data-source="items" :level-accessor="(node: Item) => node.level">
    <template #node="{node, level}">
      <VTreeNode :node="node" :is-expandable="node.expandable" v-tree-node-padding>
        <button v-tree-node-toggle>{{ node.name }}</button>
      </VTreeNode>
    </template>
  </VTree>
</template>
```

The nested tree uses `childrenAccessor` and `VNestedTreeNode`. After expansion, the child nodes are automatically rendered inside the node:

```vue
<script setup lang="ts">
import {VTree, VNestedTreeNode} from 'vue-cdk/tree';

const roots = [{name: 'root', children: [{name: 'child', children: []}]}];
</script>

<template>
  <VTree :data-source="roots" :children-accessor="(node: any) => node.children">
    <template #node="{node}">
      <VNestedTreeNode :node="node" :is-expandable="node.children.length > 0">
        {{ node.name }}
      </VNestedTreeNode>
    </template>
  </VTree>
</template>
```

## virtual-tree

Virtual scrolling tree: Provides tree structure rendering on top of fixed row height virtual scrolling, a unique capability of Vue CDK (Angular CDK has no corresponding module).
The component reuses the `VVirtualScrollViewport` / `VVirtualFor` of the scrolling module and the tree module
`VTreeNode` / `vTreeNodePadding` / `vTreeNodeToggle`, so the node template writing method is consistent with the tree module.

### Features

- Two data modes: `data` full mode (providing all nodes at once) and `loadChildren` lazy loading mode (paged by parent node)
- Each layer is independently scrolled and loaded: the root level, second layer and deeper levels each maintain paging status. When scrolling close to the last loaded child node of a parent node, only the next page of the parent node is requested; when the node is expanded, the first page is requested.
- Memory cache: Folding and then expanding the hit cache will not make repeated requests; after `hasMore=false`, this layer will never be requested again; `clearCache()` / `retry(parent)` management cache and failure recovery
- One-click expansion/folding: `expandAll` in lazy loading mode recursively loads all levels page by page according to BFS (cache deduplication); directly expands in full mode
- Keyboard accessibility: Based on flat index navigation (directional keys / Home / End / left and right keys / Enter / `*`), automatic scrolling across virtual windows into view and focus, RTL left and right key swaps, node skipping disabled
- Fixed row height (required for `itemSize`), 400,000 rows of data still only render rows near the viewport; `#node` slot context extends `isLoading` / `hasMore` / `isError` and other states

### Quick start

Full mode:

```vue
<script setup lang="ts">
import {ref} from 'vue';
import {VVirtualScrollTree} from 'vue-cdk/virtual-tree';
import {VTreeNode, vTreeNodePadding, vTreeNodeToggle} from 'vue-cdk/tree';

interface Item {
  id: string;
  name: string;
  children?: Item[];
}

const data = ref<Item[]>([
  {id: '1', name: 'Fruit', children: [
    {id: '1-1', name: 'Apple'},
    {id: '1-2', name: 'Banana'},
  ]},
  {id: '2', name: 'Vegetables', children: [
    {id: '2-1', name: 'Carrot'},
  ]},
]);
</script>

<template>
  <VVirtualScrollTree :data="data" :item-size="40" height="280px">
    <template #node="{node, isExpandable, isExpanded}">
      <VTreeNode :node="node" :is-expandable="isExpandable">
        <button type="button" v-tree-node-toggle>
          <span :class="{open: isExpanded}">▸</span>
        </button>
        <span v-tree-node-padding>{{ node.name }}</span>
      </VTreeNode>
    </template>
  </VVirtualScrollTree>
</template>
```

Lazy loading mode (the root level is expressed by `parent === null`):

```ts
import type {LoadChildren, PageInfo} from 'vue-cdk/virtual-tree';

const loadChildren: LoadChildren<Item> = async (parent, page: PageInfo) => {
  const {items, total} = await fetchChildren(parent?.id ?? null, page.offset, page.pageSize);
  return {children: items, hasMore: page.offset + items.length < total};
};
```

```vue
<VVirtualScrollTree :load-children="loadChildren" :item-size="40" height="280px">
  <template #node="{node, isExpandable, isLoading}">
    <VTreeNode :node="node" :is-expandable="isExpandable">
      {{ node.name }}
      <span v-if="isLoading">Loading…</span>
    </VTreeNode>
  </template>
</VVirtualScrollTree>
```

For more examples (full data, lazy loading of multiple levels, 400,000 rows, custom nodes/error retry) and complete API, please see the virtual-tree page of the documentation site.

## Angular CDK mapping

### Event streams

- RxJS `Subject` → internal `Emitter` (`vue-cdk/emitter`, zero dependencies)

### coercion / collections

- `@angular/cdk/coercion` → `vue-cdk/coercion` (function and type have the same name)
- `@angular/cdk/collections`'s `DataSource` / `ArrayDataSource` / `ListRange` / `SelectionModel` → class of the same name/type

### platform

- `Platform` service → `Platform` class + `platform` singleton + `usePlatform()` (Angular injection → Vue provide/inject)
- `PlatformModule` → `app.provide(CDK_PLATFORM, platform)` or `providePlatform()` in the component
- `getSupportedInputTypes` / `_isTestEnvironment` → function with the same name (`vue-cdk/platform`)

### portal

- `Portal` / `ComponentPortal` / `TemplatePortal` / `DomPortal` → the class of the same name (`injector` → `appContext`, `bindings` → props)
- `CdkPortal` / `CdkPortalOutlet` / `DomPortalOutlet` → `VPortal` / `VPortalOutlet` / `DomPortalOutlet`

### overlay

- `Overlay` service → `useOverlay()`; `OverlayRef` / `OverlayConfig` with the same name
- `CdkConnectedOverlay` / `CdkOverlayOrigin` → `VConnectedOverlay` / `VOverlayOrigin` component
- `GlobalPositionStrategy` / `FlexibleConnectedPositionStrategy` with the same name
- `ScrollStrategyOptions` → `scrollStrategies`; `OverlayKeyboardDispatcher` / `OverlayOutsideClickDispatcher` → Dispatcher with the same name (module-level singleton)

### a11y

- `@angular/cdk/a11y` → `vue-cdk/a11y` (see the complete [a11y mapping](#a11y))

### bidi

- `Directionality` → class of the same name + `useDirectionality()` / `provideDirectionality()`
- `[dir]` / `Dir` → `VDir` component (alias `Dir`); Vue directive cannot establish provide context for descendants

### dialog

- `Dialog` service → `useDialog()` / `dialogService`; `DialogRef` with the same name (RxJS → `Emitter`)
- `DIALOG_DATA` / `DEFAULT_DIALOG_CONFIG` → Same name InjectionKey + `useDialogData()`
- `CdkDialogContainer` → `VDialogContainer` / `useDialogContainerCore()`

### scrolling

- `ScrollDispatcher` / `ViewportRuler` → Same name; `cdkScrollable` → `vScrollable` / `useScrollable()`
- `cdk-virtual-scroll-viewport` / `*cdkVirtualFor` → `VVirtualScrollViewport` / `VVirtualFor`
- `FixedSizeVirtualScrollStrategy` has the same name; experimental autosize → `AutoSizeVirtualScrollStrategy` / `autosize`
- `cdkVirtualScrollingElement` / `scrollWindow` → `vVirtualScrollableElement` / `scroll-window`

### stepper

- `CdkStepper` / `CdkStep` / `CdkStepHeader` → Vue unstyled component with the same name
- `cdkStepperNext` / `cdkStepperPrevious` → `CdkStepperNext` / `CdkStepperPrevious`
- `stepControl` of Angular Forms → universal `StepControl` contract, adaptable to native forms, VeeValidate and other solutions

### text-field

- `CdkTextareaAutosize` → `TextareaAutosize` / `useTextareaAutosize()` / `vTextareaAutosize`
- `AutofillMonitor` → class of the same name + `useAutofill()` / `vAutofill`
- Sass mixin → `vue-cdk/text-field/index`; pre-built structural style → `vue-cdk/text-field/style.css`

### observers

- `ContentObserver` / `MutationObserverFactory` → class with the same name (RxJS stream replaced with zero dependency subscribable stream)
- `cdkObserveContent` → `vCdkObserveContent` directive; Vue responsive entry is `useObserveContent()`

### drag-drop

- `@angular/cdk/drag-drop` → `vue-cdk/drag-drop` (`VDropList` / `VDrag` / `VDropListGroup` / `vDragHandle`; inputs and event payloads align; see [drag-drop](#drag-drop))

### tree

- `CdkTree` → `VTree`; `CdkTreeNode` / `CdkNestedTreeNode` → `VTreeNode` / `VNestedTreeNode`
- `cdkTreeNodeDef` → `#node` scope slot (`{node, level, index, count}`); `cdkTreeNodeToggle` / `cdkTreeNodePadding` → `vTreeNodeToggle` / `vTreeNodePadding`
- `cdkTreeNodeOutlet` → Nested tree automatically renders child nodes without explicit export
- `FlatTreeControl` / `NestedTreeControl` / `BaseTreeControl` / `TreeControl` with the same name

## Development

```bash
pnpm install
pnpm dev
pnpm build
pnpm build:document
pnpm typecheck
pnpm test
pnpm --filter vue-cdk exec playwright install chromium
pnpm --filter vue-cdk test:browser
pnpm --filter vue-cdk publish
```

Browser tests use Playwright Chromium for real layout and CSS animation checks. Install Chromium before the first run. Publishing automatically runs type checks, unit tests, browser tests, the build, and version consistency validation.

New module convention: Create an independent directory under `src/` and provide the `index.ts` entrance, and at the same time
`package.json` is registered in the multi-entry configuration of `exports` and `vite.config.ts`;
When structural style is required, add the corresponding `style.css` export and copy script.

## Notes

- The library itself does not contain business styles, but only provides structural styles; theme styles should be defined in the user application.
- Structural styles are automatically injected at runtime by default; if you want to control it explicitly, you can introduce `vue-cdk/<module>/style.css` (it will be automatically injected and deduplicated). Currently, six modules: overlay, scrolling, a11y, dialog, drag-drop, and text-field provide independent CSS export.
- Content rendered by imperative `attach` is accessible to app-level `provide`; component-level `provide` is recommended to use declarative components.
- Both event dispatchers and containers are global singletons, and they need to manage their own life cycles when shared by multiple application instances.
- Each module under SSR can be safely imported; when there is no `document`, the clipboard `copy()` returns `false` and `beginCopy()` and throws an error, and the platform detects a safe downgrade.

## FAQ

**How does Vue CDK relate to UI component libraries such as Element Plus and Ant Design Vue?**

Vue CDK supplies interaction primitives without a theme. UI libraries can build dropdowns, dialogs, draggable lists, and other components on top of it. When using Vue CDK directly, define your own visual styles.

**Why does the root entry export only the version?**

Features are imported from subpaths, as in Angular CDK. This allows tree shaking to include only the modules you use.

**Why aren't event streams based on RxJS?**

`Emitter` provides the essential subscription, dispatch, and completion behavior of an RxJS `Subject` without adding a runtime dependency. Bridge it to RxJS with tools such as `from` or `fromEvent` if you need operators.

**How should I use Vue CDK with SSR?**

Modules can be imported safely. Call imperative APIs such as `useOverlay` and `useDialog` in a client environment, for example in `onMounted`. Clipboard and platform detection have defined fallbacks when `document` is unavailable.

**Do I need to import structural CSS manually?**

No. It is injected at runtime. You can import the corresponding `style.css` explicitly for direct control; duplicate injection is avoided.

**What happens when several `createApp` instances share global singletons?**

Module-level singletons such as `OverlayContainer` and event dispatchers are shared. For isolation, use the `container` option of `createOverlayRef` or manage their lifecycle yourself.

**Which Vue versions are supported?**

`vue-cdk` declares a `vue ^3.3.0` peer dependency and uses the Composition API exclusively.

## License

MIT. Code transplanted from Angular CDK retains the upstream copyright notice (see the header comments of each source code file).
