<script lang="ts">
	import SectionTitle from '$lib/Type/SectionTitle.svelte';
	import SectionSubtitle from '$lib/Type/SectionSubtitle.svelte';
	import type { IconSource } from '@steeze-ui/svelte-icon/types/index';
	import IconButton from '$lib/Buttons/IconButton.svelte';

	export let title: string,
		subtitle: string,
		action: ((e: MouseEvent) => void) | undefined = undefined,
		icon: IconSource | undefined = undefined;
</script>

<header class="flex place-items-center">
	<div class="mr-auto">
		<SectionTitle>{title}</SectionTitle>
		<SectionSubtitle>{subtitle}</SectionSubtitle>
	</div>

	{#if action && icon}
		<IconButton {icon} {action} />
	{/if}
</header>
