<script lang="ts">
	import type { IconSource } from '@steeze-ui/svelte-icon/types/index';
	import { Icon } from '@steeze-ui/svelte-icon';

	export let action: (e: MouseEvent) => void, icon: IconSource;
</script>

<button
	on:click={action}
	class="p-2 bg-indigo-700 rounded-full w-10 h-10 aspect-square text-slate-50
        active:bg-indigo-800"
>
	<Icon src={icon} theme="solid" />
</button>
