<script>
	import PrimaryButton from "$lib/Buttons/PrimaryButton.svelte";

</script>
<div class="w-full h-screen flex flex-col justify-center place-items-center">
	<h1 class="text-2xl font-light mb-2">Import a Thread</h1>
    <p class="text-sm text-slate-700">Right-click a thread, click "Copy Link" and paste it below:</p>
	<form class="flex flex-col place-items-center gap-3 my-6">
		<label>
			<input
				type="text"
				class="rounded w-80 border-slate-400 bg-slate-100 
                focus:ring-4 focus:ring-indigo-200 focus:border-indigo-400
                transition-all duration-[50ms] ease-in-out"

				placeholder="Thread URL"
			/>
		</label>

        <PrimaryButton type="submit">do the thing</PrimaryButton>
	</form>
</div>
