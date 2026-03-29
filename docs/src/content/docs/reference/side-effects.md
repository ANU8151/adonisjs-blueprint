---
title: Side Effects
description: Generating Events, Mails, Jobs, and Notifications with Blueprint.
---

Blueprint makes it incredibly easy to handle asynchronous tasks and communications by automatically generating the necessary classes and the logic to trigger them.

## Events

Use the `fire` statement to generate an AdonisJS Event class and emit it from your controller.

```yaml
controllers:
  Post:
    store:
      save: true
      fire: NewPostCreated
```

- **Generates:** `app/events/new_post_created.ts`
- **Logic:** `await NewPostCreated.dispatch(payload)`

## Mails

Use the `send` statement to generate a Mail class and send it later (queued).

```yaml
controllers:
  Auth:
    register:
      save: true
      send: WelcomeEmail
```

- **Generates:** `app/mails/welcome_email.ts`
- **Logic:** `await WelcomeEmail.send(payload)`

## Jobs

Use the `dispatch` statement to generate a Background Job.

```yaml
controllers:
  Video:
    upload:
      save: true
      dispatch: ProcessVideo
```

- **Generates:** `app/jobs/process_video.ts`
- **Logic:** `await ProcessVideo.dispatch(payload)`

## Notifications

Use the `notify` statement to send multi-channel notifications.

```yaml
controllers:
  Task:
    assign:
      save: true
      notify: user, TaskAssignedNotification
```

- **Generates:** `app/notifications/task_assigned_notification.ts`
- **Logic:** `await user.notify(new TaskAssignedNotification(payload))`
