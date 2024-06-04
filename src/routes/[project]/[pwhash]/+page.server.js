import { access, mkdir, readFile, symlink, unlink, writeFile } from 'node:fs/promises'
import { basename } from 'path'
import { textToDto, todoDtoToText } from '@ochuzor/todo.txt-parser'
import { generateItemId, nowDate } from './todo.helper.js'
import { base } from '$app/paths';


const DIRECTORY = 'todos'

export async function load ({ params }) {
  return {
    todos: await loadTodos(clearPath(params.file)),
  }
}

export const actions = {
  default: async ({ request, params }) => save(clearPath(params.file), await request.json),
}

function clearPath(file) {
  return ('/' + file).replace(base + '/', '')
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

async function loadTodos (project) {
  let todotxt
  try {
    const filename = `${DIRECTORY}/${project}/todo.txt`
    todotxt = await readFile(filename, { encoding: 'UTF8' })
  } catch {
    console.log(`Project ${project} does not exist returning dummy`)
    todotxt = `${nowDate()} Erste Aufgabe anlegen`
  }
  return todotxt.split('\n').filter(line => line.length > 0).reduce(textToDtoWD, {})
}

async function save (project, todos) {
  const todotxt = Object.entries(todos).map(([id, i]) => todoDtoToTextWD({ id, ...i })).join('\n') + '\n'
  let todotxtold

  const newFilename = `${DIRECTORY}/${project}/todo-${Date.now()}.txt`
  const filename = `${DIRECTORY}/${project}/todo.txt`
  try {
    await access(`${DIRECTORY}/${project}`)
  } catch {
    console.log(`Can not find ${project} creating project ${DIRECTORY}/${project}`)
    await mkdir(`${DIRECTORY}/${project}`, { recursive: true })
  }

  try {
    todotxtold = await readFile(filename, { encoding: 'UTF8' })
    if (todotxt === todotxtold) {
      return { success: true, notice: 'no change' }
    }
  } catch {
    ;
  }

  await writeFile(newFilename, todotxt, { encoding: 'UTF8' })
  try {
    await unlink(filename)
  } catch {}
  await symlink(basename(newFilename), filename)

  return { success: true }
}
