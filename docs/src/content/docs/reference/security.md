---
title: Security & Authentication
description: Authentication, Rate Limiting, and File Uploads.
---

AdonisJS Blueprint integrates deeply with AdonisJS security features to keep your application safe.

## Authentication

By simply adding `auth: true` to your `draft.yaml`, Blueprint scaffolds a full authentication system.

```yaml
auth: true
```

- **User Model:** Generates a Lucid `User` model with `AuthFinder` mixin.
- **AuthController:** Generates methods for `login`, `register`, `store` (login logic), and `logout`.
- **Views:** Generates `auth/login` and `auth/register` templates.
- **Migrations:** Creates `users`, `remember_me_tokens`, and `auth_access_tokens` tables.

## Rate Limiting

Blueprint uses the `@adonisjs/limiter` package to protect your actions.

### 1. Define Limiters
```yaml
limiters:
  global:
    limit: 100
    duration: 1m
  api:
    limit: 10
    duration: 1s
    blockFor: 30m
```

### 2. Apply to Actions
Use the `throttle` statement inside a controller action.

```yaml
controllers:
  Auth:
    store:
      throttle: global
      validate: email, password
      save: true
```

## File Uploads

Securely handle file uploads using the `upload` statement.

```yaml
controllers:
  Profile:
    update:
      upload: avatar to: s3
      save: avatar
```

- Automatically generates logic to move the file to the specified disk.
- Sets up basic size and extension validation.
