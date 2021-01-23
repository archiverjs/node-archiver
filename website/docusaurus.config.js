module.exports = {
  title: 'Archiver',
  tagline: '',
  url: 'https://test.archiverjs.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'archiverjs', // Usually your GitHub org/user name.
  projectName: 'node-archiver', // Usually your repo name.
  themeConfig: {
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
          // Please change this to your repo.
          editUrl:
            'https://github.com/archiverjs/node-archiver/edit/master/website/',
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            'https://github.com/archiverjs/node-archiver/edit/master/website/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],
};
