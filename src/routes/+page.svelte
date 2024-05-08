<script>
    import { onMount } from "svelte"
    import hotkeys from 'hotkeys-js'
    import { generateSvg } from './todot.js'
    import { generateItemId, nowDate } from './todo.helper.js'

    export let data

    let todos = {}
    let nodeDialog
    let edgeDialog
    let svg = null
    let selected = null
    let edititem = emptyItem()
    let edititem_id = false
    let newProjects = ''
    let newContexts = ''
    let editedge = {}
    let shortChange = false

    $: items = Object.keys(todos).toSorted()
    $: edges = buildEdges(items)
    $: projects = allCategories(items, 'projects')
    $: contexts = allCategories(items, 'contexts')
    $: draw(todos)

    function buildEdges(elements) {
        return elements.reduce(
            (es, id) => todos[id].p.reduce(
                (es, p) => {
                    es[p].push(id)
                    return es
                },
                es
            ),
            Object.fromEntries(elements.map(k => [k, []]))
        )
    }
    function allCategories(elements, category) {
        return Array.from(new Set(elements.map(i => todos[i][category]).flat()))
    }

    onMount(init)

    function preventDefaultWrapper(callback) {
        return function (event) {
            event.preventDefault()
            event.stopPropagation()
            callback.call(event)
        }
    }

    async function init () {
        todos = data.todos
        initKeys()
    }

    function initKeys () {
        hotkeys('Del', preventDefaultWrapper(completeNode))
        hotkeys('Enter', preventDefaultWrapper(edit))
        hotkeys('-', preventDefaultWrapper(editEdge))
        hotkeys('s', save)
    }

    function completeNode () {
        if (!selected || selected.classList.contains('edge')) {
            return
        }
        if (todos[selected.id].isCompleted) {
            if (edges[selected.id].every(id => !todos[id].isCompleted)) {
                shortChange = true
                todos[selected.id].isCompleted = false
                todos[selected.id].dateOfCompletion = ''
                select(null)
                todos = todos
            } else {
                select(edges[selected.id].filter(id => todos[id].isCompleted)[0])
            }
        } else {
            if (todos[selected.id].p.every(id => todos[id].isCompleted)) {
                shortChange = true
                todos[selected.id].isCompleted = true
                todos[selected.id].dateOfCompletion = nowDate()
                select(null)
                todos = todos
            } else {
                select(todos[selected.id].p.filter(id => !todos[id].isCompleted)[0])
            }
        }
    }

    function emptyItem () {
        return {
            contexts: [],
            dateOfCompletion: '',
            dateOfCreation: nowDate(),
            description: '',
            isCompleted: false,
            p: [],
            priority: '',
            projects: [],
            due: undefined,
            tags: []
        }
    }

    function edit () {
        if ((selected === null) || (selected.classList.contains('node'))) {
            editNode()
        } else {
            editEdge()
        }
    }

    function editEdge () {
        if (selected) {
            [editedge.from, editedge.to] = selected.querySelector('title').textContent.split('->')
        }
        edgeDialog.showModal()
    }

    async function updateEdge (closeEvent) {

        if ((closeEvent.target.returnValue === 'loeschen') ||
            (editedge.from && (closeEvent.target.returnValue === 'speichern'))) {
            const old_pos = todos[editedge.to].p.indexOf(editedge.from)
            delete todos[editedge.to].p[old_pos]
        }
        if (closeEvent.target.returnValue === 'speichern') {
            const fd = new FormData(closeEvent.target.querySelector('form'))
            const neweditedge = Object.fromEntries(fd.entries().toArray())
            todos[neweditedge.to].p.push(neweditedge.from)
        }

        editedge = {}
        todos = todos
    }

    function editNode () {
        if (selected) {
            edititem_id = selected.id
            edititem = todos[edititem_id]
        }
        nodeDialog.showModal()
    }

    async function updateNode (closeEvent) {
        if (closeEvent.target.returnValue === 'speichern') {
            if (edititem_id === false) {
                edititem_id = generateItemId(edititem)
            }
            edititem.projects.push(...tokenize(newProjects))
            newProjects = ''
            edititem.contexts.push(...tokenize(newContexts))
            newContexts = ''
            todos[edititem_id] = edititem
        } else if (closeEvent.target.returnValue === 'loeschen') {
            delete todos[edititem_id]
        }
        edititem_id = false
        edititem = emptyItem()
        todos = todos
    }

    async function draw (mytodos) {
        if (!shortChange) {
            svg = null
        }
        svg = await generateSvg(edges, mytodos)
        shortChange = false
    }

    function select(id) {
        if (selected) {
            selected.classList.remove('selected')
        }
        if (id === null) {
            selected = null
            return
        }
        if (id instanceof Element) {
            selected = id
        } else {
            const node = document.querySelector(`#${id}`)
            if (!node) {
                throw Error(`Can not find node ${id}`)
            }
            selected = node
        }
        selected.classList.add('selected')
    }

    function klicked (pointerEvent) {
        const target = pointerEvent.target.closest('g')

        if (selected && selected.classList.contains('node') &&
            pointerEvent.shiftKey) {
                todos[target.id].p.push(selected.id)
                todos = todos
                select(null)
                return
        }

        select(null)
        if (!(target.classList.contains('node') || target.classList.contains('edge'))) {
            return
        }
        select(target)
    }

    function tokenize (string) {
        return string.split(',').map(s => s.trim()).filter(s => s.length > 0)
    }

    function save () {
        fetch('./', { method: 'POST', body: JSON.stringify(todos) })
    }
</script>

<div>
    {#if svg}
    <div transition=fade on:click={klicked}>{@html svg.outerHTML}</div>
    {/if}

    <dialog clas="node" bind:this={nodeDialog} on:close={updateNode}><form method="dialog">
            <input placeholder="Beschreibung neue Aufgabe" bind:value={edititem.description}><br>
            {#each projects as project}
            <label><input type="checkbox" value="{project}" name="projects" bind:group={edititem.projects}>{project}</label>
            {/each}
            <input type="text" placeholder="weitere" bind:value={newProjects}/><br>
            {#each contexts as context}
            <label><input type="checkbox" value="{context}" name="contexts" bind:group={edititem.contexts}>{context}</label>
            {/each}
            <input type="text" placeholder="weitere" bind:value={newContexts}/><br>
            Fällig: <input type="date" name="due" bind:value={edititem.due}><br>
            <button value="speichern">Speichern</button>
            <button value="loeschen">Löschen</button>
            <button value="abbrechen">Abbrechen</button>
    </form></dialog>

    <dialog class="edge" bind:this={edgeDialog} on:close={updateEdge}><form method="dialog">
        From: <select name="from">
            {#each items as item}
            <option value={item} selected={editedge.from === item}>{todos[item].description}</option>
            {/each}
        </select><br>
        To: <select name="to">
            {#each items as item}
            <option value={item} selected={editedge.to === item}>{todos[item].description}</option>
            {/each}
        </select><br>
        <button value="speichern">Speichern</button>
        {#if editedge.from}<button value="loeschen">Löschen</button>{/if}
        <button value="abbrechen">Abbrechen</button>
</form></dialog>
</div>

<style>
    div {
        --color-og: color(from lightblue srgb r g b / 1);
        --color-eg: color(from lightgreen srgb r g b / 1);
    }

    :global(body, svg text) {
        font-family: sans-serif;
    }

    /*
    :global(svg) {
        width: 100%;
    }
    */

    :global(svg text) {
        user-select: none;
    }

    :global(.projectOG ellipse) {
        fill: var(--color-og);
    }
    :global(.projectEG ellipse) {
        fill: var(--color-eg);
    }
    :global(.completed) {
        opacity: .2;
    }
    :global(.selected ellipse, .selected path) {
        stroke: red;
        stroke-width: 2;
    }
    :global(.selected polygon) {
        stroke: red;
        fill: red;
        stroke-width: 2;
    }
    :global(.projectEG.projectOG ellipse) {
        fill: url(#diagonal-stripe-3);
    }

    dialog {
        line-height: 2;
    }

    ::backdrop {
      background-image: linear-gradient(
        45deg,
        magenta,
        rebeccapurple,
        dodgerblue,
        green
      );
      opacity: 0.75;
    }
</style>