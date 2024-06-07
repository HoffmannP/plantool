<script>
    import { onMount } from "svelte"
    import hotkeys from 'hotkeys-js'
    import generateSvg from '$lib/toDotviz.js'
    // import generateSvg from '$lib/toMermaid.js'
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
    let showComplete = false

    $: items = Object.keys(todos).toSorted()
    $: edges = buildEdges(items)
    $: projects = allCategories(items, 'projects')
    $: contexts = allCategories(items, 'contexts')
    $: draw(todos, showComplete)

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
    onMount(init)

    function initKeys () {
        hotkeys('Del', preventDefaultWrapper(completeNode))
        hotkeys('shift+left', selectPrevNode)
        hotkeys('shift+right', selectNextNode)
        hotkeys('shift+down', selectPrevEdge)
        hotkeys('shift+top', selectNextEdge)
        hotkeys('Enter', preventDefaultWrapper(edit))
        hotkeys('-', preventDefaultWrapper(editEdge))
        hotkeys('s', save)
        hotkeys('ctrl+m', toggleComplete)
    }

    function toggleComplete () {
        showComplete = !showComplete
    }

    function selectPrevNode() {
        if (!selected) {
            return select(Object.keys(todos)[0])
        }

        let prev = selected.previousElementSibling
        while (!prev.classList.contains('node')) {
            if (prev.previousElementSibling === null) {
                const children = prev.parentElement.children
                prev = children[children.length - 1]
            } else {
                prev = prev.previousElementSibling
            }
        }
        select(prev)
    }

    function selectNextNode() {
        if (!selected) {
            return select(Object.keys(todos)[0])
        }

        let next = selected.nextElementSibling
        while (!next.classList.contains('node')) {
            if (next.nextElementSibling === null) {
                next = next.parentElement.children[0]
            } else {
                next = next.nextElementSibling
            }
        }
        select(next)
    }

    function selectPrevEdge() {
        if (!selected) {
            return select(Object.keys(todos)[0])
        }

        let prev = selected.previousElementSibling
        while (!prev.classList.contains('edge')) {
            if (prev.previousElementSibling === null) {
                const children = prev.parentElement.children
                prev = children[children.length - 1]
            } else {
                prev = prev.previousElementSibling
            }
        }
        select(prev)
    }

    function selectNextEdge() {
        if (!selected) {
            return select(Object.keys(todos)[0])
        }

        let next = selected.nextElementSibling
        while (!next.classList.contains('edge')) {
            if (next.nextElementSibling === null) {
                next = next.parentElement.children[0]
            } else {
                next = next.nextElementSibling
            }
        }
        select(next)
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

        svg = await generateSvg(
            showComplete
                ? edges
                : Object.fromEntries(Object.entries(edges).filter(
                    ([from, _]) => !(mytodos[from].isCompleted)
                )),
            showComplete
                ? mytodos
                : Object.fromEntries(Object.entries(mytodos).filter(
                    ([_, todo]) => !(todo.isCompleted)
                )))
        svg = enhanceDrawing(svg)
        shortChange = false
    }

    function enhanceDrawing(svg) {
        if (svg === null) {
            return svg
        }
        if (svg.classList.contains('enhanced')) {
            return svg
        }

        svg.classList.add('enhanced')
        Object.entries(todos).filter(([_, i]) => i.due && !i.isCompleted).forEach(function ([id, i]) {
            const item = svg.querySelector(`#${id}`)
            const ellipse = item.querySelector('ellipse')

            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
            const x = ellipse.cx.baseVal.value + ellipse.rx.baseVal.value - 50
            const y = ellipse.cy.baseVal.value + ellipse.ry.baseVal.value - 5
            group.setAttribute('transform', `translate(${x}, ${y})`)
            item.appendChild(group)

            const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            box.classList.add('due')
            box.setAttribute('rx', 5)
            box.setAttribute('width', 57)
            box.setAttribute('height', 12)
            group.appendChild(box)

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
            text.classList.add('due')
            text.setAttribute('dx', 3)
            text.setAttribute('dy', 9)
            text.innerHTML = i.due
            group.appendChild(text)
        })

        Object.entries(todos).filter(([_, i]) => i.contexts.length > 0 && !i.isCompleted).forEach(function ([id, i]) {
            const item = svg.querySelector(`#${id}`)
            if (!item) return
            const ellipse = item.querySelector('ellipse')
            const widthfactor = 6

            const group = document.createElementNS('http://www.w3.org/2000/svg', 'g')
            const x = ellipse.cx.baseVal.value - i.contexts.join(' ').length * widthfactor/2
            const y = ellipse.cy.baseVal.value - ellipse.ry.baseVal.value - 5
            group.setAttribute('transform', `translate(${x}, ${y})`)
            item.appendChild(group)

            const box = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
            box.classList.add('context')
            box.setAttribute('rx', 0)
            box.setAttribute('width', i.contexts.join(' ').length * widthfactor)
            box.setAttribute('height', 13)
            group.appendChild(box)

            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text')
            text.classList.add('context')
            text.setAttribute('dx', 3)
            text.setAttribute('dy', 9)
            text.innerHTML = i.contexts.join(' ')
            group.appendChild(text)
        })


        return svg
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
        console.log(selected.id)
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
        fetch('', { method: 'POST', body: JSON.stringify(todos) })
    }
</script>

<div>
    {#if svg}
    <picture role="presentation" transition=fade on:click={klicked}>{@html svg.outerHTML}</picture>
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

    :global(svg text.due) {
        font-size: 10px;
        fill: darkslategray
    }
    :global(svg rect.due) {
        fill: white;
        stroke: darkslategray;
    }

    :global(svg text.context) {
        font-size: 10px;
        fill: white
    }
    :global(svg rect.context) {
        fill: rebeccapurple;
    }

    :global(.projectOG ellipse),
    :global(#graphDiv .node.projectOG rect) {
        fill: var(--color-og);
    }
    :global(.projectEG ellipse),
    :global(#graphDiv .node.projectEG rect) {
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