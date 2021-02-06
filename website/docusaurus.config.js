module.exports = {
  title: 'Archiver',
  tagline: 'A streaming interface for archive generation.',
  url: 'https://www.archiverjs.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'archiverjs',
  projectName: 'node-archiver',
  themeConfig: {
    gtag: {
      trackingID: 'UA-75847652-4',
      anonymizeIP: true,
    },
    navbar: {
      title: 'Archiver',
      logo: {
        alt: 'Archiver Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: 'docs/quickstart',
          label: 'Docs',
          position: 'left',
        },
        {
          to: "docs/archiver",
          label: "API",
          position: "left",
        },
        {
          href: 'https://github.com/archiverjs/node-archiver/',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Get Started',
              to: 'docs/quickstart',
            },
            {
              label: 'Archive Formats',
              to: 'docs/archive-formats',
            },
            {
              label: 'API Reference',
              to: 'docs/archiver',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'ZipStream',
              to: 'zipstream',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/archiverjs/',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()}. Built with Docusaurus.`,
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/archiverjs/node-archiver/edit/master/website/',
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/archiverjs/node-archiver/edit/master/website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
