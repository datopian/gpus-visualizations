export default {
  title: "GPU Performance & Pricing Data Portal",
  pages: [
    {name: "GPU Performance", path: "/gpu-performance"},
    {name: "Price vs Performance", path: "/price-performance"},
    {name: "NVIDIA Releases", path: "/nvidia-releases"}
  ],
  head: `
  <link rel="icon" href="observable.png" type="image/png" sizes="32x32">
  <script>
    sessionStorage.setItem("observablehq-sidebar", "false");
  </script>
  <script type="module">
    import { inject } from 'https://esm.sh/@vercel/analytics@1.5.0';
    inject();
  </script>
  `,
  root: "src",

  // Some additional configuration options and their defaults:
  // theme: "default", // try "light", "dark", "slate", etc.
  // header: "", // what to show in the header (HTML)
  // sidebar: true, // whether to show the sidebar
  // toc: true, // whether to show the table of contents
  // pager: true, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  // search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  // typographer: false, // smart quotes and other typographic improvements
  // preserveExtension: false, // drop .html from URLs
  // preserveIndex: false, // drop /index from URLs
  style: "style.css",
  footer: 'Built with <a href="https://www.portaljs.com/" target="_blank" rel="noopener noreferrer">PortalJS</a> and Observable Framework.',
};
