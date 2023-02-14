<script>
	import TopBar from '$lib/Layout/TopBar/TopBar.svelte';
	import TopTopBar from '$lib/Layout/TopBar/TopTopBar.svelte';
	import ListBar from './ListBar.svelte';
	import { ws } from '$lib/Service';
</script>

<TopBar />
<div class="flex h-screen pt-16">
	<ListBar />
	<main class="w-full max-h-screen overflow-y-scroll">
			<slot />
	</main>
</div>
