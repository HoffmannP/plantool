import { readFile } from 'node:fs/promises'
import { textToDto } from '@ochuzor/todo.txt-parser'

export async function load () {
  return {
    todos: await loadTodos()
  }
}

function textToDtoWD (todos, entry) {
  const i = textToDto(entry)
  const id = i.tags.filter(t => t.name === 'id').map(t => t.value)?.[0]
  if (id === undefined) {
    throw Error(`Item does not have an ID: ${entry}`)
  }
  if (id in todos) {
    throw Error(`Item ID is duplicate: ${entry} and ${todos[id]}`)
  }
  i.p = i.tags.filter(t => t.name === 'p').map(t => t.value)
  i.due = i.tags.filter(t => t.name === 'due').map(t => t.value)?.[0]
  todos[id] = i
  return todos
}

async function loadTodos () {
  const todotxt = await readFile('todo.txt', 'UTF8')
  return todotxt.split('\n').filter(line => line.length > 0).reduce(textToDtoWD, {})
}
