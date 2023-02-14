<script>
	import TopBar from '$lib/Layout/TopBar/TopBar.svelte';
	import HostBar from './HostBar.svelte';
</script>

<TopBar />
<div class="flex h-screen pt-16">
	<HostBar />
	<main class="w-full h-full overflow-y-scroll">
		<slot />
	</main>
</div>
