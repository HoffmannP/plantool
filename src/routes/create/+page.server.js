import { projectExists, createProject, checkPassword } from "$lib/project"
import { redirect, error } from '@sveltejs/kit'
import { base } from '$app/paths'

export const actions = {
    create: async ({request}) => {
        const data = await request.formData()
        const project = data.get('project')

        if (projectExists(project)) {
            let projectDir
            try {
                projectDir = checkPassword(project, data.get('password'))
            } catch (exception) {
                console.log(exception)
                error(404, {
                    message: `Project ${project} already exist, please login`
                })
            }
            redirect(302, `${base}/${projectDir}/list`)
        }

        const projectDir = createProject(project, data.get('password'))
        redirect(302, `${base}/${projectDir}/list`)
    }
}
