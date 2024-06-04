import { projectEntries } from '$lib/project.js'
import { redirect } from '@sveltejs/kit'

export async function load ({ params }) {
    const projectDir = `${params.project}/${params.pwhash}`
    const entries = projectEntries(projectDir)

    return {
        projects: entries
    }
}

export const actions = {
    create: async ({request}) => {
        const data = await request.formData()
        redirect(302, data.get('name'))
    }
}