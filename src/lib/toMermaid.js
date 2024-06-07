import mermaid from 'mermaid';
import pDebounce from 'p-debounce'

let init = false

export default pDebounce(generateSvg, 500)

async function generateSvg (connections, todos) {
  if (init === false) {
    mermaid.initialize({ startOnLoad: false })
    init = true
  }

  if (Object.keys(todos).length == 0) {
    return null
  }

  const edges = Object.fromEntries(Object.entries(connections).map(
    ([id, tos]) => [id, {
      to: tos,
      attr: {
        class: todos[id].isCompleted ? 'completed' : []
      }
    }]
  ))

  const nodes = Object.fromEntries(Object.entries(todos).map(
    ([id, i]) => [id, {
      id: id,
      label: i.description,
      class: [...i.projects.map(p => `project${p}`), i.isCompleted ? 'completed' : ''].filter(i => i)
    }]
  ))

  const code = mermaidcode(nodes, edges)
  console.log(code)
  const { svg } = await mermaid.render('graphDiv', code)
  const svgContainer = document.createElement('div')
  svgContainer.innerHTML = svg

  return svgContainer.firstChild
}

function mermaidcode (nodes, edges) {
  return `flowchart LR
    ${Object.entries(nodes).map(([k, v]) => `${k}(${v.label})${v.class.map(c => `:::${c}`).join('')}`).join('\n    ')}

    ${Object.entries(edges).map(([k, v]) => v.to.map(vv => `${vv} --> ${k}`).join('\n    ')).join('\n    ')}
`
}

function attributeList (attributeObject) {
  return Object.entries(attributeObject).map(([k, v]) =>
        `${k}="${Array.isArray(v) ? v.join(' ') : v}"`
  ).join(', ')
}
