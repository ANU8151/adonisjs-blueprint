# AdonisJS Blueprint

> [!note]
> This package targets **AdonisJS v7**

A code generator for AdonisJS 7 inspired by [Laravel Blueprint](https://blueprint.laravelshift.com/). Rapidly scaffold your application from a single, human-readable YAML file.

## Features

- **Models & Migrations**: Generates Schema-class compatible Lucid models and migrations (including automatic pivot tables for many-to-many).
- **Controllers & Routes**: Generates controllers with advanced logic and registers resource routes automatically.
- **Validators & Factories**: Creates VineJS validators and Faker-powered factories based on model attributes.
- **Views**: Supports both traditional **Edge** views and **InertiaJS** pages (React, Vue, Svelte).
- **Infrastructure**: Generates Events, Mails, Jobs, and Japa functional tests.
- **Reverse Engineering**: Generate a `draft.yaml` from your existing database using the `trace` command.

## Setup

Install the package via npm:

```sh
npm install adonis-blueprint
```

Configure the package:

```sh
node ace configure adonis-blueprint
```

## Usage

### 1. Create a `draft.yaml` file

Define your models and controllers in a `draft.yaml` file in your project root.

```yaml
settings:
  inertia:
    enabled: true
    adapter: react # options: react, vue, svelte

models:
  Post:
    title: string
    content: text
    author_id: foreign
    relationships:
      comments: hasMany
      tags: belongsToMany

controllers:
  Post:
    resource: true
    store:
      validate: title, content
      save: post
      fire: NewPostEvent
      send: WelcomeEmail
      flash: post.title
      redirect: posts.index
```

### 2. Build your application

Run the build command to generate all files:

```sh
node ace blueprint:build
```

### 3. Other Commands

- **Erase**: Undo the last build and remove generated files.
  ```sh
  node ace blueprint:erase
  ```
- **Trace**: Generate a `draft.yaml` from your current database schema.
  ```sh
  node ace blueprint:trace
  ```

## Controller Statements

Blueprint supports several "smart" statements in your controller actions:

- `validate: title, content`: Generates VineJS validation logic.
- `save: model`: Generates `Model.create()` logic.
- `delete: true`: Generates `findOrFail` and `delete()` logic.
- `fire: EventName`: Generates an Event class and the `emitter.emit()` call.
- `send: MailName`: Generates a Mail class and the `mail.sendLater()` call.
- `dispatch: JobName`: Generates a Job class and the execution call.
- `auth: true`: Injects `auth.user` into the action logic.
- `render: folder/file`: Generates the view file (Edge or Inertia) and the `render()` call.

## Folder Structure

The generator follows the standard AdonisJS 7 folder structure:

- `app/models/*.ts`: Lucid Models
- `database/migrations/*.ts`: Database Migrations
- `app/controllers/*.ts`: HTTP Controllers
- `app/validators/*.ts`: VineJS Validators
- `database/factories/*.ts`: Lucid Factories
- `app/events/*.ts`, `app/mails/*.ts`, `app/jobs/*.ts`: Classes
- `resources/views/*.edge` or `inertia/pages/*.tsx|vue|svelte`: Views
- `tests/functional/*.spec.ts`: Functional Tests

## License

MIT
