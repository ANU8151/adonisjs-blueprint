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

    const ui = this.generateUIComponents(entity, attributes, adapter)

    await this.generateStub(stubPath, {
      entity,
      attributes, // Keep for tests
      action,
      folder,
      ...ui,
    })
  }

  private generateUIComponents(entity: any, attributes: any[], adapter: string) {
    const singularName = entity.name.toLowerCase()

    if (adapter === 'react') {
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
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
          />
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
      }
    }

    if (adapter === 'vue') {
      return {
        tableHeaders: attributes
          .map((a) => `<th class="px-4 py-2 border-b text-left">${a.name}</th>`)
          .join('\n              '),
        tableCells: attributes
          .map((a) => `<td class="px-4 py-2 border-b text-left">{{ item.${a.name} }}</td>`)
          .join('\n                '),
        formFields: attributes
          .map(
            (a) => `
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">${a.name}</label>
          <input 
            type="text" 
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
          />
        </div>`
          )
          .join('\n        '),
        showFields: attributes
          .map(
            (a) => `
        <div class="mb-4">
          <span class="font-bold">${a.name}:</span>
          <span class="ml-2">{{ ${singularName}?.${a.name} }}</span>
        </div>`
          )
          .join('\n        '),
      }
    }

    if (adapter === 'svelte') {
      return {
        tableHeaders: attributes
          .map((a) => `<th class="px-4 py-2 border-b text-left">${a.name}</th>`)
          .join('\n            '),
        tableCells: attributes
          .map((a) => `<td class="px-4 py-2 border-b text-left">{item.${a.name}}</td>`)
          .join('\n              '),
        formFields: attributes
          .map(
            (a) => `
      <div class="mb-4">
        <label class="block text-gray-700 text-sm font-bold mb-2">${a.name}</label>
        <input 
          type="text" 
          class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
        />
      </div>`
          )
          .join('\n      '),
        showFields: attributes
          .map(
            (a) => `
      <div class="mb-4">
        <span class="font-bold">${a.name}:</span>
        <span class="ml-2">{${singularName}?.${a.name}}</span>
      </div>`
          )
          .join('\n      '),
      }
    }

    // Default to Edge
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
        <div class="mb-4">
          <label class="block text-gray-700 text-sm font-bold mb-2">${a.name}</label>
          <input 
            type="text" 
            name="${a.name}"
            class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
          />
        </div>`
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
    }
  }
}
