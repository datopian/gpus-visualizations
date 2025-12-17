---
toc: false
---

```js
const releases = FileAttachment("data/nvidia_releases.csv").csv({typed: true});
const benchmarks = FileAttachment("data/gpu_benchmarks.csv").csv({typed: true});
```

```js
const releaseData = (await releases)
  .map(d => ({
    year: +d.release_year,
    count: +d.release
  }))
  .sort((a, b) => a.year - b.year);

const nvidiaPerf = (await benchmarks)
  .filter(d => d.brand === "NVIDIA" && d.testDate && d.G3Dmark)
  .map(d => ({
    gpuName: d.gpuName,
    year: +d.testDate,
    g3dmark: +d.G3Dmark,
    price: +d.price || 0,
    category: d.category || "Unknown"
  }))
  .filter(d => d.year >= 2012 && d.year <= 2024);

const perfByYear = d3.rollups(
  nvidiaPerf,
  v => ({
    avgScore: d3.mean(v, d => d.g3dmark),
    maxScore: d3.max(v, d => d.g3dmark),
    count: v.length,
    topGpu: v.sort((a, b) => b.g3dmark - a.g3dmark)[0]?.gpuName
  }),
  d => d.year
).map(([year, stats]) => ({year, ...stats})).sort((a, b) => a.year - b.year);

const cumulativeData = releaseData.map((d, i, arr) => ({
  year: d.year,
  count: d.count,
  cumulative: arr.slice(0, i + 1).reduce((sum, x) => sum + x.count, 0)
}));

const totalReleases = releaseData.reduce((sum, d) => sum + d.count, 0);
const peakYear = releaseData.reduce((max, d) => d.count > max.count ? d : max, {count: 0});
const years = releaseData.map(d => d.year);
const minYear = d3.min(years);
const maxYear = d3.max(years);
const avgPerYear = (totalReleases / releaseData.length).toFixed(1);

const topNvidiaGpus = nvidiaPerf.sort((a, b) => b.g3dmark - a.g3dmark).slice(0, 10);

const performanceGrowth = perfByYear.slice(1).map((d, i) => ({
  year: d.year,
  growth: ((d.avgScore - perfByYear[i].avgScore) / perfByYear[i].avgScore * 100),
  avgScore: d.avgScore
}));
```

<div class="hero">
  <h1>NVIDIA Historical Releases</h1>
  <p>GPU release history and performance evolution from ${minYear} to ${maxYear}</p>
</div>

```js
display(html`<div class="dashboard-layout">
  <div class="sidebar">
    <div class="stat-card">
      <div class="stat-label">Total Releases</div>
      <div class="stat-value nvidia">${totalReleases}</div>
      <div class="stat-change">${minYear}-${maxYear}</div>
    </div>

    <div class="stat-card">
      <div class="stat-label">Peak Year</div>
      <div class="stat-value">${peakYear.year}</div>
      <div class="stat-change">${peakYear.count} GPUs released</div>
    </div>

    <div class="stat-card">
      <div class="stat-label">Avg Per Year</div>
      <div class="stat-value">${avgPerYear}</div>
      <div class="stat-change">GPUs per year</div>
    </div>

    <div class="insights">
      <h4>Key Insights</h4>
      <ul>
        <li>2013 saw most releases (25 GPUs)</li>
        <li>Release frequency declined after 2016</li>
        <li>Focus shifted to fewer, powerful cards</li>
        <li>RTX series launched in 2018</li>
      </ul>
    </div>

    <div class="data-sources">
      <strong>Sources:</strong> <a href="https://www.nvidia.com/" target="_blank">NVIDIA</a>, <a href="https://www.techpowerup.com/gpu-specs/" target="_blank">TechPowerUp</a>
    </div>
  </div>

  <div class="main-content">
    <div class="chart-container chart-large">
      <h3>GPU Releases by Year</h3>
      ${resize((width) => {
        const isMobile = width < 640;
        return Plot.plot({
          width,
          height: isMobile ? 280 : 320,
          marginLeft: isMobile ? 45 : 50,
          marginRight: isMobile ? 20 : 30,
          marginBottom: isMobile ? 50 : 45,
          x: { label: "Year", tickFormat: d => d.toString(), ticks: isMobile ? 6 : 11 },
          y: { label: "Number of Releases", grid: true },
          marks: [
            Plot.barY(releaseData, {
              x: "year", y: "count", fill: "#76b900", rx: 4
            }),
            Plot.text(releaseData, {
              x: "year", y: "count",
              text: d => d.count,
              dy: -8, fontSize: 11, fontWeight: "600", fill: "#76b900"
            }),
            Plot.ruleY([0])
          ]
        });
      })}
    </div>

    <div class="chart-container chart-large">
      <h3>Cumulative GPU Releases Over Time</h3>
      ${resize((width) => {
        const isMobile = width < 640;
        return Plot.plot({
          width,
          height: isMobile ? 260 : 300,
          marginLeft: isMobile ? 50 : 55,
          marginRight: isMobile ? 20 : 30,
          marginBottom: isMobile ? 50 : 45,
          x: { label: "Year", tickFormat: d => d.toString(), ticks: isMobile ? 6 : 11 },
          y: { label: "Total GPUs Released", grid: true },
          marks: [
            Plot.areaY(cumulativeData, {
              x: "year", y: "cumulative", fill: "#76b900", fillOpacity: 0.3, curve: "monotone-x"
            }),
            Plot.line(cumulativeData, {
              x: "year", y: "cumulative", stroke: "#76b900", strokeWidth: 3, curve: "monotone-x"
            }),
            Plot.dot(cumulativeData, {
              x: "year", y: "cumulative", fill: "#76b900", r: 5, stroke: "white", strokeWidth: 2,
              tip: true, title: d => d.year + ": " + d.cumulative + " total\nThis year: " + d.count
            }),
            Plot.ruleY([0])
          ]
        });
      })}
    </div>

    <div class="chart-container chart-large">
      <h3>Average GPU Performance by Year (G3Dmark)</h3>
      ${resize((width) => {
        const isMobile = width < 640;
        return Plot.plot({
          width,
          height: isMobile ? 280 : 320,
          marginLeft: isMobile ? 60 : 70,
          marginRight: isMobile ? 20 : 30,
          marginBottom: isMobile ? 50 : 45,
          x: { label: "Year", tickFormat: d => d.toString(), ticks: isMobile ? 5 : 8 },
          y: { label: "Avg G3Dmark Score", grid: true },
          marks: [
            Plot.areaY(perfByYear, {
              x: "year", y: "avgScore", fill: "#76b900", fillOpacity: 0.2, curve: "monotone-x"
            }),
            Plot.line(perfByYear, {
              x: "year", y: "avgScore", stroke: "#76b900", strokeWidth: 3, curve: "monotone-x"
            }),
            Plot.dot(perfByYear, {
              x: "year", y: "avgScore", fill: "#76b900", r: 6, stroke: "white", strokeWidth: 2,
              tip: true, title: d => d.year + "\nAvg Score: " + Math.round(d.avgScore).toLocaleString() + "\nTop GPU: " + d.topGpu
            }),
            Plot.ruleY([0])
          ]
        });
      })}
    </div>

    <div class="chart-container chart-large">
      <h3>Year-over-Year Performance Growth</h3>
      ${resize((width) => {
        const isMobile = width < 640;
        return Plot.plot({
          width,
          height: isMobile ? 220 : 260,
          marginLeft: isMobile ? 50 : 60,
          marginRight: isMobile ? 20 : 30,
          marginBottom: isMobile ? 50 : 45,
          x: { label: "Year", tickFormat: d => d.toString(), ticks: isMobile ? 5 : 8 },
          y: { label: "Growth (%)", grid: true },
          marks: [
            Plot.ruleY([0], { stroke: "#94a3b8", strokeDasharray: "4,4" }),
            Plot.barY(performanceGrowth, {
              x: "year", y: "growth",
              fill: d => d.growth >= 0 ? "#22c55e" : "#ef4444",
              rx: 4
            }),
            Plot.text(performanceGrowth.filter(d => Math.abs(d.growth) > 5), {
              x: "year", y: "growth",
              text: d => d.growth.toFixed(0) + "%",
              dy: d => d.growth >= 0 ? -8 : 12,
              fontSize: 10, fill: "#666"
            })
          ]
        });
      })}
      <div style="display: flex; gap: 1.5rem; justify-content: center; margin-top: 0.5rem; font-size: 11px;">
        <span><span style="display: inline-block; width: 12px; height: 12px; background: #22c55e; border-radius: 2px; margin-right: 4px;"></span>Growth</span>
        <span><span style="display: inline-block; width: 12px; height: 12px; background: #ef4444; border-radius: 2px; margin-right: 4px;"></span>Decline</span>
      </div>
    </div>

    <div class="chart-container chart-large">
      <h3>Top 10 NVIDIA GPUs by Performance</h3>
      ${resize((width) => {
        const isMobile = width < 640;
        return Plot.plot({
          width,
          height: isMobile ? 340 : 380,
          marginLeft: isMobile ? 150 : 180,
          marginRight: 80,
          x: { label: "G3Dmark Score", grid: true },
          y: { label: null },
          marks: [
            Plot.barX(topNvidiaGpus, {
              x: "g3dmark", y: "gpuName", fill: "#76b900", sort: {y: "-x"}, rx: 4
            }),
            Plot.text(topNvidiaGpus, {
              x: "g3dmark", y: "gpuName",
              text: d => d.g3dmark.toLocaleString() + " (" + d.year + ")",
              dx: 5, textAnchor: "start", fontSize: 10, fill: "#666"
            }),
            Plot.ruleX([0])
          ]
        });
      })}
    </div>

    <div class="chart-grid">
      <div class="chart-container">
        <h3>Release Rankings (Most to Least)</h3>
        ${resize((width) => {
          const isMobile = width < 640;
          const sorted = [...releaseData].sort((a, b) => b.count - a.count).map(d => ({...d, yearStr: d.year.toString()}));
          return Plot.plot({
            width,
            height: isMobile ? 340 : 380,
            marginLeft: isMobile ? 50 : 60,
            marginRight: 50,
            x: { label: "GPUs Released", grid: true },
            y: { label: null, domain: sorted.map(d => d.yearStr) },
            marks: [
              Plot.barX(sorted, {
                x: "count", y: "yearStr", fill: "#76b900", rx: 4
              }),
              Plot.text(sorted, {
                x: "count", y: "yearStr",
                text: d => d.count,
                dx: 5, textAnchor: "start", fontSize: 10, fill: "#666"
              }),
              Plot.ruleX([0])
            ]
          });
        })}
      </div>

      <div class="chart-container">
        <h3>Performance Milestones</h3>
        ${resize((width) => {
          const isMobile = width < 640;
          const milestones = perfByYear.filter(d => d.avgScore > 5000).sort((a, b) => b.avgScore - a.avgScore).map(d => ({...d, yearStr: d.year.toString()}));
          return Plot.plot({
            width,
            height: isMobile ? 340 : 380,
            marginLeft: isMobile ? 50 : 60,
            marginRight: 70,
            x: { label: "Avg G3Dmark Score", grid: true },
            y: { label: null, domain: milestones.map(d => d.yearStr) },
            marks: [
              Plot.barX(milestones, {
                x: "avgScore", y: "yearStr", fill: "#76b900", rx: 4
              }),
              Plot.text(milestones, {
                x: "avgScore", y: "yearStr",
                text: d => Math.round(d.avgScore).toLocaleString(),
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
