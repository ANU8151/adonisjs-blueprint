import { test } from '@japa/runner'
import { BlueprintParser } from '../src/parser.js'
import { writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'

test.group('BlueprintParser', () => {
  test('parse draft.yaml', async ({ assert }) => {
    const yamlContent = `
models:
  Post:
    title: string
    content: text
controllers:
  Post:
    index:
      render: posts/index
`
    const filePath = join(process.cwd(), 'test-draft.yaml')
    writeFileSync(filePath, yamlContent)

    const parser = new BlueprintParser()
    const result = await parser.parse(filePath)

    assert.property(result, 'models')
    assert.property(result, 'controllers')
    assert.equal(result.models?.Post.title, 'string')

    unlinkSync(filePath)
  })
})
