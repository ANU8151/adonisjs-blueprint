import type { Entity } from './types.js'
import { type EventGenerator } from './generators/event_generator.js'
import { type MailGenerator } from './generators/mail_generator.js'
import { type JobGenerator } from './generators/job_generator.js'
import { type NotificationGenerator } from './generators/notification_generator.js'
import { type ServiceGenerator } from './generators/service_generator.js'

export interface StatementContext {
  actionName: string
  actionDef: any
  entity: Entity
  isApi: boolean
  useInertia: boolean
  pluralName: string
  singularName: string
  generators: {
    event: EventGenerator
    mail: MailGenerator
    job: JobGenerator
    notification: NotificationGenerator
    service: ServiceGenerator
  }
  models?: any
}

export interface StatementResult {
  logicLines: string[]
  imports?: {
    models?: string[]
    validators?: string[]
    events?: string[]
    policies?: string[]
    mails?: string[]
    jobs?: string[]
    notifications?: string[]
    services?: string[]
  }
  context?: string[]
}

export type StatementHandler = (
  value: any,
  context: StatementContext
) => StatementResult | Promise<StatementResult>

class StatementsRegistry {
  private handlers = new Map<string, StatementHandler>()

  register(name: string, handler: StatementHandler) {
    this.handlers.set(name, handler)
  }

  get(name: string): StatementHandler | undefined {
    return this.handlers.get(name)
  }

  has(name: string): boolean {
    return this.handlers.has(name)
  }

  all() {
    return this.handlers.entries()
  }
}

export const statementsRegistry = new StatementsRegistry()
