<script>
    import { enhance } from '$app/forms'

    let password = ''
    let pwconfirm = ''

    $: showWarning = (password.length > 0) && (pwconfirm.length > 0) && (password != pwconfirm)
    $: readyToSend = (password.length > 0) && (pwconfirm.length > 0) && (password == pwconfirm)

</script>

<div>
    <h1>Create Project</h1>
    <form method="POST" action="?/create" use:enhance>
        <div>
            <label for="project">Project</label>
            <input type="text" name="project" autocomplete="username">
        </div>
        {#if (showWarning)}
        <div>Passwords don't match</div>
        {/if}
        <div>
            <label for="password">Password</label>
            <input type="password" bind:value={password} name="password" autocomplete="new-password">
        </div>
        <div>
            <label for="pwconfirm">Password Confirmation</label>
            <input type="password" bind:value={pwconfirm} name="pwconfirm">
        </div>
        <div>
            <button disabled={!readyToSend}>Create project</button>
        </div>
    </form>
</div>
