import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://anu8151.github.io',
	base: '/adonisjs-blueprint',
	integrations: [
		starlight({
			title: 'AdonisJS Blueprint',
			social: {
				github: 'https://github.com/ANU8151/adonisjs-blueprint',
			},
			sidebar: [
				{
					label: 'Guides',
					items: [
						// Each item here is one entry in the sidebar.
						{ label: 'Getting Started', link: '/getting-started/' },
					],
				},
				{
					label: 'Reference',
					autogroup: true,
					directory: 'reference',
				},
			],
		}),
	],
});
