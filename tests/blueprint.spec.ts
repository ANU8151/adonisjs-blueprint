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

  test('throw error for empty draft.yaml', async ({ assert }) => {
    const yamlContent = ''
    const filePath = join(process.cwd(), 'test-empty.yaml')
    writeFileSync(filePath, yamlContent)

    const parser = new BlueprintParser()
    await assert.rejects(
      () => parser.parse(filePath),
      `The draft file ${filePath} is empty or invalid. It must be a valid YAML object.`
    )

    unlinkSync(filePath)
  })
})
