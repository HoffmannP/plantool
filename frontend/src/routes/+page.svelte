<script>
    import { onMount } from "svelte"
    import hotkeys from 'hotkeys-js'
    import { generateSvg } from './todot.js'
    export let data

    const projects = [ "EG", "OG" ]
    const contexts = [ "Planung" ]
    let dialog
    let svg = { outerHTML: '' }
    let selected
    let edititem = emptyItem()
    let edititem_id = false

    $: edges = Object.entries(data.todos).reduce((es, [id, i]) => i.p.reduce((es, p) => {
        es[p] = [...(es[p] || []), id]
        return es
    }, es), {})


    onMount(init)

    async function init () {
        initKeys()
        draw()
    }

    function initKeys () {
        hotkeys("Del", completeNode)
        hotkeys("Enter", editNode)
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

    function completeNode () {
        if (!selected) {
            return
        }
        if (data.todos[selected.id].isCompleted) {
            if (edges[selected.id].every(id => !data.todos[id].isCompleted)) {
                data.todos[selected.id].isCompleted = false
                select(null)
            } else {
                select(edges[selected.id].filter(id => data.todos[id].isCompleted)[0])
            }
        } else {
            if (data.todos[selected.id].p.every(id => data.todos[id].isCompleted)) {
                data.todos[selected.id].isCompleted = true
                select(null)
                draw()
            } else {
                select(data.todos[selected.id].p.filter(id => !data.todos[id].isCompleted)[0])
            }
        }
    }

    function emptyItem () {
        const now = new Date()
        const nowDate = now.toLocaleDateString("de", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }).split('.').reverse().join('-')
        return {
            contexts: [],
            dateOfCompletion: '',
            dateOfCreation: nowDate,
            description: '',
            isCompleted: false,
            p: [],
            priority: '',
            projects: [],
            due: undefined,
            tags: []
        }
    }

    function editNode () {
        console.log("Test");
        if (selected) {
            edititem_id = selected.id
            edititem = data.todos[edititem_id]
        }
        console.log("Test")
        dialog.showModal()
    }

    async function draw () {
        svg = await generateSvg(edges, data.todos)
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
        if (!target.classList.contains('node')) {
            return
        }
        select(target)
    }

    async function updatItem (closeEvent) {
        console.log(closeEvent)
        if (closeEvent.target.returnValue === 'speichern') {
            if (edititem_id === false) {
                edititem_id = generateItemId(edititem)
            }
            data.todos[edititem_id] = edititem
        } else if (closeEvent.target.returnValue === 'loeschen') {
            delete data.todos[edititem_id]
        }
        edititem_id = false
        edititem = emptyItem()
        draw()
    }

</script>

<div>
    <div on:click={klicked}>
        {@html svg.outerHTML}
    </div>
    <dialog autofocus bind:this={dialog} on:close={updatItem}><form method="dialog">
            <input placeholder="Beschreibung" bind:value={edititem.description}><br>
            {#each projects as project}
            <label><input type="checkbox" value="{project}" name="projects" bind:group={edititem.projects}>{project}</label>
            {/each}<br>
            {#each contexts as context}
            <label><input type="checkbox" value="{context}" name="contexts" bind:group={edititem.contexts}>{context}</label>
            {/each}<br>
            Fällig: <input type="date" name="due" bind:value={edititem.due}><br>
            <button value="speichern">Speichern</button>
            <button value="loeschen">Löschen</button>
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
    :global(.selected ellipse) {
        stroke: red;
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