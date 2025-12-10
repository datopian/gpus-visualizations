# PortalJS Data App Starter

Data app template for publishing dashboards and visualizations, powered by [ObservableHQ Framework](https://observablehq.com/framework/).

## Creating dashboards and reports

To create dashboards and reports, you have to run your data app locally. Note that your data app is an [Observable Framework](https://observablehq.com/framework/) app.

To install the required dependencies, run:

```
npm install
```

Then, to start the local preview server, run:

```
npm run dev
```

Then visit <http://localhost:3000> to preview your app.

For more, see <https://observablehq.com/framework/getting-started>.

## Publishing in PortalJS Cloud

Note that your PortalJS Cloud data portal and your data app are different applications.

In order to publish your data app's content to your PortalJS Cloud data portal:

1. Push the content you developed locally to this repo
2. Navigate to your data app deployment, find the content you want to publish and copy the URL
3. In the PortalJS Cloud dashboard, head to the visualizations page and publish a new visualization using the previously copied URL as the external URL

Users will then be able to find the visualization in your data portal and navigate to the visualization in your data app.

## Project structure

A typical Framework project looks like this:

```ini
.
├─ src
│  ├─ components
│  │  └─ timeline.js           # an importable module
│  ├─ data
│  │  ├─ launches.csv.js       # a data loader
│  │  └─ events.json           # a static data file
│  ├─ example-dashboard.md     # a page
│  ├─ example-report.md        # another page
│  └─ index.md                 # the home page
├─ .gitignore
├─ observablehq.config.js      # the app config file
├─ package.json
└─ README.md
```

**`src`** - This is the “source root” — where your source files live. Pages go here. Each page is a Markdown file. Observable Framework uses [file-based routing](https://observablehq.com/framework/project-structure#routing), which means that the name of the file controls where the page is served. You can create as many pages as you like. Use folders to organize your pages.

**`src/index.md`** - This is the home page for your app. You can have as many additional pages as you’d like, but you should always have a home page, too.

**`src/data`** - You can put [data loaders](https://observablehq.com/framework/data-loaders) or static data files anywhere in your source root, but we recommend putting them here.

**`src/components`** - You can put shared [JavaScript modules](https://observablehq.com/framework/imports) anywhere in your source root, but we recommend putting them here. This helps you pull code out of Markdown files and into JavaScript modules, making it easier to reuse code across pages, write tests and run linters, and even share code with vanilla web applications.

**`observablehq.config.js`** - This is the [app configuration](https://observablehq.com/framework/config) file, such as the pages and sections in the sidebar navigation, and the app’s title.

## Command reference

| Command         | Description                                 |
| --------------- | ------------------------------------------- |
| `npm install`   | Install or reinstall dependencies           |
| `npm run dev`   | Start local preview server                  |
| `npm run build` | Build your static site, generating `./dist` |
| `npm run clean` | Clear the local data loader cache           |
