---
title: Realtime (WebSockets)
description: Generating channels and authorization logic with AdonisJS Transmission.
---

AdonisJS Blueprint supports realtime communication out of the box using `@adonisjs/transmission`.

## Defining Channels

You can define multiple channels under the `channels` key.

```yaml
channels:
  ProjectChannel:
    authorized: true
  ChatChannel:
    name: chat:public
    authorized: false
```

- **Generates:** `start/transmission.ts`.
- **Logic:** Automatically adds `transmission.authorize()` blocks for each channel.

## Channel Options

- `name`: Override the default channel name.
- `authorized`: If set to `true`, the generator adds a check to ensure `user` is authenticated (`!!user`).

## Usage in Controllers

While Blueprint doesn't currently generate `transmission.broadcast()` logic within controller actions, it provides the necessary infrastructure (`start/transmission.ts`) for you to start emitting events immediately.
