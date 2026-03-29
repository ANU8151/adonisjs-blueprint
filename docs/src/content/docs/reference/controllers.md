---
title: Controllers & Actions
description: How to define controllers and business logic in AdonisJS Blueprint.
---

Controllers are defined under the `controllers` key. Blueprint uses "statements" to generate complex business logic within your controller methods.

## Resource Controllers

Adding `resource: true` to a controller definition automatically generates the standard 7 resource methods: `index`, `create`, `store`, `show`, `edit`, `update`, and `destroy`.

```yaml
controllers:
  Post:
    resource: true
```

## Controller Statements

Statements are smart keywords used within a controller action to generate specific pieces of logic.

### `query`
Generates Lucid query logic.
- `query: all`: Fetches all records.
- `query: paginate:20`: Fetches records with pagination.
- `query: find`: Fetches a single record by `id`.
- `query: all, with: user, category`: Preloads specified relationships.

### `validate`
Generates VineJS validation logic.
- `validate: title, body`: Validates specific fields.
- `validate: all`: Validates all attributes defined in the model.

### `save`
Generates logic to save or create a model.
- `save: true`: Creates a new record using the validated payload.
- `save: status:published`: Updates specific fields.
- `save: true, with: tags`: Automatically syncs many-to-many relationships.

### `delete`
Generates logic to delete a record.
- `delete: true`: Finds the record by `id` and deletes it (supports soft deletes).

### `render`
Generates the response logic.
- `render: Posts/Index`: Renders an Inertia or Edge view.
- `render: json`: Returns a JSON response.
- `render: Posts/Show with: post`: Passes specific data to the view.

### `redirect`
Generates a redirection response.
- `redirect: posts.index`: Redirects to a named route.
- `redirect: back`: Redirects back to the previous page.

### `flash`
Adds a flash message to the session.
- `flash: Post created successfully!`: Sets a success flash message.

### `fire`, `send`, `dispatch`, `notify`
Generates side-effect logic and classes.
- `fire: PostPublished`: Generates an Event and emits it.
- `send: WelcomeEmail`: Generates a Mail and sends it later.
- `dispatch: ProcessImage`: Generates a Job and dispatches it.
- `notify: user, NewPost`: Generates a Notification and sends it to the target.

### `upload`
Generates file upload logic.
- `upload: avatar to: s3`: Handles file upload using AdonisJS Drive.

### `throttle`
Applies a rate limiter to the action.
- `throttle: global`: Uses the `global` limiter defined in the `limiters` section.

### `service`
Calls a method on a service class.
- `service: PostService.create`: Generates a Service class and calls the method.

## Example

```yaml
controllers:
  Post:
    publish:
      query: find
      save: status:published
      fire: PostPublished
      flash: Post is now live!
      redirect: back
```
