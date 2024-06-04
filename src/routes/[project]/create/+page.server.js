import { createProject } from '$lib/project.js'
import { base } from '$app/paths'
import { redirect } from '@sveltejs/kit'


export async function load ({ params }) {
    return {
        project: params.project,
    }
}

export const actions = {
    create: async ({request}) => {
        const data = await request.formData()
        const projectDir = createProject(data.get('project'), data.get('password'))
        redirect(302, `${base}/${projectDir}/list`)
    }
}