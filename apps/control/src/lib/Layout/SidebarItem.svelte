<script lang="ts">
	import { page } from '$app/stores';
	import { Icon } from '@steeze-ui/svelte-icon';
	import type { IconSource } from '@steeze-ui/svelte-icon/types/';

	export let icon: IconSource;
	export let selected: boolean = false;
	export let href: string;

	$: selected =
		href == $page.url.pathname
			? $page.url.pathname.startsWith(href)
			: $page.url.pathname.endsWith(href);
</script>

<li>
	<a
		{href}
		class="px-3 py-2 flex place-items-center gap-2 text-sm
		{selected
			? 'bg-indigo-700 text-white active:bg-indigo-800'
			: 'hover:bg-slate-200 text-neutral-700 active:bg-slate-300'}"
		class:selected
	>
		<Icon src={icon} theme="mini" class="w-4 h-4" />
		<slot />
	</a>
</li>
