import { projectEntries, projectExists, checkPassword } from '$lib/project.js'
import { redirect, error } from '@sveltejs/kit'
import { base } from '$app/paths'

export const actions = {
    login: async ({request}) => {
        const data = await request.formData()
        const project = data.get('project')
        if (!projectExists(project)) {
            error(404, {
                message: `Project ${project} was not found`,
                type: 'project not found',
                project: project
            })
        }

        let projectDir
        try {
            projectDir = checkPassword(project, data.get('password'))
        } catch (exception) {
            console.error(exception)
            error(401, 'Password incorrect')
        }
        redirect(302, `${base}/${projectDir}/list`)
    }
}
