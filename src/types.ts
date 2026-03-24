export interface Entity {
  name: string
  path: string
  className: string
  tableName?: string
}

export interface ModelAttribute {
  name: string
  type: string
  modifiers: string[]
}

export interface ModelRelationship {
  type: 'belongsTo' | 'hasMany' | 'belongsToMany' | 'hasOne'
  model: string
}

export interface ModelDefinition {
  name: string
  attributes: Record<string, string | { type: string; modifiers?: string[] }>
  relationships?: Record<string, string>
}

export interface ControllerAction {
  query?: string
  render?: string
  validate?: string
  save?: string | boolean
  flash?: string
  redirect?: string
  delete?: string | boolean
}

export interface ControllerDefinition {
  name: string
  actions: Record<string, ControllerAction>
}

export interface BlueprintSchema {
  models?: Record<string, any>
  controllers?: Record<string, any>
}
