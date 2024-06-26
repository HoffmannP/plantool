import adapter from '@sveltejs/adapter-node'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    paths: {
      assets: 'https://b-ranger.de/plantool',
      base: '/plantool'
    }
  },
  onwarn: (warning, handler) => {
    const IGNORE_WARNINGS = [
      'a11y-click-events-have-key-events',
    ]
    if (IGNORE_WARNINGS.includes(warning.code)) {
      return
    }
    handler(warning)
  }
}

export default config
