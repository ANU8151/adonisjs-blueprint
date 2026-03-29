---
title: Getting Started
description: Learn how to install and use AdonisJS Blueprint.
---

AdonisJS Blueprint is a professional-grade code generator for AdonisJS 7 inspired by Laravel Blueprint. It allows you to rapidly scaffold your entire application infrastructure from a single, human-readable YAML file.

## Installation

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

## Basic Usage

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
    store:
      validate: 'title, content'
      save: true
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
