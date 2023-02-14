<script lang="ts">
	import SectionHeader from '$lib/Layout/SectionHeader.svelte';
	import { Play, PlayCircle, Plus } from '@steeze-ui/heroicons';
	import { Icon } from '@steeze-ui/svelte-icon';
	import type { PageData } from './$types';
	import Duration from 'dayjs/plugin/duration';
	import dayjs from 'dayjs';
	import { RequestKind, ResponseKind } from 'janktypes';
	import { ws } from '$lib/Service';
	import { _song_res_schema } from './+page';

	export let data: PageData;

	dayjs.extend(Duration);

	const parse_songs = (songs: any[]) =>
		songs.map((o) => {
			let dur = dayjs.duration(o.duration, 'seconds');
			return {
				...o,
				duration: dur.format('mm:ss')
			};
		});

	const poll = async () => {
		if (!polling) return;
		setTimeout(async () => {
			const data = await ws.new_request(RequestKind.GetQueueContents);

			if (data.kind == ResponseKind.Empty) {
				return { songs: [] };
			}

			console.log(data);

			const res = await _song_res_schema.parseAsync(data.data);

			songs = parse_songs(res);

			poll();
		}, 1000);
	};

	const skip_to = (index: number) => {
		ws.new_request(RequestKind.SkipToPosition, index);
	};

	let songs = parse_songs(data.songs);

	$: selected = -1;

	let polling = true;
	poll();
</script>

<div class="max-w-2xl mx-auto mt-12">
	<SectionHeader
		title="Play Queue"
		subtitle="{songs.length} {songs.length == 1 ? "item" : "items"}"
		action={() => null}
		icon={Plus}
	/>
</div>

<ul class="flex flex-col my-8">
	{#each songs as song, i}
		<li
			class:selected={selected == i}
			on:click={() => (selected = i)}
			on:keydown={(e) => {
				e.key == 'Enter' ? (selected = i) : null;
			}}
			on:dblclick={(e) => skip_to(i)}
			tabindex="-1"
			class="{i % 2 ? 'bg-slate-50' : 'bg-slate-100'}
			select-none hover:bg-slate-200 cursor-default"
		>
			<div class="max-w-2xl my-1 flex mx-auto place-items-center">
				{#if song.active}
					<Icon src={Play} theme="mini" class="w-4 -ml-6 mr-2" />
				{/if}
				<span class:active={song.active}>{song.title}</span>
				<p class="ml-auto text-sm">{song.duration}</p>
			</div>
		</li>
	{/each}
</ul>

<style>
	.active {
		@apply font-semibold;
	}
	.selected {
		@apply bg-indigo-600 text-white;
	}
	.selected:hover {
		@apply bg-indigo-600;
	}
</style>
