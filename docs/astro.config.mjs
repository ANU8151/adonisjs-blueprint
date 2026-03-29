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
						{ label: 'Getting Started', link: 'getting-started' },
						{ label: 'Inertia Integration', link: 'reference/inertia' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
				{
					label: 'Cookbook',
					autogenerate: { directory: 'cookbook' },
				},
			],
		}),
	],
});
