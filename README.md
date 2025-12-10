# GPU Performance & Pricing Data Portal

Interactive data visualization portal for exploring GPU benchmarks, performance comparisons, and market analysis. Built with [Observable Framework](https://observablehq.com/framework/) and [PortalJS](https://www.portaljs.com/).

## Dashboards

### GPU Performance Comparison
Compare GPU performance across multiple graphics APIs:
- CUDA, OpenCL, and Vulkan benchmark scores
- G3Dmark performance rankings
- Brand and category comparisons

### Price vs Performance
Find the best value GPUs:
- Top 15 best value GPUs ranked by G3Dmark points per dollar
- Performance and value analysis by price range
- Brand comparison with GPU counts

### NVIDIA Historical Releases
Track NVIDIA's GPU release history from 2012-2022:
- Annual release counts and trends
- Cumulative releases over time
- Performance evolution by year

## Data Sources

- **GPU Benchmarks**: [TechPowerUp GPU Database](https://www.techpowerup.com/gpu-specs/), [PassMark](https://www.passmark.com/)
- **Price Data**: Current market pricing from major retailers
- **Release History**: NVIDIA official product database

## Getting Started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to view the portal.

## Project Structure

```
.
├─ src
│  ├─ data
│  │  ├─ gpu_benchmarks.csv       # G3Dmark scores, prices, TDP
│  │  ├─ gpu_api_scores.csv       # CUDA, OpenCL, Vulkan scores
│  │  └─ nvidia_releases.csv      # Release counts by year
│  ├─ gpu-performance.md          # API performance dashboard
│  ├─ price-performance.md        # Value analysis dashboard
│  ├─ nvidia-releases.md          # Release history dashboard
│  ├─ index.md                    # Home page
│  └─ style.css                   # Dashboard styles
├─ observablehq.config.js         # App configuration
└─ package.json
```

## Commands

| Command         | Description                                 |
| --------------- | ------------------------------------------- |
| `npm install`   | Install or reinstall dependencies           |
| `npm run dev`   | Start local preview server                  |
| `npm run build` | Build your static site, generating `./dist` |
| `npm run clean` | Clear the local data loader cache           |
