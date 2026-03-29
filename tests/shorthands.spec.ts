import { test } from '@japa/runner'
import { MigrationGenerator } from '../src/generators/migration_generator.js'
import { join, dirname } from 'node:path'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

test.group('Shorthands', () => {
  const mockApp = (fs: any) =>
    ({
      makePath: (...args: string[]) => {
        return join(fs.basePath, ...args)
      },
      generators: {
        createEntity: (name: string) => ({
          name,
          path: '',
          className: name.charAt(0).toUpperCase() + name.slice(1),
          tableName: name.toLowerCase() + 's',
        }),
      },
      stubs: {
        create: async () => ({
          build: async (stubPath: string, { source }: { source: string }) => {
            const fullStubPath = join(source, stubPath)
            readFileSync(fullStubPath, 'utf8')

            return {
              prepare: (state: any) => {
                return {
                  destination: join(
                    fs.basePath,
                    'database/migrations',
                    state.entity.tableName + '.ts'
                  ),
                  write: async () => {
                    mkdirSync(
                      dirname(
                        join(fs.basePath, 'database/migrations', state.entity.tableName + '.ts')
                      ),
                      { recursive: true }
                    )
                    // We just care about the migration lines for this test
                    writeFileSync(
                      join(fs.basePath, 'database/migrations', state.entity.tableName + '.ts'),
                      state.attributesLines
                    )
                  },
                }
              },
            }
          },
        }),
      },
    }) as any

  const setupGenerator = (fs: any) => {
    const app = mockApp(fs)
    const mockCodemods = {
      makeUsingStub: async (root: string, path: string, state: any) => {
        const stubs = await app.stubs.create()
        const stub = await stubs.build(path, { source: root })
        const prepared = (stub as any).prepare(state)
        await prepared.write()
        return { destination: prepared.destination }
      },
    } as any
    return new MigrationGenerator(
      app,
      { info: () => {}, success: () => {}, action: () => ({ succeeded: () => {} }) } as any,
      [],
      mockCodemods
    )
  }

  test('parse complex shorthands', async ({ assert, fs }) => {
    const generator = setupGenerator(fs)
    await generator.generate('Post', {
      attributes: {
        title: 'string:unique:min:10',
        body: 'text:nullable',
        status: 'enum:draft,published:default:draft',
        category_id: 'integer:unsigned:references:categories.id',
        priority: 'integer:default:1',
      },
    })

    const content = await fs.contents('database/migrations/posts.ts')
    assert.include(content, "table.string('title').unique().notNullable()")
    assert.include(content, "table.text('body').nullable()")
    assert.include(
      content,
      "table.enum('status', ['draft', 'published']).notNullable().defaultTo('draft')"
    )
    assert.include(
      content,
      "table.integer('category_id').notNullable().unsigned().references('id').inTable('categories').onDelete('CASCADE')"
    )
    assert.include(content, "table.integer('priority').notNullable().defaultTo(1)")
  })
})
