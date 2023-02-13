<script lang="ts">
	import { page } from '$app/stores';
	export let selected: boolean = false;
	export let href: string = '';

	$: selected = $page.url.pathname.startsWith(href);
</script>

<div>
	<a
		{href}
		class="block pt-2 pb-1.5 px-2 {selected
			? 'border-b-2 border-b-indigo-700 text-indigo-700 font-normal'
			: 'font-thin'}
            hover:border-b-2 hover:border-b-indigo-700 hover:font-normal
            duration-75 transition-all
            flex justify-center w-20 h-full"
	>
		<slot />
	</a>
</div>