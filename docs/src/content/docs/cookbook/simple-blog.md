---
title: Simple Blog
description: A complete blog system with categories, posts, and auth.
---

This recipe demonstrates how to scaffold a full-featured blog with user authentication, category management, and posts.

## The `draft.yaml`

```yaml
settings:
  api: false
  inertia: { enabled: true, adapter: react }

auth: true

models:
  Category:
    attributes:
      name: string:unique
    relationships:
      posts: hasMany

  Post:
    attributes:
      title: string:min:10
      body: text
      status: enum:draft,published:default:draft
    softDeletes: true
    relationships:
      user: belongsTo
      category: belongsTo

controllers:
  Category:
    resource: true
    middleware: [auth]

  Post:
    middleware: [auth]
    index:
      query: paginate:10, with: user, category
      render: Posts/List
    store:
      validate: all
      save: true
      fire: PostCreated
      redirect: posts.index
    publish:
      query: find
      save: status:published
      send: PostPublishedMail
      redirect: back
```

## What gets generated?

1.  **Auth System:** Full login and registration.
2.  **Models:** `User`, `Category`, and `Post` with all relationships.
3.  **Migrations:** Tables for users, categories, posts, and auth tokens.
4.  **Controllers:** `CategoriesController` (Resource) and `PostsController`.
5.  **Views:** All Inertia React pages for managing blog content.
6.  **Side Effects:** `PostCreated` event and `PostPublishedMail` class.
