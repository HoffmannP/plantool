import adapter from '@sveltejs/adapter-node'

/** @type {import('@sveltejs/kit').Config} */
const config = {
    kit: {
        adapter: adapter()
  },
  /*
  onwarn: (warning, handler) => {
    const IGNORE_WARNINGS = [
      'a11y-click-events-have-key-events',
      'a11y-no-static-element-interactions',
      'a11y-missing-attribute'
    ]
    if (IGNORE_WARNINGS.includes(warning.code)) {
      return
        }
    handler(warning)
    }
    */
}

export default config
