---
title: SaaS Multi-Tenant Starter
description: Teams, memberships, and projects.
---

This recipe shows how to scaffold a multi-tenant SaaS foundation where users belong to teams and work on shared projects.

## The `draft.yaml`

```yaml
settings:
  api: true # Pure API mode

auth: true

models:
  Team:
    attributes:
      name: string
      slug: string:unique
    relationships:
      members: belongsToMany:User
      projects: hasMany

  Project:
    attributes:
      name: string
      description: text:optional
    relationships:
      team: belongsTo
      tasks: hasMany

  Task:
    attributes:
      title: string
      status: enum:todo,doing,done:default:todo
    relationships:
      project: belongsTo
      user: belongsTo

controllers:
  Team:
    resource: true
    middleware: [auth]
  
  Project:
    middleware: [auth]
    index:
      query: all, with: team
      render: json
    store:
      validate: name, team_id
      save: true
      dispatch: ProvisionProjectResources
      render: json
```

## Highlights

- **Many-to-Many:** Uses `belongsToMany` for Team memberships, generating the `team_user` pivot table.
- **API Mode:** Set to `api: true` to generate clean JSON controllers without views.
- **Jobs:** Uses `dispatch` to handle infrastructure provisioning in the background.
