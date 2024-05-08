import { access, mkdir, readFile, symlink, unlink, writeFile } from 'node:fs/promises'
import { basename } from 'path'
import { textToDto, todoDtoToText } from '@ochuzor/todo.txt-parser'
import { generateItemId, nowDate } from './todo.helper.js'

export async function load () {
  return {
    todos: await loadTodos()
  }
}

const DIRECTORY = 'todos'
const PROJECT = 'kub'

function textToDtoWD (todos, entry) {
  const i = textToDto(entry)
  let id = i.tags.filter(t => t.name === 'id').map(t => t.value)?.[0]
  if (id === undefined) {
    id = generateItemId(i)
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
  let todotxt
  try {
    const filename = `${DIRECTORY}/${PROJECT}/todo.txt`
    todotxt = await readFile(filename, { encoding: 'UTF8' })
  } catch {
    todotxt = `${nowDate()} Erste Aufgabe anlegen`
  }
  return todotxt.split('\n').filter(line => line.length > 0).reduce(textToDtoWD, {})
}

export const actions = {
  default: async function ({ url, request }) {
    const todos = await request.json()
    const todotxt = Object.entries(todos).map(([id, i]) => todoDtoToText({ id, ...i })).join('\n') + '\n'

    const newFilename = `${DIRECTORY}/${PROJECT}/todo-${Date.now()}.txt`
    const filename = `${DIRECTORY}/${PROJECT}/todo.txt`
    try {
      access(`${DIRECTORY}/${PROJECT}`)
    } catch {
      mkdir(`${DIRECTORY}/${PROJECT}`)
    }

    await writeFile(newFilename, todotxt, { encoding: 'UTF8' })
    try {
      await unlink(filename)
    } catch {}
    await symlink(basename(newFilename), filename)

    return { success: true }
  }
}
