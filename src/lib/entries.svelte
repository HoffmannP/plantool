<script>
    import { enhance } from '$app/forms'

    export let entries
</script>

<div>
    {#if entries.length}
    <ul>
        {#each entries as entry}
        <li><a href={entry}>{entry}</a></li>
        {/each}
    </ul>
    {:else}
    <em>No entries found</em>
    {/if}

    <form method="POST" action="?/create" use:enhance>
        <div>
            <label for="entry">New entry</label>
            <input type="text" name="name">
        </div>
        <div>
            <button>Create entry</button>
        </div>
    </form>
</div>
