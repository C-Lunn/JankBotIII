<script>
	import Tab from './BarTab.svelte';
</script>

<div class="bg-slate-100 w-full h-10 fixed top-6 z-99">
	<div class="max-w-screen-xl flex place-items-center gap-2 border-b px-4 w-full m-auto">
		<Tab href="/play">Play</Tab>
		<Tab href="/host">Host</Tab>
		<Tab href="/status">Status</Tab>
	</div>
</div>
