import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { createHash as cryptoCreateHash } from 'node:crypto'

const DIRECTORY = 'todos'
const RAND = '77s3ZH0XGOfHSlBP2H33HpQCsTOpXR'

function createHash (project, password) {
  const hasher = cryptoCreateHash('sha256')
  hasher.update(project)
  hasher.update(':')
  hasher.update(RAND)
  hasher.update(':')
  hasher.update(password)
  return hasher.digest('hex')
}

function projectPasswordDir (project, password) {
  const projectHash = createHash(project, password)
  return `${project}/${projectHash}`
}

export function createProject (project, password) {
  const projectDir = projectPasswordDir(project, password)
  mkdirSync(`${DIRECTORY}/${projectDir}`, { recursive: true })
  return projectDir
}

export function projectExists (project) {
  return existsSync(`${DIRECTORY}/${project}`)
}

export function checkPassword (project, password) {
  const projectDir = projectPasswordDir(project, password)
  if (!existsSync(`${DIRECTORY}/${projectDir}`)) {
    throw new Error('Password incorrect')
  }
  return projectDir
}

export function projectEntries (projectDir) {
  return readdirSync(`${DIRECTORY}/${projectDir}`)
}
