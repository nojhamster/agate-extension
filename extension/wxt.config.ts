import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: ({ manifestVersion }) => {
    const email = 'yannick.schurter@gmail.com';
    return {
      author: manifestVersion === 2 ? email : { email }
    };
  }
});
