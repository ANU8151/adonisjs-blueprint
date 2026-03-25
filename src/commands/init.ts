import { BaseCommand } from '@adonisjs/core/ace'
import { existsSync, writeFileSync } from 'node:fs'

export default class InitBlueprint extends BaseCommand {
  static commandName = 'blueprint:init'
  static description = 'Initialize a draft.yaml file with a professional-grade example'

  async run() {
    const draftPath = this.app.makePath('draft.yaml')

    if (existsSync(draftPath)) {
      const confirm = await this.prompt.confirm(
        'A draft.yaml already exists. Do you want to overwrite it?'
      )
      if (!confirm) {
        this.logger.info('Initialization cancelled.')
        return
      }
    }

    const content = `# yaml-language-server: $schema=node_modules/adonis-blueprint/build/src/schema.json

settings:
  api: true
  inertia:
    enabled: false
    adapter: react

# Define your models here
models:
  User:
    attributes:
      email: string:unique
      password: string
      full_name: string:optional
    relationships:
      posts: hasMany

  Post:
    attributes:
      title: string:min:5
      content: text
      status: enum:draft,published,archived
    softDeletes: true
    relationships:
      user: belongsTo
      tags: belongsToMany

  Tag:
    attributes:
      name: string:unique

# Define your controllers and business logic here
controllers:
  Post:
    resource: true
    publish:
      query: find
      validate: title, content
      save: true
      fire: PostPublished
      send: NewPostMail
      render: 'json with: post'
`
    writeFileSync(draftPath, content)
    this.logger.success('draft.yaml initialized successfully.')
    this.logger.info('You can now run: node ace blueprint:build')
  }
}
