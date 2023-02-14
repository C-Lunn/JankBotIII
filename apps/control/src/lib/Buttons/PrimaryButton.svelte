<script lang="ts">
	let kind: 'button' | 'reset' | 'submit' = 'button',
		klass: string = '';

	export { kind as type, klass as class };
</script>

<button
	type={kind}
	class="px-6 py-2.5 bg-indigo-600 active:bg-indigo-700
        text-white rounded-full {klass}"
	on:click
>
	<slot />
</button>
