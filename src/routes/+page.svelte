<script>
    import { base } from '$app/paths'
    import { enhance } from '$app/forms'
</script>

<h1>Plantool</h1>
<p>This tool allows you to visualize dependend steps in a project and check done steps.</p>

<div>
    <article>
        <h1>Login</h1>
        <form method="POST" action="?/login" use:enhance>
            <div>
                <label for="project">Project</label>
                <input type="text" name="project">
            </div>
            <div>
                <label for="password">Password</label>
                <input type="password" name="password">
            </div>
            <div>
                <button>Open</button>
            </div>
        </form>
    </article>

    <article>
        <a href={`${base}/create`}>create new project</a>
    </article>
</div>