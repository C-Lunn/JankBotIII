<script lang="ts">
	import Sidebar from '$lib/Layout/Sidebar.svelte';
	import Item from '$lib/Layout/SidebarItem.svelte';
	import { QueueList, MagnifyingGlass, Plus, ListBullet, PlayCircle } from '@steeze-ui/heroicons';
</script>

<Sidebar>
	<Item href="/play/np" icon={PlayCircle}>Now Playing</Item>
	<Item href="/play/import" icon={Plus}>Import</Item>
	<Item href="/play/search" icon={MagnifyingGlass}>Search</Item>
	<Item href="/play/queue" icon={QueueList}>Play Queue</Item>
	<Item href="/play/lists" icon={ListBullet}>Playlists</Item>
</Sidebar>
