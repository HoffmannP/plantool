import { textToDto, todoDtoToText } from '@ochuzor/todo.txt-parser'
import { generateItemId, nowDate } from './todo.helper.js'
import { base } from '$app/paths';
import { getContent, setContent } from '$lib/project.js'


const DIRECTORY = 'todos'

export async function load ({ params }) {
  return {
    todos: loadTodos(getContent(params))
  }
}

export const actions = {
  default: async ({ request, params }) => saveTodos(params, await request.json()),
}

function loadTodos (todotxt) {
  if (todotxt.length === 0) {
    todotxt = `${nowDate()} Erste Aufgabe anlegen`
  }
  return todotxt.split('\n').filter(line => line.length > 0).reduce(textToDtoWD, {})
}

function textToDtoWD (todos, entry) {
  const i = textToDto(entry)
  let id = i.tags.filter(t => t.name === 'id').map(t => t.value)?.[0]
  i.tags = i.tags.filter(t => t.name !== 'id')
  if (id === undefined) {
    id = generateItemId(i)
  }
  if (id in todos) {
    throw Error(`Item ID is duplicate: ${entry} and ${todos[id]}`)
  }
  i.p = i.tags.filter(t => t.name === 'p').map(t => t.value)
  i.tags = i.tags.filter(t => t.name !== 'p')
  i.due = i.tags.filter(t => t.name === 'due').map(t => t.value)?.[0]
  i.tags = i.tags.filter(t => t.name !== 'due')
  todos[id] = i
  return todos
}

async function saveTodos (params, todos) {
  const todotxt = Object.entries(todos).map(([id, i]) => todoDtoToTextWD({ id, ...i })).join('\n') + '\n'
  /*
  const todotxtold = getContent(params)

  if (todotxt === todotxtold) {
    console.log('No change')
    return { success: true, notice: 'no change' }
  }
  */

  setContent(params, todotxt)
  return { success: true }
}

function todoDtoToTextWD (todo) {
  if (todo.id) {
    todo.tags.push({ name: 'id', value: todo.id })
    delete todo.id
  }
  todo.p.filter(p => !!p).forEach(p => todo.tags.push({ name: 'p', value: p }))
  delete todo.p
  if (todo.due) {
    todo.tags.push({ name: 'due', value: todo.due })
    delete todo.due
  }
  return todoDtoToText(todo)
}
