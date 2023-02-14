<script lang="ts">
	import Sidebar from '$lib/Layout/Sidebar.svelte';
	import Item from '$lib/Layout/SidebarItem.svelte';
	import { QueueList, MagnifyingGlass, Plus, ListBullet, PlayCircle, Hashtag } from '@steeze-ui/heroicons';
</script>

<Sidebar>
	<Item href="/host/import" icon={Plus}>Import</Item>
	<Item href="/host/threads" icon={Hashtag}>Threads</Item>
</Sidebar>
