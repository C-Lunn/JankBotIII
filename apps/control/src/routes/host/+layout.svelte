<script>
	import TopBar from '$lib/Layout/TopBar/TopBar.svelte';
	import HostBar from './HostBar.svelte';
</script>

<TopBar />
<div class="flex h-full">
	<HostBar />
	<main class="w-full h-full">
		<div class="">
			<slot />
		</div>
	</main>
</div>