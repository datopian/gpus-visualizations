---
toc: false
---

```js
const apiScores = FileAttachment("data/gpu_api_scores.csv").csv({typed: true});
const benchmarks = FileAttachment("data/gpu_benchmarks.csv").csv({typed: true});
```

```js
const processedApi = (await apiScores)
  .filter(d => d.Manufacturer === "Nvidia" || d.Manufacturer === "AMD")
  .map(d => ({
    manufacturer: d.Manufacturer === "Nvidia" ? "NVIDIA" : d.Manufacturer,
    device: d.Device,
    cuda: +d.CUDA || 0,
    opencl: +d.OpenCL || 0,
    vulkan: +d.Vulkan || 0
  }))
  .filter(d => d.opencl > 0 || d.vulkan > 0);

const topOpenCL = [...processedApi].filter(d => d.opencl > 0).sort((a, b) => b.opencl - a.opencl).slice(0, 10);
const topVulkan = [...processedApi].filter(d => d.vulkan > 0).sort((a, b) => b.vulkan - a.vulkan).slice(0, 10);

const benchmarkData = (await benchmarks)
  .filter(d => d.G3Dmark && d.brand && d.brand !== "Other")
  .map(d => ({
    gpuName: d.gpuName,
    g3dmark: +d.G3Dmark,
    brand: d.brand,
    category: d.category || "Unknown",
    tdp: +d.TDP || 0,
    price: +d.price || 0,
    year: +d.testDate || 0
  }));

const topG3D = [...benchmarkData].sort((a, b) => b.g3dmark - a.g3dmark).slice(0, 15);
const topNvidia = benchmarkData.filter(d => d.brand === "NVIDIA").sort((a, b) => b.g3dmark - a.g3dmark).slice(0, 8);
const topAmd = benchmarkData.filter(d => d.brand === "AMD").sort((a, b) => b.g3dmark - a.g3dmark).slice(0, 8);

const brandStats = d3.rollups(
  benchmarkData,
  v => ({ count: v.length, avgScore: d3.mean(v, d => d.g3dmark), maxScore: d3.max(v, d => d.g3dmark) }),
  d => d.brand
).map(([brand, stats]) => ({brand, ...stats})).sort((a, b) => b.avgScore - a.avgScore);

const categoryStats = d3.rollups(
  benchmarkData.filter(d => d.category !== "Unknown"),
  v => ({ count: v.length, avgScore: d3.mean(v, d => d.g3dmark) }),
  d => d.category
).map(([category, stats]) => ({category, ...stats})).sort((a, b) => b.avgScore - a.avgScore);

const topOpenCLScore = topOpenCL[0];
const topVulkanScore = topVulkan[0];
const totalGpus = benchmarkData.length;
const colorMap = { "NVIDIA": "#76b900", "AMD": "#ed1c24", "Intel": "#0071c5" };
```

<div class="hero">
  <h1>GPU Performance Comparison</h1>
  <p>Benchmark scores across NVIDIA and AMD GPUs using G3Dmark, OpenCL, and Vulkan APIs</p>
</div>

```js
display(html`<div class="dashboard-layout">
  <div class="sidebar">
    <div class="stat-card">
      <div class="stat-label">Top OpenCL</div>
      <div class="stat-value" style="color: #3b82f6; font-size: 1rem;">${topOpenCLScore?.device.substring(0, 20)}</div>
      <div class="stat-change">${topOpenCLScore?.opencl.toLocaleString()}</div>
    </div>

    <div class="stat-card">
      <div class="stat-label">Top Vulkan</div>
      <div class="stat-value" style="color: #8b5cf6; font-size: 1rem;">${topVulkanScore?.device.substring(0, 20)}</div>
      <div class="stat-change">${topVulkanScore?.vulkan.toLocaleString()}</div>
    </div>

    <div class="stat-card">
      <div class="stat-label">GPUs Analyzed</div>
      <div class="stat-value">${totalGpus}</div>
      <div class="stat-change">NVIDIA & AMD</div>
    </div>

    <div class="insights">
      <h4>Key Insights</h4>
      <ul>
        <li>RTX 3090 Ti leads overall performance</li>
        <li>NVIDIA dominates high-end segment</li>
        <li>AMD competitive in mid-range value</li>
        <li>Workstation GPUs optimized for compute</li>
      </ul>
    </div>

    <div class="data-sources">
      <strong>Sources:</strong> <a href="https://www.techpowerup.com/gpu-specs/" target="_blank">TechPowerUp</a>, <a href="https://www.passmark.com/" target="_blank">PassMark</a>
    </div>
  </div>

  <div class="main-content">
    <div class="chart-container chart-large">
      <h3>Top 15 GPUs by G3Dmark Score</h3>
      ${resize((width) => {
        const isMobile = width < 640;
        const height = isMobile ? 380 : 400;
        const padding = isMobile ? 1 : 2;
        const minW = isMobile ? 40 : 60;
        const minH = isMobile ? 25 : 35;
        const container = d3.create("div").style("position", "relative");
        const svg = container.append("svg").attr("width", width).attr("height", height);

        const root = d3.treemap()
          .size([width, height])
          .padding(padding)
          .round(true)
          (d3.hierarchy({children: topG3D}).sum(d => d.g3dmark));

        const leaves = svg.selectAll("g")
          .data(root.leaves())
          .join("g")
          .attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")");

        leaves.append("rect")
          .attr("width", d => d.x1 - d.x0)
          .attr("height", d => d.y1 - d.y0)
          .attr("fill", d => colorMap[d.data.brand] || "#888")
          .attr("rx", isMobile ? 3 : 4)
          .attr("opacity", 0.85);

        leaves.append("clipPath")
          .attr("id", (d, i) => "clip-top-" + i)
          .append("rect")
          .attr("width", d => d.x1 - d.x0)
          .attr("height", d => d.y1 - d.y0);

        leaves.append("text")
          .attr("clip-path", (d, i) => "url(#clip-top-" + i + ")")
          .attr("x", isMobile ? 4 : 6)
          .attr("y", isMobile ? 14 : 18)
          .attr("font-size", d => {
            const w = d.x1 - d.x0;
            const h = d.y1 - d.y0;
            if (w < minW || h < minH) return 0;
            return isMobile ? Math.min(10, w / 8) : Math.min(12, w / 10);
          })
          .attr("fill", "white")
          .attr("font-weight", "600")
          .style("text-shadow", "0 1px 3px rgba(0,0,0,0.6)")
          .text(d => {
            const w = d.x1 - d.x0;
            const maxChars = isMobile ? Math.floor(w / 6) : 20;
            return d.data.gpuName.length > maxChars ? d.data.gpuName.substring(0, maxChars - 2) + ".." : d.data.gpuName;
          });

        leaves.append("text")
          .attr("clip-path", (d, i) => "url(#clip-top-" + i + ")")
          .attr("x", isMobile ? 4 : 6)
          .attr("y", isMobile ? 26 : 34)
          .attr("font-size", d => {
            const w = d.x1 - d.x0;
            const h = d.y1 - d.y0;
            if (w < minW || h < (isMobile ? 35 : 50)) return 0;
            return isMobile ? 8 : 10;
          })
          .attr("fill", "rgba(255,255,255,0.9)")
          .style("text-shadow", "0 1px 3px rgba(0,0,0,0.6)")
          .text(d => d.data.g3dmark.toLocaleString());

        leaves.append("title")
          .text(d => d.data.gpuName + "\nG3Dmark: " + d.data.g3dmark.toLocaleString() + "\nBrand: " + d.data.brand);

        return container.node();
      })}
      <div style="display: flex; gap: 1.5rem; justify-content: center; margin-top: 0.5rem; font-size: 11px;">
        <span><span style="display: inline-block; width: 12px; height: 12px; background: #76b900; border-radius: 2px; margin-right: 4px;"></span>NVIDIA</span>
        <span><span style="display: inline-block; width: 12px; height: 12px; background: #ed1c24; border-radius: 2px; margin-right: 4px;"></span>AMD</span>
      </div>
    </div>

    <div class="chart-grid">
      <div class="chart-container">
        <h3>Top NVIDIA GPUs</h3>
        ${resize((width) => {
          const isMobile = width < 640;
          const height = isMobile ? 300 : 320;
          const padding = isMobile ? 1 : 2;
          const minW = isMobile ? 35 : 50;
          const minH = isMobile ? 22 : 30;
          const container = d3.create("div").style("position", "relative");
          const svg = container.append("svg").attr("width", width).attr("height", height);

          const root = d3.treemap()
            .size([width, height])
            .padding(padding)
            .round(true)
            (d3.hierarchy({children: topNvidia}).sum(d => d.g3dmark));

          const leaves = svg.selectAll("g")
            .data(root.leaves())
            .join("g")
            .attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")");

          leaves.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", "#76b900")
            .attr("rx", isMobile ? 3 : 4)
            .attr("opacity", (d, i) => 1 - i * 0.08);

          leaves.append("clipPath")
            .attr("id", (d, i) => "clip-nv-" + i)
            .append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0);

          leaves.append("text")
            .attr("clip-path", (d, i) => "url(#clip-nv-" + i + ")")
            .attr("x", isMobile ? 3 : 5)
            .attr("y", isMobile ? 13 : 16)
            .attr("font-size", d => {
              const w = d.x1 - d.x0;
              const h = d.y1 - d.y0;
              if (w < minW || h < minH) return 0;
              return isMobile ? Math.min(9, w / 8) : Math.min(11, w / 10);
            })
            .attr("fill", "white")
            .attr("font-weight", "600")
            .style("text-shadow", "0 1px 3px rgba(0,0,0,0.6)")
            .text(d => {
              const w = d.x1 - d.x0;
              const maxChars = isMobile ? Math.floor(w / 5) : 16;
              return d.data.gpuName.substring(0, maxChars);
            });

          leaves.append("text")
            .attr("clip-path", (d, i) => "url(#clip-nv-" + i + ")")
            .attr("x", isMobile ? 3 : 5)
            .attr("y", isMobile ? 24 : 30)
            .attr("font-size", d => {
              const w = d.x1 - d.x0;
              const h = d.y1 - d.y0;
              if (w < minW || h < (isMobile ? 32 : 45)) return 0;
              return isMobile ? 8 : 9;
            })
            .attr("fill", "rgba(255,255,255,0.9)")
            .style("text-shadow", "0 1px 3px rgba(0,0,0,0.6)")
            .text(d => d.data.g3dmark.toLocaleString());

          leaves.append("title")
            .text(d => d.data.gpuName + "\nG3Dmark: " + d.data.g3dmark.toLocaleString());

          return container.node();
        })}
      </div>

      <div class="chart-container">
        <h3>Top AMD GPUs</h3>
        ${resize((width) => {
          const isMobile = width < 640;
          const height = isMobile ? 300 : 320;
          const padding = isMobile ? 1 : 2;
          const minW = isMobile ? 35 : 50;
          const minH = isMobile ? 22 : 30;
          const container = d3.create("div").style("position", "relative");
          const svg = container.append("svg").attr("width", width).attr("height", height);

          const root = d3.treemap()
            .size([width, height])
            .padding(padding)
            .round(true)
            (d3.hierarchy({children: topAmd}).sum(d => d.g3dmark));

          const leaves = svg.selectAll("g")
            .data(root.leaves())
            .join("g")
            .attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")");

          leaves.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", "#ed1c24")
            .attr("rx", isMobile ? 3 : 4)
            .attr("opacity", (d, i) => 1 - i * 0.08);

          leaves.append("clipPath")
            .attr("id", (d, i) => "clip-amd-" + i)
            .append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0);

          leaves.append("text")
            .attr("clip-path", (d, i) => "url(#clip-amd-" + i + ")")
            .attr("x", isMobile ? 3 : 5)
            .attr("y", isMobile ? 13 : 16)
            .attr("font-size", d => {
              const w = d.x1 - d.x0;
              const h = d.y1 - d.y0;
              if (w < minW || h < minH) return 0;
              return isMobile ? Math.min(9, w / 8) : Math.min(11, w / 10);
            })
            .attr("fill", "white")
            .attr("font-weight", "600")
            .style("text-shadow", "0 1px 3px rgba(0,0,0,0.6)")
            .text(d => {
              const w = d.x1 - d.x0;
              const maxChars = isMobile ? Math.floor(w / 5) : 16;
              return d.data.gpuName.substring(0, maxChars);
            });

          leaves.append("text")
            .attr("clip-path", (d, i) => "url(#clip-amd-" + i + ")")
            .attr("x", isMobile ? 3 : 5)
            .attr("y", isMobile ? 24 : 30)
            .attr("font-size", d => {
              const w = d.x1 - d.x0;
              const h = d.y1 - d.y0;
              if (w < minW || h < (isMobile ? 32 : 45)) return 0;
              return isMobile ? 8 : 9;
            })
            .attr("fill", "rgba(255,255,255,0.9)")
            .style("text-shadow", "0 1px 3px rgba(0,0,0,0.6)")
            .text(d => d.data.g3dmark.toLocaleString());

          leaves.append("title")
            .text(d => d.data.gpuName + "\nG3Dmark: " + d.data.g3dmark.toLocaleString());

          return container.node();
        })}
      </div>
    </div>

    <div class="chart-grid">
      <div class="chart-container">
        <h3>Top 10 OpenCL Performance</h3>
        ${resize((width) => {
          const isMobile = width < 640;
          const height = isMobile ? 300 : 320;
          const padding = isMobile ? 1 : 2;
          const minW = isMobile ? 35 : 50;
          const minH = isMobile ? 22 : 30;
          const container = d3.create("div").style("position", "relative");
          const svg = container.append("svg").attr("width", width).attr("height", height);

          const root = d3.treemap()
            .size([width, height])
            .padding(padding)
            .round(true)
            (d3.hierarchy({children: topOpenCL}).sum(d => d.opencl));

          const leaves = svg.selectAll("g")
            .data(root.leaves())
            .join("g")
            .attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")");

          leaves.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => colorMap[d.data.manufacturer] || "#3b82f6")
            .attr("rx", isMobile ? 3 : 4)
            .attr("opacity", 0.85);

          leaves.append("clipPath")
            .attr("id", (d, i) => "clip-ocl-" + i)
            .append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0);

          leaves.append("text")
            .attr("clip-path", (d, i) => "url(#clip-ocl-" + i + ")")
            .attr("x", isMobile ? 3 : 5)
            .attr("y", isMobile ? 13 : 16)
            .attr("font-size", d => {
              const w = d.x1 - d.x0;
              const h = d.y1 - d.y0;
              if (w < minW || h < minH) return 0;
              return isMobile ? Math.min(9, w / 8) : Math.min(10, w / 12);
            })
            .attr("fill", "white")
            .attr("font-weight", "600")
            .style("text-shadow", "0 1px 3px rgba(0,0,0,0.6)")
            .text(d => {
              const w = d.x1 - d.x0;
              const maxChars = isMobile ? Math.floor(w / 5) : 18;
              return d.data.device.substring(0, maxChars);
            });

          leaves.append("text")
            .attr("clip-path", (d, i) => "url(#clip-ocl-" + i + ")")
            .attr("x", isMobile ? 3 : 5)
            .attr("y", isMobile ? 24 : 30)
            .attr("font-size", d => {
              const w = d.x1 - d.x0;
              const h = d.y1 - d.y0;
              if (w < minW || h < (isMobile ? 32 : 45)) return 0;
              return isMobile ? 8 : 9;
            })
            .attr("fill", "rgba(255,255,255,0.9)")
            .style("text-shadow", "0 1px 3px rgba(0,0,0,0.6)")
            .text(d => d.data.opencl.toLocaleString());

          leaves.append("title")
            .text(d => d.data.device + "\nOpenCL: " + d.data.opencl.toLocaleString());

          return container.node();
        })}
      </div>

      <div class="chart-container">
        <h3>Top 10 Vulkan Performance</h3>
        ${resize((width) => {
          const isMobile = width < 640;
          const height = isMobile ? 300 : 320;
          const padding = isMobile ? 1 : 2;
          const minW = isMobile ? 35 : 50;
          const minH = isMobile ? 22 : 30;
          const container = d3.create("div").style("position", "relative");
          const svg = container.append("svg").attr("width", width).attr("height", height);

          const root = d3.treemap()
            .size([width, height])
            .padding(padding)
            .round(true)
            (d3.hierarchy({children: topVulkan}).sum(d => d.vulkan));

          const leaves = svg.selectAll("g")
            .data(root.leaves())
            .join("g")
            .attr("transform", d => "translate(" + d.x0 + "," + d.y0 + ")");

          leaves.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => colorMap[d.data.manufacturer] || "#8b5cf6")
            .attr("rx", isMobile ? 3 : 4)
            .attr("opacity", 0.85);

          leaves.append("clipPath")
            .attr("id", (d, i) => "clip-vk-" + i)
            .append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0);

          leaves.append("text")
            .attr("clip-path", (d, i) => "url(#clip-vk-" + i + ")")
            .attr("x", isMobile ? 3 : 5)
            .attr("y", isMobile ? 13 : 16)
            .attr("font-size", d => {
              const w = d.x1 - d.x0;
              const h = d.y1 - d.y0;
              if (w < minW || h < minH) return 0;
              return isMobile ? Math.min(9, w / 8) : Math.min(10, w / 12);
            })
            .attr("fill", "white")
            .attr("font-weight", "600")
            .style("text-shadow", "0 1px 3px rgba(0,0,0,0.6)")
            .text(d => {
              const w = d.x1 - d.x0;
              const maxChars = isMobile ? Math.floor(w / 5) : 18;
              return d.data.device.substring(0, maxChars);
            });

          leaves.append("text")
            .attr("clip-path", (d, i) => "url(#clip-vk-" + i + ")")
            .attr("x", isMobile ? 3 : 5)
            .attr("y", isMobile ? 24 : 30)
            .attr("font-size", d => {
              const w = d.x1 - d.x0;
              const h = d.y1 - d.y0;
              if (w < minW || h < (isMobile ? 32 : 45)) return 0;
              return isMobile ? 8 : 9;
            })
            .attr("fill", "rgba(255,255,255,0.9)")
            .style("text-shadow", "0 1px 3px rgba(0,0,0,0.6)")
            .text(d => d.data.vulkan.toLocaleString());

          leaves.append("title")
            .text(d => d.data.device + "\nVulkan: " + d.data.vulkan.toLocaleString());

          return container.node();
        })}
      </div>
    </div>

    <div class="chart-grid">
      <div class="chart-container">
        <h3>Average Score by Brand</h3>
        ${resize((width) => {
          const isMobile = width < 640;
          return Plot.plot({
            width,
            height: isMobile ? 200 : 220,
            marginLeft: isMobile ? 60 : 70,
            marginRight: isMobile ? 100 : 120,
            x: { label: "Avg G3Dmark Score", grid: true },
            y: { label: null },
            marks: [
              Plot.barX(brandStats, {
                x: "avgScore", y: "brand", fill: d => colorMap[d.brand] || "#888", sort: {y: "-x"}, rx: 4
              }),
              Plot.text(brandStats, {
                x: "avgScore", y: "brand",
                text: d => Math.round(d.avgScore).toLocaleString() + " (" + d.count + " GPUs)",
                dx: 5, textAnchor: "start", fontSize: 10, fill: "#666"
              }),
              Plot.ruleX([0])
            ]
          });
        })}
      </div>

      <div class="chart-container">
        <h3>Average Score by Category</h3>
        ${resize((width) => {
          const isMobile = width < 640;
          const colors = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#ddd6fe", "#ede9fe"];
          return Plot.plot({
            width,
            height: isMobile ? 240 : 260,
            marginLeft: isMobile ? 120 : 140,
            marginRight: isMobile ? 50 : 60,
            x: { label: "Avg G3Dmark Score", grid: true },
            y: { label: null },
            marks: [
              Plot.barX(categoryStats, {
                x: "avgScore", y: "category", fill: (d, i) => colors[i % colors.length], sort: {y: "-x"}, rx: 4
              }),
              Plot.text(categoryStats, {
                x: "avgScore", y: "category",
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
