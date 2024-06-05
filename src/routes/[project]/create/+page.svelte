<script>
    import { enhance } from '$app/forms'

    export let data

    let password = ''
    let pwconfirm = ''

    $: showWarning = (password.length > 0) && (pwconfirm.length > 0) && (password != pwconfirm)
    $: readyToSend = (password.length > 0) && (pwconfirm.length > 0) && (password == pwconfirm)

</script>

<h1>Creating Project <em>{data.project}</em></h1>

<form method="POST" action='?/create' use:enhance>
    <p>Please choose a password for your project:</p>
    <input type="hidden" name="project" value={data.project}>
    {#if (showWarning)}
    <div>Passwords don't match</div>
    {/if}
    <div>
        <label for="password">Password</label>
        <input type="password" bind:value={password} name="password" autocomplete="new-password">
    </div>
    <div>
        <label for="pwconfirm">Password Confirmation</label>
        <input type="password" bind:value={pwconfirm} name="pwconfirm" autocomplete="new-password"
        >
    </div>
    <div>
        <button disabled={!readyToSend}>Create project <em>{data.project}</em></button>
    </div>
</form>
