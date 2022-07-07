/**
 * @link https://nextjs.org/docs/api-reference/next.config.js/introduction
 * @type {import('next').NextConfig}
 */
import withPWA from 'next-pwa';

const moduleExports =
  process.env.NODE_ENV == 'production'
    ? withPWA({
        pwa: {
          dest: 'public',
        },
      })
    : {};

export default moduleExports;
