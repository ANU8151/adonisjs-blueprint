import { BaseGenerator } from './base_generator.js'

export class ViewGenerator extends BaseGenerator {
  async generate(
    name: string,
    useInertia: boolean = false,
    adapter: 'react' | 'vue' | 'svelte' = 'react',
    definition?: any
  ) {
    const entity = this.app.generators.createEntity(name)
    let stubPath = 'make/view/edge.stub'

    if (useInertia) {
      stubPath = `make/view/${adapter}.stub`
    }

    const attributes = definition?.attributes
      ? Object.entries(definition.attributes).map(([attrName, attrType]) => ({
          name: attrName,
          type: typeof attrType === 'string' ? attrType : (attrType as any).type,
        }))
      : []

    const action = name.split('/').pop() || 'show'
    const folder = name.split('/').slice(0, -1).join('/')

    const ui = this.generateUIComponents(entity, attributes, action, folder, adapter)

    await this.generateStub(stubPath, {
      entity,
      attributes, // Keep for tests
      action,
      folder,
      ...ui,
    })
  }

  private generateUIComponents(
    entity: any,
    attributes: any[],
    action: string,
    folder: string,
    adapter: string
  ) {
    const singularName = entity.name.toLowerCase()
    const pluralName = folder || singularName + 's'

    if (adapter === 'react') {
      const isEdit = action === 'edit'
      const route = isEdit ? `${pluralName}.update` : `${pluralName}.store`
      const routeParams = isEdit ? `routeParams={{ id: props.${singularName}?.id }}` : ''

      return {
        tableHeaders: attributes
          .map((a) => `<th className="px-4 py-2 border-b text-left">${a.name}</th>`)
          .join('\n              '),
        tableCells: attributes
          .map((a) => `<td className="px-4 py-2 border-b text-left">{item.${a.name}}</td>`)
          .join('\n                '),
        formFields: attributes
          .map(
            (a) => `
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">${a.name}</label>
            <input 
              type="text" 
              name="${a.name}"
              data-invalid={errors.${a.name} ? 'true' : undefined}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
            />
            {errors.${a.name} && <div className="text-red-500 text-xs italic">{errors.${a.name}}</div>}
          </div>`
          )
          .join('\n        '),
        showFields: attributes
          .map(
            (a) => `
        <div className="mb-4">
          <span className="font-bold">${a.name}:</span>
          <span className="ml-2">{props.${singularName}?.${a.name}}</span>
        </div>`
          )
          .join('\n        '),
        formComponent: `<Form route="${route}" ${routeParams} method="${isEdit ? 'PUT' : 'POST'}">`,
      }
    }

    // Default to Edge
    const isEdit = action === 'edit'
    const route = isEdit ? `${pluralName}.update` : `${pluralName}.store`
    const routeParams = isEdit ? `, routeParams: { id: ${singularName}.id }` : ''

    return {
      tableHeaders: attributes
        .map((a) => `<th class="px-4 py-2 border-b text-left">${a.name}</th>`)
        .join('\n              '),
      tableCells: attributes
        .map((a) => `<td class="px-4 py-2 border-b text-left">\\{{ item.${a.name} }}</td>`)
        .join('\n                '),
      formFields: attributes
        .map(
          (a) => `
        @field.root({ name: '${a.name}' })
          <label class="block text-gray-700 text-sm font-bold mb-2">${a.name}</label>
          @!input.control({ type: 'text' })
          @!field.error()
        @end`
        )
        .join('\n        '),
      showFields: attributes
        .map(
          (a) => `
        <div class="mb-4">
          <span class="font-bold">${a.name}:</span>
          <span class="ml-2">\\{{ ${singularName}?.${a.name} }}</span>
        </div>`
        )
        .join('\n        '),
      formComponent: `@form({ route: '${route}'${routeParams}, method: '${isEdit ? 'PUT' : 'POST'}' })`,
    }
  }
}
