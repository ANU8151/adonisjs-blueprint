# AdonisJS Blueprint

> [!note]
> This package targets **AdonisJS v7**

A professional-grade code generator for AdonisJS 7 inspired by [Laravel Blueprint](https://blueprint.laravelshift.com/). Rapidly scaffold your entire application infrastructure from a single, human-readable YAML file.

## Features

- **API-First Mode**: Switch between traditional MVC, InertiaJS, or pure JSON APIs with a single setting.
- **Watch Mode**: Automatically rebuilds your application infrastructure whenever you save your `draft.yaml`.
- **JSON Schema Support**: Get full IDE auto-completion and validation for your `draft.yaml` file.
- **Models & Migrations**: Generates Schema-class compatible Lucid models with support for **Soft Deletes**, **Enums**, and automatic **Pivot Tables**.
- **Controllers & Routes**: Generates controllers with advanced logic, **Middleware** support, and registers **Resource** or **API** routes.
- **Authorization**: Integrated **Bouncer** support—automatically generates Policy classes and injects authorization checks.
- **Validators & Factories**: Creates advanced **VineJS** validators (with unique, min/max, regex rules) and Faker-powered factories.
- **Infrastructure**: Generates Seeders, Events, Mails, Jobs, and **Japa** functional tests automatically.

## Setup

Install the package via npm:

```sh
npm install adonis-blueprint
```

Configure the package to publish the default configuration:

```sh
node ace configure adonis-blueprint
```

## Developer Experience (DX)

To enable **Auto-completion** and **Validation** in VS Code, add the following comment to the top of your `draft.yaml`:

```yaml
# yaml-language-server: $schema=node_modules/adonis-blueprint/build/src/schema.json

settings:
  api: true
...
```

## Usage

### 1. Create a `draft.yaml` file
Define your application structure in a `draft.yaml` file in your project root.

```yaml
settings:
  api: true
  inertia:
    enabled: false
    adapter: react

models:
  Post:
    title: string:min:5
    content: text
    status: enum:draft,published,archived
    softDeletes: true
    relationships:
      comments: hasMany
      tags: belongsToMany

controllers:
  Post:
    middleware: [auth]
    resource: true
    store:
      authorize: create, post
      validate: title, content, status
      save: post
      fire: NewPostEvent
      render: json with: post
```

### 2. Build your application
Run the build command to generate all files:

```sh
node ace blueprint:build
```

For a seamless experience, use the **Watch Mode**:
```sh
node ace blueprint:build --watch
```

### 3. Core Commands

- **Build**: Generate all files from `draft.yaml`. Supports `--watch`.
- **Erase**: Undo the last build and remove generated files.
  ```sh
  node ace blueprint:erase
  ```
- **Trace**: Generate a `draft.yaml` from your current database (Full Reverse Engineering).
  ```sh
  node ace blueprint:trace
  ```
- **Stubs**: Copy all stubs to your project root for customization.
  ```sh
  node ace blueprint:stubs
  ```

## Controller Statements

Blueprint supports several "smart" statements in your controller actions:

- `query: all | paginate:20 | find`: Generates Lucid query logic.
- `validate: title, content`: Generates advanced VineJS validation logic.
- `authorize: action, model`: Generates Bouncer Policy and authorization check.
- `save: model`: Generates `Model.create()` logic.
- `delete: true`: Generates `findOrFail` and `delete()` logic.
- `fire: EventName`: Generates an Event class and `emitter.emit()` call.
- `send: MailName`: Generates a Mail class and `mail.sendLater()` call.
- `dispatch: JobName`: Generates a Job class and handles execution.
- `render: view with: data`: Generates the view (Edge/Inertia/JSON) and passes data.

## License

MIT
