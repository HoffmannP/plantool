<script>
    import { enhance } from '$app/forms'

    export let data
</script>

<h1>Existing entries</h1>
{#if data.projects.length}
<ul>
    {#each data.projects as project}
    <li><a href={project}>{project}</a></li>
    {/each}
</ul>
{:else}
<em>No projects found</em>
{/if}
<form method="POST" action="?/create" use:enhance>
    <div>
        <label for="entry">New entry</label>
        <input type="text" name="name">
    </div>
    <button>Create</button>
</form>
