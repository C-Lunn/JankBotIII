<script>
	import TopBar from '$lib/Layout/TopBar/TopBar.svelte';
	import TopTopBar from '$lib/Layout/TopBar/TopTopBar.svelte';
	import ListBar from './ListBar.svelte';
	import { ws } from '$lib/Service';
</script>

<TopBar />
<div class="flex h-full">
	<ListBar />
	<main class="w-full h-full">
		<div class="">
			<slot />
		</div>
	</main>
</div>
