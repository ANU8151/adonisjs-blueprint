---
title: Models & Migrations
description: How to define models and migrations in AdonisJS Blueprint.
---

Models are defined under the `models` key in your `draft.yaml`. Each model generates a Lucid model class and a corresponding migration file.

## Attributes

Attributes define the database columns. Blueprint supports a variety of types and modifiers using a concise shorthand syntax.

### Types

- `string`: A standard string column.
- `text`: A text column for longer content.
- `integer`: An integer column.
- `boolean`: A boolean column.
- `datetime` / `timestamp`: Date and time columns.
- `float` / `decimal`: Numeric columns with precision.
- `json` / `jsonb`: JSON storage columns.
- `uuid`: UUID column.
- `enum:value1,value2`: Enum column with specific values.

### Modifiers

- `unique`: Adds a unique index.
- `nullable` / `optional`: Makes the column nullable.
- `unsigned`: Makes an integer column unsigned.
- `default:value`: Sets a default value for the column.
- `references:table.column`: Defines a foreign key constraint.

### Example

```yaml
models:
  Post:
    attributes:
      title: string:unique:min:5
      body: text:nullable
      status: enum:draft,published:default:draft
      category_id: integer:unsigned:references:categories.id
```

## Relationships

Relationships are defined under the `relationships` key within a model.

- `belongsTo`: Defines a `belongsTo` relationship and automatically adds the foreign key if missing.
- `hasMany`: Defines a `hasMany` relationship.
- `belongsToMany`: Defines a `belongsToMany` relationship and automatically generates the pivot table migration.
- `hasOne`: Defines a `hasOne` relationship.

### Example

```yaml
models:
  Post:
    relationships:
      user: belongsTo
      tags: belongsToMany
```

## Soft Deletes

To enable soft deletes for a model, add `softDeletes: true`. This adds a `deleted_at` column to the migration and applies the `withSoftDeletes` mixin to the Lucid model.

```yaml
models:
  Post:
    softDeletes: true
```
