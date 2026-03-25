const createAnalyticsModule = (context) => {
  const { state, elements, fetchJson, updateFaviconBadge, escapeHtml } = context;

  const safe = (value) => (escapeHtml ? escapeHtml(value) : String(value || ""));

  const formatLocalDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getLastDays = (count) => {
    const days = [];
    const now = new Date();
    const useDateLabel = count > 10;
    const labelFormatter = useDateLabel
      ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" })
      : new Intl.DateTimeFormat(undefined, { weekday: "short" });
    for (let i = count - 1; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = formatLocalDateKey(d);
      const label = labelFormatter.format(d);
      days.push({ key, label });
    }
    return days;
  };

  const getISOWeekKey = (value) => {
    const date = new Date(value);
    const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = utcDate.getUTCDay() || 7;
    utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil(((utcDate - yearStart) / 86400000 + 1) / 7);
    return `${utcDate.getUTCFullYear()}-${String(weekNo).padStart(2, "0")}`;
  };

  const getLastWeeks = (count) => {
    const weeks = [];
    const now = new Date();
    for (let i = count - 1; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      const key = getISOWeekKey(d);
      const label = `Wk ${key.split("-")[1]}`;
      weeks.push({ key, label });
    }
    return weeks;
  };

  const getLastMonths = (count) => {
    const months = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    for (let i = count - 1; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const key = `${year}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const labelBase = new Intl.DateTimeFormat(undefined, { month: "short" }).format(d);
      const label = year === currentYear ? labelBase : `${labelBase} ${String(year).slice(-2)}`;
      months.push({ key, label });
    }
    return months;
  };

  const normalizeBucketKey = (value, groupBy) => {
    if (!value) {
      return "";
    }
    if (typeof value === "string") {
      if (groupBy === "week") {
        return value.slice(0, 7);
      }
      if (groupBy === "month") {
        return value.slice(0, 7);
      }
      return value.slice(0, 10);
    }
    if (value instanceof Date) {
      if (groupBy === "week") {
        return getISOWeekKey(value);
      }
      if (groupBy === "month") {
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}`;
      }
      return formatLocalDateKey(value);
    }
    return String(value).slice(0, groupBy === "day" ? 10 : 7);
  };

  const getAnalyticsBuckets = (rangeDays, groupBy) => {
    const range = normalizeAnalyticsRange(rangeDays);
    const group = normalizeAnalyticsGroup(groupBy);
    if (group === "week") {
      return getLastWeeks(Math.max(1, Math.ceil(range / 7)));
    }
    if (group === "month") {
      return getLastMonths(Math.max(1, Math.ceil(range / 30)));
    }
    return getLastDays(range);
  };

  const buildSeries = (rows, buckets, groupBy) => {
    const map = new Map(
      (rows || []).map((row) => [
        normalizeBucketKey(row.bucket || row.day, groupBy),
        Number(row.count || 0)
      ])
    );
    return {
      labels: buckets.map((bucket) => bucket.label),
      values: buckets.map((bucket) => map.get(bucket.key) || 0)
    };
  };

  const formatCount = (value) => {
    const num = Number(value || 0);
    return Number.isFinite(num) ? String(Math.round(num)) : "0";
  };

  const sumValues = (values) => values.reduce((sum, value) => sum + value, 0);

  const normalizeAnalyticsRange = (value) => {
    const num = Number(value || 7);
    const allowed = [7, 30, 90];
    return allowed.includes(num) ? num : 7;
  };

  const normalizeAnalyticsGroup = (value) => {
    const group = String(value || "day").toLowerCase();
    return ["day", "week", "month"].includes(group) ? group : "day";
  };

  const normalizeAnalyticsAgent = (value) => {
    const num = Number(value || 0);
    return Number.isFinite(num) && num > 0 ? num : 0;
  };

  const normalizeAnalyticsSort = (value) => {
    const sort = String(value || "chats").toLowerCase();
    return ["chats", "leads", "name"].includes(sort) ? sort : "chats";
  };

  const initAnalyticsFilters = () => {
    state.analyticsRangeDays = normalizeAnalyticsRange(state.analyticsRangeDays);
    state.analyticsGroupBy = normalizeAnalyticsGroup(state.analyticsGroupBy);
    state.analyticsAgentId = normalizeAnalyticsAgent(state.analyticsAgentId);
    state.analyticsAgentSort = normalizeAnalyticsSort(state.analyticsAgentSort);
    if (elements.analyticsRange) {
      elements.analyticsRange.value = String(state.analyticsRangeDays);
    }
    if (elements.analyticsGroup) {
      elements.analyticsGroup.value = state.analyticsGroupBy;
    }
    if (elements.analyticsSort) {
      elements.analyticsSort.value = state.analyticsAgentSort;
    }
  };

  const getAnalyticsGroupLabel = (groupBy) => {
    if (groupBy === "week") {
      return "Weekly";
    }
    if (groupBy === "month") {
      return "Monthly";
    }
    return "Daily";
  };

  const updateAnalyticsBadges = () => {
    const groupLabel = getAnalyticsGroupLabel(state.analyticsGroupBy);
    if (elements.badgeInteractions) {
      elements.badgeInteractions.textContent = `${groupLabel} - Last ${state.analyticsRangeDays} days`;
    }
    if (elements.badgeAgents) {
      elements.badgeAgents.textContent = `Last ${state.analyticsRangeDays} days`;
    }
  };

  const renderInteractionsSummary = (element, totals) => {
    if (!element) {
      return;
    }
    element.innerHTML = `
      <div class="chart-stat stat-total">
        <span>Total interactions</span>
        <strong>${formatCount(totals.interactions)}</strong>
      </div>
      <div class="chart-stat stat-replied">
        <span>Replied</span>
        <strong>${formatCount(totals.replied)}</strong>
      </div>
      <div class="chart-stat stat-unreplied">
        <span>Not replied</span>
        <strong>${formatCount(totals.notReplied)}</strong>
      </div>
      <div class="chart-stat stat-leads">
        <span>Leads</span>
        <strong>${formatCount(totals.leads)}</strong>
      </div>
    `;
  };

  const renderAgentSummary = (element, agents, sortKey = "chats") => {
    if (!element) {
      return;
    }
    const totals = agents.reduce(
      (acc, agent) => {
        acc.chats += Number(agent.chats || 0);
        acc.leads += Number(agent.leads || 0);
        return acc;
      },
      { chats: 0, leads: 0 }
    );
    const topAgent = agents.reduce(
      (acc, agent) => {
        const metricKey = sortKey === "leads" ? "leads" : "chats";
        const value = Number(agent[metricKey] || 0);
        if (value > acc.value) {
          return { name: agent.name || "Agent", value };
        }
        return acc;
      },
      { name: "n/a", value: 0 }
    );
    element.innerHTML = `
      <div class="chart-stat stat-total">
        <span>Total chats</span>
        <strong>${formatCount(totals.chats)}</strong>
      </div>
      <div class="chart-stat stat-leads">
        <span>Leads captured</span>
        <strong>${formatCount(totals.leads)}</strong>
      </div>
      <div class="chart-stat stat-top">
        <span>Top member</span>
        <strong>${safe(topAgent.name)}</strong>
      </div>
    `;
  };

  const sortAgents = (agents, sortKey) => {
    const list = [...agents];
    if (sortKey === "name") {
      return list.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));
    }
    return list.sort((a, b) => Number(b[sortKey] || 0) - Number(a[sortKey] || 0));
  };

  const prepareCanvas = (canvas) => {
    if (!canvas) {
      return null;
    }
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const fallbackWidth = Number(canvas.getAttribute("width") || 0);
    const fallbackHeight = Number(canvas.getAttribute("height") || 0);
    const width = Math.max(1, Math.round(rect.width || fallbackWidth || 600));
    const height = Math.max(1, Math.round(rect.height || fallbackHeight || 240));
    const nextWidth = Math.round(width * ratio);
    const nextHeight = Math.round(height * ratio);
    // Avoid resetting the backing store on every draw (mousemove hover redraws).
    if (canvas.width !== nextWidth) {
      canvas.width = nextWidth;
    }
    if (canvas.height !== nextHeight) {
      canvas.height = nextHeight;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.imageSmoothingEnabled = true;
    if ("imageSmoothingQuality" in ctx) {
      ctx.imageSmoothingQuality = "high";
    }
    ctx.clearRect(0, 0, width, height);
    return { ctx, width, height };
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const crispLine = (value) => Math.round(value) + 0.5;

  const sanitizeCssColor = (value, fallback = "#38bdf8") => {
    const text = String(value || "").trim();
    if (/^#[0-9a-fA-F]{3,8}$/.test(text)) {
      return text;
    }
    if (/^rgba?\(/.test(text) || /^hsla?\(/.test(text)) {
      return text;
    }
    return fallback;
  };

  const hexToRgb = (hex) => {
    const text = String(hex || "").trim();
    if (!/^#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(text)) {
      return null;
    }
    const raw = text.slice(1);
    const normalized =
      raw.length === 3 ? raw.split("").map((ch) => ch + ch).join("") : raw;
    const int = parseInt(normalized, 16);
    return {
      r: (int >> 16) & 255,
      g: (int >> 8) & 255,
      b: int & 255
    };
  };

  const barFill = (ctx, x, y, w, h, baseColor) => {
    const safeColor = sanitizeCssColor(baseColor, "#38bdf8");
    const rgb = hexToRgb(safeColor);
    if (!rgb || h <= 6) {
      return safeColor;
    }
    const top = {
      r: Math.min(255, Math.round(rgb.r + (255 - rgb.r) * 0.08)),
      g: Math.min(255, Math.round(rgb.g + (255 - rgb.g) * 0.08)),
      b: Math.min(255, Math.round(rgb.b + (255 - rgb.b) * 0.08))
    };
    const bottom = {
      r: Math.max(0, Math.round(rgb.r * 0.72)),
      g: Math.max(0, Math.round(rgb.g * 0.72)),
      b: Math.max(0, Math.round(rgb.b * 0.72))
    };
    const gradient = ctx.createLinearGradient(x, y, x, y + h);
    gradient.addColorStop(0, `rgba(${top.r}, ${top.g}, ${top.b}, 0.95)`);
    gradient.addColorStop(1, `rgba(${bottom.r}, ${bottom.g}, ${bottom.b}, 0.95)`);
    return gradient;
  };

  const drawAxes = (ctx, series, padding, dimensions, options = {}) => {
    const canvasWidth = dimensions && dimensions.width ? dimensions.width : ctx.canvas.width;
    const canvasHeight = dimensions && dimensions.height ? dimensions.height : ctx.canvas.height;
    const width = canvasWidth - padding.left - padding.right;
    const height = canvasHeight - padding.top - padding.bottom;
    const values = series.values || [];
    const labels = series.labels || [];
    const maxValue = Math.max(1, ...values);
    const autoStep = labels.length > 7 ? 2 : 1;
    const labelStep = Math.max(1, options.labelStep || autoStep);
    const labelFormatter = options.labelFormatter || ((label) => label);
    const thirdValue = Math.round(maxValue / 3);
    const twoThirdValue = Math.round((maxValue * 2) / 3);
    const ticks = [0, thirdValue, twoThirdValue, maxValue].filter(
      (value, index, array) => array.indexOf(value) === index
    );
    ctx.strokeStyle = "rgba(148, 163, 184, 0.12)";
    ctx.lineWidth = 1;
    ctx.lineCap = "square";
    ctx.fillStyle = "rgba(148, 163, 184, 0.82)";
    ctx.font = "11px 'Space Grotesk', sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ticks.forEach((tick) => {
      const y = crispLine(padding.top + height - (tick / maxValue) * height);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(padding.left + width, y);
      ctx.stroke();
      ctx.fillText(String(tick), padding.left - 6, y);
    });

    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const labelDivisor = Math.max(1, labels.length - 1);
    labels.forEach((label, index) => {
      if (index % labelStep !== 0 && index !== labels.length - 1) {
        return;
      }
      const x = padding.left + (width * index) / labelDivisor;
      ctx.fillText(labelFormatter(label), x, padding.top + height + 6);
    });

    return { width, height, maxValue };
  };

  const drawLineChart = (canvas, series, color) => {
    const canvasData = prepareCanvas(canvas);
    if (!canvasData) {
      return;
    }
    const { ctx, width, height } = canvasData;
    const padding = { top: 16, right: 18, bottom: 28, left: 34 };
    const { width: chartWidth, height: chartHeight, maxValue } = drawAxes(
      ctx,
      series,
      padding,
      { width, height }
    );
    const values = series.values;
    const hasData = values.some((value) => value > 0);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    values.forEach((value, index) => {
      const x = padding.left + (chartWidth * index) / (values.length - 1 || 1);
      const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    if (hasData) {
      ctx.fillStyle = color;
      values.forEach((value, index) => {
        const x = padding.left + (chartWidth * index) / (values.length - 1 || 1);
        const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
        ctx.beginPath();
        ctx.arc(x, y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
      ctx.font = "10px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      values.forEach((value, index) => {
        if (!value) {
          return;
        }
        const x = padding.left + (chartWidth * index) / (values.length - 1 || 1);
        const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
        ctx.fillText(String(value), x, Math.max(padding.top + 10, y - 6));
      });
    } else {
      ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
      ctx.font = "12px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "No data yet",
        padding.left + chartWidth / 2,
        padding.top + chartHeight / 2
      );
    }
  };

  const drawBarChart = (canvas, series, color) => {
    const canvasData = prepareCanvas(canvas);
    if (!canvasData) {
      return;
    }
    const { ctx, width, height } = canvasData;
    const padding = { top: 16, right: 18, bottom: 28, left: 34 };
    const { width: chartWidth, height: chartHeight, maxValue } = drawAxes(
      ctx,
      series,
      padding,
      { width, height }
    );
    const values = series.values;
    const hasData = values.some((value) => value > 0);
    const barSlot = chartWidth / (values.length || 1);
    const barWidth = barSlot * 0.68;
    if (hasData) {
      values.forEach((value, index) => {
        const x = padding.left + barSlot * index + (barSlot - barWidth) / 2;
        const barHeight = (value / maxValue) * chartHeight;
        const y = padding.top + chartHeight - barHeight;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, barWidth, barHeight);
        if (value) {
          ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
          ctx.font = "10px 'Space Grotesk', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(String(value), x + barWidth / 2, Math.max(padding.top + 10, y - 4));
        }
      });
    } else {
      ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
      ctx.font = "12px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "No data yet",
        padding.left + chartWidth / 2,
        padding.top + chartHeight / 2
      );
    }
  };

  const drawStackedBarChart = (canvas, seriesList, colors, options = {}) => {
    const canvasData = prepareCanvas(canvas);
    if (!canvasData) {
      return null;
    }
    const { ctx, width, height } = canvasData;
    const labels = seriesList.length ? seriesList[0].labels : [];
    const totals = labels.map((_, index) =>
      seriesList.reduce((sum, series) => sum + (series.values[index] || 0), 0)
    );
    const padding = { top: 16, right: 18, bottom: 28, left: 34 };
    const { width: chartWidth, height: chartHeight, maxValue } = drawAxes(
      ctx,
      { labels, values: totals },
      padding,
      { width, height }
    );
    const hasData = totals.some((value) => value > 0);
    if (!hasData) {
      ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
      ctx.font = "12px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "No data yet",
        padding.left + chartWidth / 2,
        padding.top + chartHeight / 2
      );
      return { padding, chartWidth, chartHeight, barSlot: 0, labels };
    }
    const barSlot = chartWidth / (labels.length || 1);
    const barWidth = Math.max(2, Math.round(barSlot * 0.68));
    const hoverIndex = Number.isFinite(options.hoverIndex) ? Math.round(options.hoverIndex) : null;
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < labels.length) {
      const bandX = Math.round(padding.left + barSlot * hoverIndex);
      const bandW = Math.max(1, Math.round(barSlot));
      ctx.fillStyle = "rgba(148, 163, 184, 0.08)";
      ctx.fillRect(bandX, padding.top, bandW, chartHeight);
    }
    labels.forEach((label, index) => {
      let offset = 0;
      const x = Math.round(padding.left + barSlot * index + (barSlot - barWidth) / 2);
      seriesList.forEach((series, seriesIndex) => {
        const value = series.values[index] || 0;
        if (!value) {
          return;
        }
        const barHeight = (value / maxValue) * chartHeight;
        const start = offset;
        const end = offset + barHeight;
        const yTop = Math.round(padding.top + chartHeight - end);
        const yBottom = Math.round(padding.top + chartHeight - start);
        const h = Math.max(0, yBottom - yTop);
        offset = end;
        if (!h) {
          return;
        }
        const baseColor = colors[seriesIndex] || "#38bdf8";
        ctx.fillStyle = barFill(ctx, x, yTop, barWidth, h, baseColor);
        ctx.fillRect(x, yTop, barWidth, h);
        const shine = Math.min(10, h);
        if (shine > 2) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
          ctx.fillRect(x, yTop, barWidth, shine);
        }
        ctx.strokeStyle = "rgba(15, 23, 42, 0.35)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, yTop + 0.5, Math.max(1, barWidth - 1), Math.max(1, h - 1));
      });
      if (totals[index]) {
        ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
        ctx.font = "10px 'Space Grotesk', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        const labelX = padding.left + barSlot * index + barSlot / 2;
        const labelY = Math.round(padding.top + chartHeight - offset - 4);
        ctx.fillText(String(totals[index]), labelX, Math.max(padding.top + 10, labelY));
      }
    });
    return { padding, chartWidth, chartHeight, barSlot, labels };
  };

  const truncateLabel = (label, maxLength) => {
    const text = String(label || "");
    if (text.length <= maxLength) {
      return text;
    }
    return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
  };

  const drawGroupedBarChart = (canvas, labels, seriesList, colors, options = {}) => {
    const canvasData = prepareCanvas(canvas);
    if (!canvasData) {
      return null;
    }
    const { ctx, width: canvasWidth, height: canvasHeight } = canvasData;
    const maxByLabel = labels.map((_, index) =>
      Math.max(...seriesList.map((series) => series.values[index] || 0))
    );
    const padding = { top: 16, right: 18, bottom: 28, left: 34 };
    const labelStep = labels.length > 8 ? 2 : 1;
    const { width: chartWidth, height: chartHeight, maxValue } = drawAxes(
      ctx,
      { labels, values: maxByLabel },
      padding,
      { width: canvasWidth, height: canvasHeight },
      { labelStep, labelFormatter: (label) => truncateLabel(label, 10) }
    );
    const hasData = maxByLabel.some((value) => value > 0);
    if (!hasData) {
      ctx.fillStyle = "rgba(148, 163, 184, 0.6)";
      ctx.font = "12px 'Space Grotesk', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        "No data yet",
        padding.left + chartWidth / 2,
        padding.top + chartHeight / 2
      );
      return { padding, chartWidth, chartHeight, slot: 0, labels };
    }
    const groupCount = seriesList.length;
    const slot = chartWidth / (labels.length || 1);
    const groupWidth = slot * 0.7;
    const barWidth = groupWidth / groupCount;
    const hoverIndex = Number.isFinite(options.hoverIndex) ? Math.round(options.hoverIndex) : null;
    if (hoverIndex !== null && hoverIndex >= 0 && hoverIndex < labels.length) {
      const bandX = Math.round(padding.left + slot * hoverIndex);
      const bandW = Math.max(1, Math.round(slot));
      ctx.fillStyle = "rgba(148, 163, 184, 0.08)";
      ctx.fillRect(bandX, padding.top, bandW, chartHeight);
    }
    labels.forEach((label, index) => {
      const baseX = padding.left + slot * index + (slot - groupWidth) / 2;
      seriesList.forEach((series, seriesIndex) => {
        const value = series.values[index] || 0;
        if (!value) {
          return;
        }
        const barHeight = (value / maxValue) * chartHeight;
        const x = Math.round(baseX + barWidth * seriesIndex);
        const yTop = Math.round(padding.top + chartHeight - barHeight);
        const yBottom = Math.round(padding.top + chartHeight);
        const h = Math.max(0, yBottom - yTop);
        if (!h) {
          return;
        }
        const baseColor = colors[seriesIndex] || "#38bdf8";
        const barW = Math.max(1, Math.round(barWidth));
        ctx.fillStyle = barFill(ctx, x, yTop, barW, h, baseColor);
        ctx.fillRect(x, yTop, barW, h);
        const shine = Math.min(10, h);
        if (shine > 2) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
          ctx.fillRect(x, yTop, barW, shine);
        }
        ctx.strokeStyle = "rgba(15, 23, 42, 0.35)";
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, yTop + 0.5, Math.max(1, barW - 1), Math.max(1, h - 1));
        ctx.fillStyle = "rgba(248, 250, 252, 0.85)";
        ctx.font = "10px 'Space Grotesk', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText(
          String(value),
          x + barWidth / 2,
          Math.max(padding.top + 10, yTop - 4)
        );
      });
    });
    return { padding, chartWidth, chartHeight, slot, labels };
  };

  const getChartPanel = (canvas) => (canvas && canvas.closest ? canvas.closest(".chart-panel") : null);

  const ensureChartTooltip = (canvas) => {
    const panel = getChartPanel(canvas);
    if (!panel) {
      return null;
    }
    let tooltip = panel.querySelector(".chart-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.className = "chart-tooltip";
      tooltip.setAttribute("role", "tooltip");
      panel.appendChild(tooltip);
    }
    return tooltip;
  };

  const hideChartTooltip = (tooltip) => {
    if (!tooltip) {
      return;
    }
    tooltip.classList.remove("is-visible");
  };

  const showChartTooltip = (tooltip, panel, clientX, clientY, title, rows) => {
    if (!tooltip || !panel) {
      return;
    }
    const htmlRows = (rows || [])
      .filter(Boolean)
      .map(
        (row) => `
          <div class="tt-row">
            <span class="tt-key">
              <i class="tt-dot" style="background:${sanitizeCssColor(row.color)}"></i>
              ${safe(row.label)}
            </span>
            <span class="tt-val">${safe(row.value)}</span>
          </div>
        `
      )
      .join("");
    tooltip.innerHTML = `
      <div class="tt-title">${safe(title)}</div>
      ${htmlRows}
    `;
    tooltip.classList.add("is-visible");

    const panelRect = panel.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 12;
    let left = clientX - panelRect.left + 14;
    let top = clientY - panelRect.top + 14;
    left = clamp(left, padding, Math.max(padding, panelRect.width - tooltipRect.width - padding));
    top = clamp(top, padding, Math.max(padding, panelRect.height - tooltipRect.height - padding));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  };

  const charts = {
    interactions: {
      canvas: elements.chartInteractions || null,
      panel: null,
      legend: null,
      tooltip: null,
      names: ["Replied", "Not replied", "Leads"],
      colors: ["#2563eb", "#f97316", "#facc15"],
      seriesList: null,
      visible: [true, true, true],
      hoverIndex: null,
      geometry: null,
      bound: false,
      resizeObserver: null,
      resizeRaf: null
    },
    agents: {
      canvas: elements.chartAgents || null,
      panel: null,
      legend: null,
      tooltip: null,
      names: ["Chats accepted", "Leads captured"],
      colors: ["#38bdf8", "#22c55e"],
      labels: null,
      seriesList: null,
      visible: [true, true],
      hoverIndex: null,
      geometry: null,
      bound: false,
      resizeObserver: null,
      resizeRaf: null
    }
  };

  const ensureChartNodes = (chart) => {
    if (!chart || !chart.canvas) {
      return false;
    }
    if (!chart.panel) {
      chart.panel = getChartPanel(chart.canvas);
    }
    if (chart.panel && !chart.legend) {
      chart.legend = chart.panel.querySelector(".chart-legend");
    }
    if (chart.panel && !chart.tooltip) {
      chart.tooltip = ensureChartTooltip(chart.canvas);
    }
    return Boolean(chart.panel);
  };

  const scheduleChartRender = (chart, renderFn) => {
    if (!chart) {
      return;
    }
    if (chart.resizeRaf) {
      return;
    }
    chart.resizeRaf = window.requestAnimationFrame(() => {
      chart.resizeRaf = null;
      renderFn();
    });
  };

  const updateLegendState = (chart) => {
    if (!chart || !chart.legend) {
      return;
    }
    const spans = Array.from(chart.legend.querySelectorAll("span"));
    spans.forEach((span, index) => {
      span.classList.toggle("is-disabled", !chart.visible[index]);
    });
  };

  const renderInteractionsChart = () => {
    const chart = charts.interactions;
    if (!chart.canvas || !chart.seriesList) {
      return;
    }
    ensureChartNodes(chart);
    const visibleSeries = chart.seriesList.filter((_, index) => chart.visible[index]);
    const visibleColors = chart.colors.filter((_, index) => chart.visible[index]);
    chart.geometry = drawStackedBarChart(chart.canvas, visibleSeries, visibleColors, {
      hoverIndex: chart.hoverIndex
    });
    updateLegendState(chart);
  };

  const renderAgentsChart = () => {
    const chart = charts.agents;
    if (!chart.canvas || !chart.seriesList || !chart.labels) {
      return;
    }
    ensureChartNodes(chart);
    const visibleSeries = chart.seriesList.filter((_, index) => chart.visible[index]);
    const visibleColors = chart.colors.filter((_, index) => chart.visible[index]);
    chart.geometry = drawGroupedBarChart(chart.canvas, chart.labels, visibleSeries, visibleColors, {
      hoverIndex: chart.hoverIndex
    });
    updateLegendState(chart);
  };

  const bindChartInteractivity = () => {
    const interactions = charts.interactions;
    if (interactions.canvas && !interactions.bound) {
      interactions.bound = true;
      ensureChartNodes(interactions);

      if (interactions.legend) {
        interactions.legend.addEventListener("click", (event) => {
          const span = event.target.closest("span");
          if (!span) {
            return;
          }
          const spans = Array.from(interactions.legend.querySelectorAll("span"));
          const index = spans.indexOf(span);
          if (index < 0 || index >= interactions.visible.length) {
            return;
          }
          const next = [...interactions.visible];
          next[index] = !next[index];
          if (next.every((value) => !value)) {
            return;
          }
          interactions.visible = next;
          interactions.hoverIndex = null;
          hideChartTooltip(interactions.tooltip);
          renderInteractionsChart();
        });
      }

      interactions.canvas.addEventListener("mousemove", (event) => {
        if (!interactions.geometry || !interactions.seriesList) {
          return;
        }
        const { padding, chartWidth, chartHeight, barSlot, labels } = interactions.geometry;
        if (!barSlot || !labels.length) {
          hideChartTooltip(interactions.tooltip);
          return;
        }
        const rect = interactions.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const inside =
          x >= padding.left &&
          x <= padding.left + chartWidth &&
          y >= padding.top &&
          y <= padding.top + chartHeight;
        if (!inside) {
          if (interactions.hoverIndex !== null) {
            interactions.hoverIndex = null;
            renderInteractionsChart();
          }
          hideChartTooltip(interactions.tooltip);
          return;
        }
        const index = clamp(Math.floor((x - padding.left) / barSlot), 0, labels.length - 1);
        if (index !== interactions.hoverIndex) {
          interactions.hoverIndex = index;
          renderInteractionsChart();
        }
        const rows = interactions.names
          .map((name, seriesIndex) => {
            if (!interactions.visible[seriesIndex]) {
              return null;
            }
            const series = interactions.seriesList[seriesIndex];
            const value = series && series.values ? series.values[index] || 0 : 0;
            return { label: name, value: String(value), color: interactions.colors[seriesIndex] };
          })
          .filter(Boolean);
        showChartTooltip(
          interactions.tooltip,
          interactions.panel,
          event.clientX,
          event.clientY,
          labels[index] || "Details",
          rows
        );
      });

      interactions.canvas.addEventListener("mouseleave", () => {
        interactions.hoverIndex = null;
        hideChartTooltip(interactions.tooltip);
        renderInteractionsChart();
      });

      if (window.ResizeObserver) {
        interactions.resizeObserver = new ResizeObserver(() =>
          scheduleChartRender(interactions, renderInteractionsChart)
        );
        interactions.resizeObserver.observe(interactions.canvas);
      } else {
        window.addEventListener("resize", () => scheduleChartRender(interactions, renderInteractionsChart));
      }
    }

    const agents = charts.agents;
    if (agents.canvas && !agents.bound) {
      agents.bound = true;
      ensureChartNodes(agents);

      if (agents.legend) {
        agents.legend.addEventListener("click", (event) => {
          const span = event.target.closest("span");
          if (!span) {
            return;
          }
          const spans = Array.from(agents.legend.querySelectorAll("span"));
          const index = spans.indexOf(span);
          if (index < 0 || index >= agents.visible.length) {
            return;
          }
          const next = [...agents.visible];
          next[index] = !next[index];
          if (next.every((value) => !value)) {
            return;
          }
          agents.visible = next;
          agents.hoverIndex = null;
          hideChartTooltip(agents.tooltip);
          renderAgentsChart();
        });
      }

      agents.canvas.addEventListener("mousemove", (event) => {
        if (!agents.geometry || !agents.seriesList || !agents.labels) {
          return;
        }
        const { padding, chartWidth, chartHeight, slot, labels } = agents.geometry;
        if (!slot || !labels.length) {
          hideChartTooltip(agents.tooltip);
          return;
        }
        const rect = agents.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const inside =
          x >= padding.left &&
          x <= padding.left + chartWidth &&
          y >= padding.top &&
          y <= padding.top + chartHeight;
        if (!inside) {
          if (agents.hoverIndex !== null) {
            agents.hoverIndex = null;
            renderAgentsChart();
          }
          hideChartTooltip(agents.tooltip);
          return;
        }
        const index = clamp(Math.floor((x - padding.left) / slot), 0, labels.length - 1);
        if (index !== agents.hoverIndex) {
          agents.hoverIndex = index;
          renderAgentsChart();
        }
        const rows = agents.names
          .map((name, seriesIndex) => {
            if (!agents.visible[seriesIndex]) {
              return null;
            }
            const series = agents.seriesList[seriesIndex];
            const value = series && series.values ? series.values[index] || 0 : 0;
            return { label: name, value: String(value), color: agents.colors[seriesIndex] };
          })
          .filter(Boolean);
        showChartTooltip(
          agents.tooltip,
          agents.panel,
          event.clientX,
          event.clientY,
          labels[index] || "Details",
          rows
        );
      });

      agents.canvas.addEventListener("mouseleave", () => {
        agents.hoverIndex = null;
        hideChartTooltip(agents.tooltip);
        renderAgentsChart();
      });

      if (window.ResizeObserver) {
        agents.resizeObserver = new ResizeObserver(() => scheduleChartRender(agents, renderAgentsChart));
        agents.resizeObserver.observe(agents.canvas);
      } else {
        window.addEventListener("resize", () => scheduleChartRender(agents, renderAgentsChart));
      }
    }
  };

  const buildSeriesFromKey = (rows, key, buckets, groupBy) =>
    buildSeries(
      (rows || []).map((row) => ({ bucket: row.bucket || row.day, count: Number(row[key] || 0) })),
      buckets,
      groupBy
    );

  const loadAnalytics = async () => {
    state.analyticsRangeDays = normalizeAnalyticsRange(state.analyticsRangeDays);
    state.analyticsGroupBy = normalizeAnalyticsGroup(state.analyticsGroupBy);
    state.analyticsAgentId = normalizeAnalyticsAgent(state.analyticsAgentId);
    const params = new URLSearchParams({
      range_days: String(state.analyticsRangeDays),
      group_by: state.analyticsGroupBy
    });
    if (state.analyticsAgentId) {
      params.set("agent_id", String(state.analyticsAgentId));
    }
    const data = await fetchJson(`${API_BASE}/admin/analytics?${params.toString()}`);
    const interactionsRows = data.interactions || [];
    const buckets = getAnalyticsBuckets(state.analyticsRangeDays, state.analyticsGroupBy);
    const repliedSeries = buildSeriesFromKey(interactionsRows, "replied", buckets, state.analyticsGroupBy);
    const notRepliedSeries = buildSeriesFromKey(
      interactionsRows,
      "not_replied",
      buckets,
      state.analyticsGroupBy
    );
    const leadsSeries = buildSeries(data.leads || [], buckets, state.analyticsGroupBy);
    const totals = {
      replied: sumValues(repliedSeries.values),
      notReplied: sumValues(notRepliedSeries.values),
      leads: sumValues(leadsSeries.values)
    };
    totals.interactions = totals.replied + totals.notReplied;
    renderInteractionsSummary(elements.summaryInteractions, totals);
    if (elements.chartInteractions) {
      charts.interactions.seriesList = [repliedSeries, notRepliedSeries, leadsSeries];
      bindChartInteractivity();
      renderInteractionsChart();
    }

    const agents = data.agents || [];
    state.analyticsAgentSort = normalizeAnalyticsSort(state.analyticsAgentSort);
    const sortedAgents = sortAgents(agents, state.analyticsAgentSort);
    renderAgentSummary(elements.summaryAgents, sortedAgents, state.analyticsAgentSort);
    if (elements.chartAgents) {
      const labels = sortedAgents.map((agent) => agent.name || "Agent");
      const chatsSeries = { values: sortedAgents.map((agent) => Number(agent.chats || 0)) };
      const agentLeadsSeries = { values: sortedAgents.map((agent) => Number(agent.leads || 0)) };
      charts.agents.labels = labels;
      charts.agents.seriesList = [chatsSeries, agentLeadsSeries];
      bindChartInteractivity();
      renderAgentsChart();
    }
    updateAnalyticsBadges();
  };

  const loadMetrics = async () => {
    const data = await fetchJson(`${API_BASE}/admin/dashboard`);
    elements.metrics.active.textContent = data.activeChats;
    elements.metrics.unread.textContent = data.unreadMessages;
    elements.metrics.offline.textContent = data.offlineChats;
    elements.metrics.leads.textContent = data.leads;
    state.lastUnread = data.unreadMessages;
    updateFaviconBadge(data.unreadMessages);
  };

  const renderAnalyticsAgentOptions = () => {
    if (!elements.analyticsAgent) {
      return;
    }
    elements.analyticsAgent.innerHTML = "";
    const allOption = document.createElement("option");
    allOption.value = "0";
    allOption.textContent = "All assignees";
    elements.analyticsAgent.appendChild(allOption);
    state.agents.forEach((agent) => {
      const option = document.createElement("option");
      option.value = String(agent.id);
      option.textContent = agent.role ? `${agent.name} (${agent.role})` : agent.name;
      elements.analyticsAgent.appendChild(option);
    });
    const hasAgent = state.agents.some((agent) => Number(agent.id) === state.analyticsAgentId);
    if (!hasAgent) {
      state.analyticsAgentId = 0;
      localStorage.setItem("oc_analytics_agent_id", "0");
    }
    elements.analyticsAgent.value = String(state.analyticsAgentId || 0);
  };

  return {
    formatLocalDateKey,
    getLastDays,
    getISOWeekKey,
    getLastWeeks,
    getLastMonths,
    normalizeBucketKey,
    getAnalyticsBuckets,
    buildSeries,
    formatCount,
    sumValues,
    normalizeAnalyticsRange,
    normalizeAnalyticsGroup,
    normalizeAnalyticsAgent,
    normalizeAnalyticsSort,
    initAnalyticsFilters,
    updateAnalyticsBadges,
    renderInteractionsSummary,
    renderAgentSummary,
    sortAgents,
    prepareCanvas,
    drawAxes,
      drawLineChart,
      drawBarChart,
      drawStackedBarChart,
      truncateLabel,
      drawGroupedBarChart,
      buildSeriesFromKey,
    loadAnalytics,
    loadMetrics,
    renderAnalyticsAgentOptions
  };
};
