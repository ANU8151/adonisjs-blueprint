# AdonisJS Blueprint

> [!note]
> This package targets **AdonisJS v7**

A professional-grade code generator for AdonisJS 7 inspired by [Laravel Blueprint](https://blueprint.laravelshift.com/). Rapidly scaffold your entire application infrastructure from a single, human-readable YAML file.

## Features

- **API-First Mode**: Switch between traditional MVC, InertiaJS, or pure JSON APIs with a single setting.
- **Models & Migrations**: Generates Schema-class compatible Lucid models with support for **Soft Deletes**, **Enums**, and automatic **Pivot Tables**.
- **Controllers & Routes**: Generates controllers with advanced logic, automatic imports, and registers **Resource** or **API** routes (including nested resources).
- **Authorization**: Integrated **Bouncer** support—automatically generates Policy classes and injects authorization checks.
- **Validators & Factories**: Creates advanced **VineJS** validators (with unique, min/max rules) and Faker-powered factories.
- **Infrastructure**: Generates Seeders, Events, Mails, Jobs, and **Japa** functional tests automatically.
- **Stubs Customization**: Eject and customize all templates to match your team's coding style.

## Setup

Install the package via npm:

```sh
npm install adonis-blueprint
```

Configure the package to publish the default configuration:

```sh
node ace configure adonis-blueprint
```

## Usage

### 1. Create a `draft.yaml` file

Define your application structure in a `draft.yaml` file in your project root.

```yaml
settings:
  api: true # Enable API mode (JSON responses, .apiOnly() routes)
  inertia:
    enabled: false
    adapter: react # react, vue, svelte

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

### 3. Core Commands

- **Build**: Generate all files from `draft.yaml`.
  ```sh
  node ace blueprint:build
  ```
- **Erase**: Undo the last build and remove generated files.
  ```sh
  node ace blueprint:erase
  ```
- **Trace**: Generate a `draft.yaml` from your current database (Reverse Engineering).
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

## Folder Structure

Generated files follow the standard AdonisJS 7 conventions:

- `app/models/*.ts`: Lucid Models (with Mixins)
- `database/migrations/*.ts`: Database Migrations (inc. Pivots)
- `app/controllers/*.ts`: HTTP Controllers
- `app/validators/*.ts`: VineJS Validators
- `app/enums/*.ts`: TypeScript Enums
- `app/policies/*.ts`: Bouncer Policies
- `database/factories/*.ts`: Lucid Factories
- `database/seeders/*.ts`: Database Seeders
- `app/events/*.ts`, `app/mails/*.ts`, `app/jobs/*.ts`: Classes
- `resources/views/*.edge` or `inertia/pages/*.tsx|vue|svelte`: Views
- `tests/functional/*.spec.ts`: Japa Tests

## License

MIT
