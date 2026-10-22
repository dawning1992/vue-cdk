# Vue Component Dev Kit (Vue CDK)

English | [简体中文](README.zh-CN.md)

Online documentation: [https://dawning1992.github.io/vue-cdk](https://dawning1992.github.io/vue-cdk)

Vue CDK is a component development kit for Vue 3, with design patterns inspired by [Angular CDK](https://material.angular.io/cdk/overview).

This repository is a pnpm workspaces monorepo containing two packages:

| Directory | Package | Description |
| --- | --- | --- |
| `packages/cdk` | `vue-cdk` | Publishable CDK library with source code, tests, and build configuration |
| `apps/document` | `vue-cdk-document` | Private documentation site whose build output can be hosted as static files |

`vue-cdk` provides 19 independently importable subpath modules: accordion, a11y, bidi, clipboard, coercion, collections, dialog, drag-drop, emitter, layout, observers, overlay, platform, portal, scrolling, stepper, text-field, tree, and virtual-tree. Each supports tree shaking. See the [library README](packages/cdk/README.md) for module details, APIs, and examples.

## Requirements

- Node.js 20.19+ or 22.12+
- pnpm 11

## Installation

```bash
pnpm install
```

## Common commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the documentation development server, with an alias to the CDK source |
| `pnpm build` | Build the `vue-cdk` library into `packages/cdk/dist` |
| `pnpm build:document` | Build the documentation site into `apps/document/dist` |
| `pnpm typecheck` | Run `vue-tsc` type checks for all packages |
| `pnpm test` | Run unit tests for all packages |
| `pnpm --filter vue-cdk publish` | Publish the CDK library to npm; typecheck, test, and build run automatically first |

The documentation build output in `apps/document/dist` can be deployed directly to GitHub Pages, Netlify, Vercel, or another static host. No server is needed.

## Library documentation

See the [library README](packages/cdk/README.md) for installation, the module list, and API details.

## FAQ

**How does Vue CDK relate to UI component libraries such as Element Plus and Ant Design Vue?**

CDK supplies foundational behavior without application specific styling. UI libraries can use it to build dropdowns, dialogs, draggable lists, and similar interactions. When using Vue CDK directly, provide your own theme and visual styles.

**Why does the package root export only the version?**

As with Angular CDK, features are imported from subpaths. This avoids bundling the entire library and allows tree shaking to include only the modules you use.

**Why aren't event streams based on RxJS?**

`Emitter` provides the essential subscription, dispatch, and completion behavior of an RxJS `Subject` while keeping the package free of runtime dependencies. If you need RxJS operators, bridge the stream with tools such as `from` or `fromEvent`.

**How should I use it with SSR?**

All modules can be imported safely. Call imperative APIs such as `useOverlay` and `useDialog` in a client environment, for example in `onMounted`. Clipboard and platform detection provide explicit fallbacks when `document` is unavailable.

**Do I need to import structural CSS manually?**

No. Structural CSS is injected at runtime. You can import the corresponding `style.css` explicitly if you want direct control; duplicate injection is avoided.

**What happens when multiple `createApp` instances share global singletons?**

Module level singletons such as `OverlayContainer` and event dispatchers are shared across app instances. For isolation, specify a `container` with `createOverlayRef` or manage the lifecycle yourself.

**Which Vue versions are supported?**

`vue-cdk` declares a `vue ^3.3.0` peer dependency and uses the Composition API exclusively.
