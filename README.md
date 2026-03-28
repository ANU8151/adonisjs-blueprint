# AdonisJS Blueprint

> [!note]
> This package targets **AdonisJS v7**

A professional-grade code generator for AdonisJS 7 inspired by [Laravel Blueprint](https://blueprint.laravelshift.com/). Rapidly scaffold your entire application infrastructure from a single, human-readable YAML file.

## Features

- **API-First Mode**: Switch between traditional MVC, InertiaJS, or pure JSON APIs with a single setting.
- **Watch Mode**: Automatically rebuilds your application infrastructure whenever you save your `draft.yaml`.
- **JSON Schema Support**: Get full IDE auto-completion and validation for your `draft.yaml` file.
- **Models & Migrations**: Generates Lucid models with support for **Soft Deletes**, **Enums**, and automatic **Pivot Tables**.
- **Smart Relationships**: Infers foreign keys and generates proper TypeScript types for `belongsTo`, `hasMany`, etc.
- **Controllers & Routes**: Generates controllers with advanced logic, **Middleware** support, and registers **Resource** or **API** routes.
- **Advanced CRUD Views**: Generates full CRUD pages (Index, Create, Edit, Show) for **Edge**, **React**, **Vue**, and **Svelte**.
- **Authorization**: Integrated **Bouncer** support—generates Policy classes with smart method mapping (`index` -> `viewAny`, etc.).
- **Validators & Factories**: Creates advanced **VineJS** validators and Faker-powered factories.
- **Real-time Communication**: Integrated **AdonisJS Transmission** support—generates channels and authorization logic.
- **Infrastructure**: Generates **Smart Seeders**, Events, Mails, Jobs, Notifications, and **Japa** functional tests.
- **OpenAPI Documentation**: Automatically generates full Swagger/OpenAPI 3.0 specs with request/response schemas.
- **Reverse Engineering**: Trace your existing database to generate a `draft.yaml` automatically.

## Setup

Install the package via npm:

```sh
npm install @anu8151/adonisjs-blueprint
```

Configure the package to publish the default configuration:

```sh
node ace configure @anu8151/adonisjs-blueprint
```

## Developer Experience (DX)

To enable **Auto-completion** and **Validation** in VS Code, add the following comment to the top of your `draft.yaml`:

```yaml
# yaml-language-server: $schema=node_modules/@anu8151/adonisjs-blueprint/build/src/schema.json

settings:
  api: true
...
```

## Usage

### 1. Initialize your project

Run the init command to create a sample `draft.yaml`:

```sh
node ace blueprint:init
```

### 2. Define your application

Edit the generated `draft.yaml` file in your project root.

```yaml
settings:
  api: true
  inertia:
    enabled: true
    adapter: react

models:
  Post:
    attributes:
      title: string:min:5
      content: text
      status: enum:draft,published,archived
    softDeletes: true
    relationships:
      user: belongsTo

controllers:
  Post:
    resource: true

channels:
  Chat:
    authorized: true
```

### 3. Build your application

Run the build command to generate all files:

```sh
node ace blueprint:build
```

For a seamless experience, use the **Watch Mode**:

```sh
node ace blueprint:build --watch
```

### 4. Core Commands

- **Init**: Create a sample `draft.yaml` with best practices.
- **Build**: Generate all files from `draft.yaml`. Supports `--watch` and `--force`.
- **Erase**: Undo the last build and remove generated files using the manifest.
- **Trace**: Generate a `draft.yaml` from your current database (Full Reverse Engineering).
- **Stubs**: Copy all stubs to your project root for customization.

## Controller Statements

Blueprint supports several "smart" statements in your controller actions:

- `query: all | paginate:20 | find [, with: rel1, rel2]`: Generates Lucid query logic with optional preloads.
- `validate: title, content`: Generates advanced VineJS validation logic.
- `authorize: action, model`: Generates Bouncer Policy and authorization check.
- `save: true [, with: rel1, rel2]`: Generates `Model.create()` and optional `.sync()` logic.
- `delete: true`: Generates `findOrFail` and `delete()` logic.
- `upload: field to: disk`: Generates file upload logic using AdonisJS Drive.
- `fire: EventName`: Generates an Event class and `emitter.emit()` call.
- `send: MailName`: Generates a Mail class and `mail.sendLater()` call.
- `notify: target, NotificationName`: Generates a Notification class and `target.notify()` call.
- `dispatch: JobName`: Generates a Job class and handles execution.
- `render: view with: data`: Generates the view (Edge/Inertia/JSON) and passes data.
- `service: ServiceName.method`: Generates a Service class and calls the specified method.

## License

MIT
