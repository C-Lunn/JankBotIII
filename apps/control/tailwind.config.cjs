/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      fontFamily: {
        "sans": ['Merriweather SansVariable', 'Merriweather Sans', 'sans-serif']
      }
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
  ],
}
