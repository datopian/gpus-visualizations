---
toc: false
---

```js
const benchmarks = FileAttachment("data/gpu_benchmarks.csv").csv({typed: true});
```

```js
const processedData = (await benchmarks)
  .filter(d => d.price && d.G3Dmark && d.price > 0 && d.G3Dmark > 0 && d.brand && d.brand !== "Other")
  .map(d => ({
    gpuName: d.gpuName,
    g3dmark: +d.G3Dmark,
    price: +d.price,
    brand: d.brand,
    category: d.category || "Unknown",
    tdp: +d.TDP || 0,
    valueScore: (+d.G3Dmark / +d.price).toFixed(2)
  }));

const byValue = [...processedData].sort((a, b) => +b.valueScore - +a.valueScore);
const topValue = byValue.slice(0, 10);
const byPerformance = [...processedData].sort((a, b) => b.g3dmark - a.g3dmark).slice(0, 10);

const avgPrice = d3.mean(processedData, d => d.price);
const avgScore = d3.mean(processedData, d => d.g3dmark);
const avgValue = d3.mean(processedData, d => +d.valueScore);
const bestValue = byValue[0];
const worstValue = byValue[byValue.length - 1];
const gpuCount = processedData.length;

const priceRanges = [
  {range: "Under $500", min: 0, max: 500, color: "#22c55e"},
  {range: "$500-$1,000", min: 500, max: 1000, color: "#3b82f6"},
  {range: "$1,000-$2,000", min: 1000, max: 2000, color: "#f59e0b"},
  {range: "Over $2,000", min: 2000, max: Infinity, color: "#ef4444"}
];

const byPriceRange = priceRanges.map(r => {
  const gpus = processedData.filter(d => d.price >= r.min && d.price < r.max);
  return {
    range: r.range,
    color: r.color,
    count: gpus.length,
    avgScore: gpus.length > 0 ? d3.mean(gpus, d => d.g3dmark) : 0,
    avgValue: gpus.length > 0 ? d3.mean(gpus, d => +d.valueScore) : 0,
    avgPrice: gpus.length > 0 ? d3.mean(gpus, d => d.price) : 0
  };
}).filter(d => d.count > 0);

const brandValue = d3.rollups(
  processedData,
  v => ({
    avgValue: d3.mean(v, d => +d.valueScore),
    avgPrice: d3.mean(v, d => d.price),
    avgScore: d3.mean(v, d => d.g3dmark),
    count: v.length
  }),
  d => d.brand
).map(([brand, stats]) => ({brand, ...stats})).sort((a, b) => b.avgValue - a.avgValue);

const bestPerRange = priceRanges.map(r => {
  const gpus = processedData.filter(d => d.price >= r.min && d.price < r.max);
  if (gpus.length === 0) return null;
  const bestByValue = gpus.sort((a, b) => +b.valueScore - +a.valueScore)[0];
  const bestByPerf = gpus.sort((a, b) => b.g3dmark - a.g3dmark)[0];
  return {
    range: r.range,
    color: r.color,
    bestValue: bestByValue,
    bestPerf: bestByPerf,
    minScore: d3.min(gpus, d => d.g3dmark),
    maxScore: d3.max(gpus, d => d.g3dmark),
    avgScore: d3.mean(gpus, d => d.g3dmark),
    count: gpus.length
  };
}).filter(d => d !== null);
```

<div class="hero">
  <h1>Price vs Performance Analysis</h1>
  <p>Find the best value GPUs by comparing G3Dmark scores against retail pricing</p>
</div>

```js
display(html`<div class="dashboard-layout">
  <div class="sidebar">
    <div class="stat-card">
      <div class="stat-label">Best Value GPU</div>
      <div class="stat-value positive" style="font-size: 1rem;">${bestValue?.gpuName.substring(0, 20)}</div>
      <div class="stat-change">${bestValue?.valueScore} pts/$</div>
    </div>

    <div class="stat-card">
      <div class="stat-label">Average Price</div>
      <div class="stat-value">$${Math.round(avgPrice).toLocaleString()}</div>
      <div class="stat-change">${gpuCount} GPUs analyzed</div>
    </div>

    <div class="stat-card">
      <div class="stat-label">Average Value</div>
      <div class="stat-value">${avgValue.toFixed(1)}</div>
      <div class="stat-change">G3D points per dollar</div>
    </div>

    <div class="insights">
      <h4>Key Insights</h4>
      <ul>
        <li>Mid-range GPUs offer best value</li>
        <li>RTX 3060 Ti excels in price/perf</li>
        <li>Workstation cards have premium pricing</li>
        <li>Under $500 provides best pts/$</li>
      </ul>
    </div>

    <div class="data-sources">
      <strong>Sources:</strong> <a href="https://www.techpowerup.com/gpu-specs/" target="_blank">TechPowerUp</a>, Market Pricing
    </div>
  </div>

  <div class="main-content">
    <div class="chart-container chart-large">
      <h3>Performance Range by Price Tier</h3>
      ${resize((width) => {
        const isMobile = width < 640;
        return Plot.plot({
          width,
          height: isMobile ? 240 : 280,
          marginLeft: isMobile ? 95 : 110,
          marginRight: 60,
          marginBottom: 50,
          x: { label: "G3Dmark Score", grid: true },
          y: { label: null },
          marks: [
            Plot.ruleX([0]),
            Plot.barX(bestPerRange, {
              x1: "minScore", x2: "maxScore", y: "range",
              fill: "color", fillOpacity: 0.3, rx: 4
            }),
            Plot.tickX(bestPerRange, {
              x: "avgScore", y: "range",
              stroke: "color", strokeWidth: 3
            }),
            Plot.dot(bestPerRange, {
              x: "maxScore", y: "range", fill: "color", r: 6, stroke: "white", strokeWidth: 2,
              tip: true, title: d => "Best: " + d.bestPerf.gpuName + "\nScore: " + d.maxScore.toLocaleString()
            }),
            Plot.text(bestPerRange, {
              x: "maxScore", y: "range",
              text: d => d.bestPerf.gpuName.substring(0, 18),
              dx: 8, textAnchor: "start", fontSize: 9, fill: "#666"
            })
          ]
        });
      })}
      <div style="display: flex; gap: 1.5rem; justify-content: center; margin-top: 0.5rem; font-size: 11px; color: #666;">
        <span>Bar = Score Range (min to max)</span>
        <span>| = Average</span>
        <span>Dot = Top performer</span>
      </div>
    </div>

    <div class="chart-container chart-large">
      <h3>Top 10 Best Value GPUs</h3>
      ${resize((width) => {
        const isMobile = width < 640;
        const colorMap = { "NVIDIA": "#76b900", "AMD": "#ed1c24" };
        return Plot.plot({
          width,
          height: isMobile ? 340 : 380,
          marginLeft: isMobile ? 140 : 180,
          marginRight: 100,
          x: { label: "Value Score (G3D points per $)", grid: true },
          y: { label: null },
          marks: [
            Plot.barX(topValue, {
              x: d => +d.valueScore, y: "gpuName",
              fill: d => colorMap[d.brand] || "#888",
              sort: {y: "-x"}, rx: 4
            }),
            Plot.text(topValue, {
              x: d => +d.valueScore, y: "gpuName",
              text: d => d.valueScore + " | $" + d.price.toFixed(0),
              dx: 5, textAnchor: "start", fontSize: 10, fill: "#666"
            }),
            Plot.ruleX([0])
          ]
        });
      })}
    </div>

    <div class="chart-container chart-large">
      <h3>Top 10 Highest Performance GPUs</h3>
      ${resize((width) => {
        const isMobile = width < 640;
        const colorMap = { "NVIDIA": "#76b900", "AMD": "#ed1c24" };
        return Plot.plot({
          width,
          height: isMobile ? 340 : 380,
          marginLeft: isMobile ? 140 : 180,
          marginRight: 100,
          x: { label: "G3Dmark Score", grid: true },
          y: { label: null },
          marks: [
            Plot.barX(byPerformance, {
              x: "g3dmark", y: "gpuName",
              fill: d => colorMap[d.brand] || "#888",
              sort: {y: "-x"}, rx: 4
            }),
            Plot.text(byPerformance, {
              x: "g3dmark", y: "gpuName",
              text: d => "$" + d.price.toFixed(0),
              dx: 5, textAnchor: "start", fontSize: 10, fill: "#666"
            }),
            Plot.ruleX([0])
          ]
        });
      })}
    </div>

    <div class="chart-grid">
      <div class="chart-container">
        <h3>Value Score by Price Range</h3>
        ${resize((width) => {
          const isMobile = width < 640;
          return Plot.plot({
            width,
            height: isMobile ? 200 : 220,
            marginLeft: isMobile ? 95 : 110,
            marginRight: 80,
            x: { label: "Avg Value (G3D pts/$)", grid: true },
            y: { label: null },
            marks: [
              Plot.barX(byPriceRange, {
                x: "avgValue", y: "range", fill: "color", sort: {y: "-x"}, rx: 4
              }),
              Plot.text(byPriceRange, {
                x: "avgValue", y: "range",
                text: d => d.avgValue.toFixed(1) + " (" + d.count + " GPUs)",
                dx: 5, textAnchor: "start", fontSize: 10, fill: "#666"
              }),
              Plot.ruleX([0])
            ]
          });
        })}
      </div>

      <div class="chart-container">
        <h3>Average Performance by Price Range</h3>
        ${resize((width) => {
          const isMobile = width < 640;
          return Plot.plot({
            width,
            height: isMobile ? 200 : 220,
            marginLeft: isMobile ? 95 : 110,
            marginRight: 60,
            x: { label: "Avg G3Dmark Score", grid: true },
            y: { label: null },
            marks: [
              Plot.barX(byPriceRange, {
                x: "avgScore", y: "range", fill: "color", sort: {y: "-x"}, rx: 4
              }),
              Plot.text(byPriceRange, {
                x: "avgScore", y: "range",
                text: d => Math.round(d.avgScore).toLocaleString(),
                dx: 5, textAnchor: "start", fontSize: 10, fill: "#666"
              }),
              Plot.ruleX([0])
            ]
          });
        })}
      </div>
    </div>

    <div class="chart-grid">
      <div class="chart-container">
        <h3>Value Score by Brand</h3>
        ${resize((width) => {
          const isMobile = width < 640;
          const colorMap = { "NVIDIA": "#76b900", "AMD": "#ed1c24", "Intel": "#0071c5" };
          return Plot.plot({
            width,
            height: isMobile ? 180 : 200,
            marginLeft: isMobile ? 70 : 80,
            marginRight: 80,
            x: { label: "Avg Value (G3D pts/$)", grid: true },
            y: { label: null },
            marks: [
              Plot.barX(brandValue, {
                x: "avgValue", y: "brand", fill: d => colorMap[d.brand] || "#888", sort: {y: "-x"}, rx: 4
              }),
              Plot.text(brandValue, {
                x: "avgValue", y: "brand",
                text: d => d.avgValue.toFixed(1) + " (" + d.count + " GPUs)",
                dx: 5, textAnchor: "start", fontSize: 10, fill: "#666"
              }),
              Plot.ruleX([0])
            ]
          });
        })}
      </div>

      <div class="chart-container">
        <h3>Average Price by Brand</h3>
        ${resize((width) => {
          const isMobile = width < 640;
          const colorMap = { "NVIDIA": "#76b900", "AMD": "#ed1c24", "Intel": "#0071c5" };
          return Plot.plot({
            width,
            height: isMobile ? 180 : 200,
            marginLeft: isMobile ? 70 : 80,
            marginRight: 80,
            x: { label: "Average Price ($)", grid: true },
            y: { label: null },
            marks: [
              Plot.barX(brandValue, {
                x: "avgPrice", y: "brand", fill: d => colorMap[d.brand] || "#888", sort: {y: "-x"}, rx: 4
              }),
              Plot.text(brandValue, {
                x: "avgPrice", y: "brand",
                text: d => "$" + Math.round(d.avgPrice).toLocaleString(),
                dx: 5, textAnchor: "start", fontSize: 10, fill: "#666"
              }),
              Plot.ruleX([0])
            ]
          });
        })}
      </div>
    </div>
  </div>
</div>`)
```
