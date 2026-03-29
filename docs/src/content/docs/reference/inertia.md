---
title: Inertia Integration
description: Building modern SPAs with React, Vue, or Svelte.
---

AdonisJS Blueprint has first-class support for InertiaJS, allowing you to generate frontend components alongside your backend logic.

## Configuration

Enable Inertia in the `settings` section of your `draft.yaml`.

```yaml
settings:
  api: false
  inertia:
    enabled: true
    adapter: react # options: react, vue, svelte
```

## Generated Components

When `inertia` is enabled, the `render` statement in your controller actions will generate frontend pages in `inertia/pages/`.

```yaml
controllers:
  Post:
    index:
      query: all
      render: Posts/List
```

- **React:** Generates `inertia/pages/Posts/List.tsx` using standard components.
- **Vue:** Generates `inertia/pages/Posts/List.vue`.
- **Svelte:** Generates `inertia/pages/Posts/List.svelte`.

## CRUD Templates

If you use `resource: true`, Blueprint generates full CRUD views (Index, Create, Edit, Show) with pre-built forms and tables that are ready to use with your preferred framework.

### React Example
The generated React component uses `@inertiajs/react` and includes:
- `<Head />` for SEO and titles.
- `<Link />` for navigation.
- `<Form />` from `@adonisjs/inertia/react` for handled submissions.
- Automatic error handling logic for form fields.
