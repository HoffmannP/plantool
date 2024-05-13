import { instance } from '@viz-js/viz'
import pDebounce from 'p-debounce'

let viz

export const generateSvg = pDebounce(_generateSvg, 500)

async function _generateSvg (connections, todos) {
  if (viz === undefined) {
    viz = await instance()
  }
  if (Object.keys(todos).length == 0) {
    return null
  }

  const edges = Object.fromEntries(Object.entries(connections).map(([id, tos]) => [id, {
    to: tos,
    attr: {
      class: todos[id].isCompleted ? 'completed' : []
    }
  }]))

  const nodes = Object.fromEntries(Object.entries(todos).map(([id, i]) => [id, {
    id: id,
    label: i.description,
    class: [...i.projects.map(p => `project${p}`), i.isCompleted ? 'completed' : '']
  }]))

  const code = dotcode(nodes, edges)
  const svg = viz.renderSVGElement(code)

  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs')
  // Source: https://iros.github.io/patternfills/sample_svg.html
  defs.innerHTML = `<pattern id="diagonal-stripe-3" patternUnits="userSpaceOnUse" width="10" height="10">
        <image xlink:href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCI+CiAgPHBhdGggZmlsbD0iIzkwZWU5MCIgZD0iTTAgMGgxMHYxMEgweiIvPgogIDxwYXRoIHN0cm9rZT0iI2FkZDhlNiIgc3Ryb2tlLXdpZHRoPSIzIiBkPSJtLTEgMSAyLTJNMCAxMCAxMCAwTTkgMTFsMi0yIi8+Cjwvc3ZnPgo=" x="0" y="0" width="10" height="10">
        </image>
    <pattern`
  svg.appendChild(defs)

  return svg
}

function dotcode (nodes, edges) {
  return `digraph {
rankdir = "LR"
node [shape = "ellipse", fontsize = "10", fontname = "Lato regular", style="filled", fillcolor="white"]

${Object.entries(nodes).map(([k, v]) => `${k} [${attributeList(v)}]`).join('\n    ')}

${Object.entries(edges).map(([k, v]) => `${k} -> {${v.to.join(' ')}} [${attributeList(v.attr)}]`).join('\n    ')}
}`
}

function attributeList (attributeObject) {
  return Object.entries(attributeObject).map(([k, v]) =>
        `${k}="${Array.isArray(v) ? v.join(' ') : v}"`
  ).join(', ')
}
