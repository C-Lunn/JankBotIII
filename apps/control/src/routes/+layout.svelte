<script lang="ts">
	import '../app.css';
	import '@fontsource/merriweather-sans/variable.css';
	import '@fontsource/merriweather-sans/variable-italic.css';

	import TopTopBar from '$lib/Layout/TopBar/TopTopBar.svelte';
	import type { LayoutData } from './$types';
	import { ws } from '$lib/Service';
</script>

{#await ws.up() then _}
	<TopTopBar />
	<article class="bg-slate-50 text-slate-900 h-screen w-screen">
		<slot />
	</article>
{/await}
