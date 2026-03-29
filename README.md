# AdonisJS Blueprint

> [!note]
> This package targets **AdonisJS v7**

A professional-grade code generator for AdonisJS 7 inspired by [Laravel Blueprint](https://blueprint.laravelshift.com/). Rapidly scaffold your entire application infrastructure from a single, human-readable YAML file.

## Features

- **API-First Mode**: Switch between MVC, InertiaJS, or pure JSON APIs with a single setting.
- **Inertia Support**: Generates full CRUD pages for **React**, **Vue**, and **Svelte** with standard components.
- **Models & Migrations**: Lucid models with **Soft Deletes**, **Enums**, and automatic **Pivot Tables**.
- **Smart Shorthands**: Define migration modifiers like `string:unique:min:10:nullable` directly in YAML.
- **Authorization**: Integrated **Bouncer** support—generates Policies with smart mapping.
- **Side-Effects**: Generates **Events**, **Mails**, **Jobs**, and **Notifications** classes and logic.
- **WebSockets**: Integrated **AdonisJS Transmission** support—generates channels and auth logic.
- **Documentation**: Automatically generates full **OpenAPI 3.0** specs (Swagger).
- **Security**: Built-in support for **Rate Limiting** and secure file uploads.
- **Watch Mode**: Rebuilds your app infrastructure whenever you save `draft.yaml`.

## Setup

```sh
npm install @anu8151/adonisjs-blueprint
node ace configure @anu8151/adonisjs-blueprint
```

## DX (VS Code)

Enable auto-completion by adding this comment to your `draft.yaml`:

```yaml
# yaml-language-server: $schema=node_modules/@anu8151/adonisjs-blueprint/build/src/schema.json
```

## Usage

### 1. Initialize

```sh
node ace blueprint:init
```

### 2. Define

```yaml
settings:
  api: false
  inertia: { enabled: true, adapter: react }

auth: true

models:
  Post:
    attributes:
      title: string:unique:min:5
      body: text:nullable
      status: enum:draft,published:default:draft
      category_id: integer:unsigned:references:categories.id
    softDeletes: true
    relationships:
      user: belongsTo
      tags: belongsToMany

controllers:
  Post:
    resource: true
    publish:
      query: find
      save: status:published
      fire: PostPublished
      send: NewPostMail
      redirect: posts.index
```

### 3. Build

```sh
node ace blueprint:build --watch
```

## Advanced Shorthands

Blueprint supports complex migration modifiers in your model attributes:

- `string:unique`: Unique index.
- `integer:unsigned`: Unsigned integer.
- `text:nullable` or `text:optional`: Nullable column.
- `enum:a,b,c`: Enum column.
- `references:table.column`: Foreign key reference (defaults to `CASCADE`).
- `datetime`, `timestamp`, `boolean`, `float`, `decimal`, `json`, `uuid`.

## Controller Statements

- `query: all | paginate:20 | find [, with: rel1, rel2]`
- `validate: field1, field2`
- `authorize: action, model`
- `save: true [, with: rel1, rel2]`
- `upload: field to: disk`
- `fire: EventName`, `send: MailName`, `notify: target, NotifName`
- `dispatch: JobName`, `throttle: limiterName`
- `service: ServiceName.method`

## Core Commands

- `blueprint:init`: Create sample `draft.yaml`.
- `blueprint:build`: Generate files from draft. Supports `--watch`, `--force`, `--erase`.
- `blueprint:erase`: Remove all generated files from the last build.
- `blueprint:trace`: Reverse-engineer your DB into a `draft.yaml`.
- `blueprint:stubs`: Export all stubs for local customization.

## Testing

This package uses **Japa** for testing. To run tests:

```sh
npm test
```

For quick test runs during development:

```sh
npm run quick:test
```

## License

MIT
