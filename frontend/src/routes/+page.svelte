<script>
    import { instance } from "@viz-js/viz"
    import { onMount } from "svelte"
    import { textToDto } from '@ochuzor/todo.txt-parser';

    let viz
    let svg = { outerHTML: '' }
    let todos = []
    let ids = []
    let selected

    onMount(init)

    async function init () {
        await Promise.all([
            loadTodos(),
            initViz()
        ])
        draw()
    }

    async function initViz () {
        viz = await instance()
    }

    function textToDtoWD (entry) {
        const i = textToDto(entry)
        i.id = i.tags.filter(t => t.name == 'id').map(t => t.value)?.[0]
        if (i.id === undefined) {
            throw Error(`Item does not have an ID: ${entry}`)
        }
        if (i.id in ids) {
            throw Error(`Item ID is duplicate: ${entry}`)
        }
        ids.push(i)
        i.p = i.tags.filter(t => t.name == 'p').map(t => t.value)
        console.debug(i)
        return i
    }

    async function loadTodos () {
        const response = await fetch('todo.txt')
        const todotxt = await response.text()
        ids = []
        todos = todotxt.split("\n").filter(line => line.length > 0).map(textToDtoWD)
    }

    function attributeList (attributeObject) {
        return Object.entries(attributeObject).map(([k, v]) =>
            `${k}="${Array.isArray(v) ? v.join(' '): v}"`
        ).join(', ')
    }

    function graph (nodes, edges) {
        /*
        ratio = "0.7071067811865476"
        size = "8.2731, 11.7000"
        resolution = "300"
        */
        return `digraph {
    rankdir = "LR"
    node [shape = "ellipse", fontsize = "10", fontname = "Lato regular", style="filled", fillcolor="white"]

    ${Object.entries(nodes).map(([k, v]) => `${k} [${attributeList(v)}]`).join("\n    ")}

    ${Object.entries(edges).map(([k, v]) => `${k} -> {${v.join(' ')}}`).join("\n    ")}
}`
    }

    function draw () {
        const connections = {}
        todos.forEach(i => i.p.forEach(p =>
            connections[p] = [...(connections[p] || []), i.id]
        ))

        const dotcode = graph(
            Object.fromEntries(todos.map(i => [i.id, {
                id: i.id,
                label: i.description,
                class: [...i.projects, ...i.projects.map(p => `project${p}`), i.isCompleted ? 'completed': '']
            }])),
            connections
        )
        svg = viz.renderSVGElement(dotcode)

        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        // Source: https://iros.github.io/patternfills/sample_svg.html
        defs.innerHTML = `<pattern id="diagonal-stripe-3" patternUnits="userSpaceOnUse" width="10" height="10">
            <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+CiAgPHBhdGggZmlsbD0iIzkwZWU5MCIgZD0iTTAgMGgxMHYxMEgweiIvPgogIDxwYXRoIHN0cm9rZT0iI2FkZDhlNiIgc3Ryb2tlLXdpZHRoPSIzIiBkPSJtLTEgMSAyLTJNMCAxMCAxMCAwTTkgMTFsMi0yIi8+Cjwvc3ZnPgo=" x="0" y="0" width="10" height="10">
            </image>
        <pattern`
        svg.appendChild(defs)
    }

    function klicked (pointerEvent) {
        const target = pointerEvent.target.closest('g')

        selected?.classList.remove('selected')
        selected = null

        if (!target.classList.contains('node') || target.classList.contains('completed')) {
            return
        }

        selected = target
        selected.classList.add('selected')
    }

</script>

<div on:click={klicked}>{@html svg.outerHTML}</div>

<style>
    div {
        --color-og: color(from lightblue srgb r g b / 1);
        --color-eg: color(from lightgreen srgb r g b / 1);
    }

    :global(svg text) {
        font-family: sans-serif;
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
</style>