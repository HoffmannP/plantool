<script>
    import { page } from '$app/stores'
    import { base } from '$app/paths'

</script>

{#if $page.error.type == 'project not found'}
<h1>Project <em>{$page.error.project}</em> was not found</h1>

<a href={`${base}/${$page.error.project}/create`}>
    Create project <em>{$page.error.project}</em>
</a>
{:else}
<h1>{$page.error.message}</h1>
{/if}

<a href="/">back to Start</a>
