<script>
    import { onMount } from "svelte"
    import hotkeys from 'hotkeys-js'
    import { generateSvg } from './todot.js'

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
    let edge_from = null
    let edge_old_from = null
    let edge_to = null

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
    }

    function generateItemId(edititem) {
        const primitve_id = Array.from(edititem.description
            .normalize('NFKD')
            .toLocaleLowerCase()
            .replaceAll(/[:;<=>?@[\]^_`]/g, ''))
            .map(char => char.codePointAt(0))
            .filter(cp => (cp >= 48) && (cp <= 122) )
            .map(cp => String.fromCodePoint(cp))
            .slice(0, 32)
            .join('')
        return primitve_id
    }

    function nowDate () {
        const now = new Date()
        return now.toLocaleDateString("de", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).split('.').reverse().join('-')
    }

    function completeNode () {
        if (!selected) {
            return
        }
        if (todos[selected.id].isCompleted) {
            if (edges[selected.id].every(id => !todos[id].isCompleted)) {
                todos[selected.id].isCompleted = false
                todos[selected.id].dateOfCompletion = ''
                select(null)
            } else {
                select(edges[selected.id].filter(id => todos[id].isCompleted)[0])
            }
        } else {
            if (todos[selected.id].p.every(id => todos[id].isCompleted)) {
                todos[selected.id].isCompleted = true
                todos[selected.id].dateOfCompletion = nowDate()
                select(null)
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
            [edge_from, edge_to] = selected.querySelector('title').textContent.split('->')
            edge_old_from = edge_from
        }
        console.debug(edge_old_from, edge_from, edge_to)
        /* DEV */
        if (edgeDialog === null) {
            edgeDialog = document.querySelector('dialog.edge')
            console.log(edgeDialog)
        }
        /* /DEV */

        edgeDialog.showModal()
    }

    async function updateEdge (closeEvent) {
        if ((closeEvent.target.returnValue === 'loeschen') ||
            (edge_old_from && (closeEvent.target.returnValue === 'speichern'))) {
            const old_pos = todos[edge_to].p.indexOf(edge_old_from)
            delete todos[edge_to].p[old_pos]
        }
        if (closeEvent.target.returnValue === 'speichern') {
            todos[edge_to].p.push(edge_from)
        }

        edge_old_from = null
        edge_from = null
        edge_to = null

        todos = todos
    }

    function editNode () {
        if (selected) {
            edititem_id = selected.id
            edititem = todos[edititem_id]
        }
        console.debug(edititem_id, edititem)
        /* DEV */
        if (nodeDialog === null) {
            nodeDialog = document.querySelector('dialog.node')
            console.log(nodeDialog)
        }
        /* /DEV */

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
        svg = null
        svg = await generateSvg(edges, mytodos)
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

        select(null)
        if (!(target.classList.contains('node') || target.classList.contains('edge'))) {
            return
        }
        select(target)
    }

    function tokenize (string) {
        return string.split(',').map(s => s.trim()).filter(s => s.length > 0)
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
        From: <select bind:value={edge_from}>
            {#each items as item}
            <option value="{item}" selected={edge_from === item}>{todos[item].description}</option>
            {/each}
        </select><br>
        To: <select bind:value={edge_to} disabled={!!edge_old_from}>
            {#each items.filter(i => i !== edge_from) as item}
            <option value="{item}" selected={edge_to === item}>{todos[item].description}</option>
            {/each}
        </select><br>
        <button value="speichern">Speichern</button>
        {#if edge_old_from = null}<button value="loeschen">Löschen</button>{/if}
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
        opacity: .25;
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