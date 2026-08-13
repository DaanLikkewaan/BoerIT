/**
 * postcss.config.mjs
 *
 * Tailwind v3 processes CSS through PostCSS. This config runs the Tailwind
 * plugin (which expands the @tailwind directives in globals.css) followed by
 * autoprefixer (which adds vendor prefixes for browser compatibility).
 */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
