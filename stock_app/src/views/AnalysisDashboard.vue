<template>
  <div class="page-container">
    <div class="header-row">
      <h1 class="page-header-title">资产分析</h1>
      <el-select v-model="selectedYear" placeholder="选择年份" style="width: 120px" class="apple-select">
        <el-option label="所有年份" value="all" />
        <el-option v-for="year in availableYears" :key="year" :label="year + '年'" :value="year" />
      </el-select>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="8">
        <el-card shadow="never" class="stat-card apple-card">
          <div class="stat-label">总投入成本 (持仓)</div>
          <div class="stat-value">¥ {{ formatNumber(totalHoldingsCost) }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="stat-card apple-card">
          <div class="stat-label">累计分红 (选定年份)</div>
          <div class="stat-value text-dividend">+¥ {{ formatNumber(totalDividends) }}</div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="stat-card apple-card">
          <div class="stat-label">净收益 (分红+平仓)</div>
          <div class="stat-value" :class="netIncome >= 0 ? 'text-gain' : 'text-loss'">
            {{ netIncome > 0 ? '+' : '' }}¥ {{ formatNumber(netIncome) }}
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12" :xs="24" class="chart-col">
        <el-card shadow="never" class="chart-card apple-card">
          <div ref="incomeChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :span="12" :xs="24" class="chart-col">
        <el-card shadow="never" class="chart-card apple-card">
          <template #header><span class="card-title">当前持仓分布 (按成本)</span></template>
          <div ref="holdingsChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12" :xs="24" class="chart-col">
        <el-card shadow="never" class="chart-card apple-card">
          <template #header><span class="card-title">当前行业配置</span></template>
          <div ref="industryChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <el-col :span="12" :xs="24" class="chart-col">
        <el-card shadow="never" class="chart-card apple-card">
          <template #header><span class="card-title">月度净收益趋势</span></template>
          <div ref="trendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import * as echarts from 'echarts';
import axios from 'axios';
import { ElMessage } from 'element-plus';

const API_URL = 'http://localhost:3000/api/transactions';
const rawTransactions = ref([]);

// DOM Refs
const incomeChartRef = ref(null);
const holdingsChartRef = ref(null);
const industryChartRef = ref(null);
const trendChartRef = ref(null);

let charts = {};

// Filter State
const selectedYear = ref('all');
const availableYears = ref([]);

// Stats
const totalHoldingsCost = ref(0);
const totalDividends = ref(0);
const totalRealizedPL = ref(0);
const netIncome = computed(() => totalDividends.value + totalRealizedPL.value);

// 🎨 颜色常量
const COLORS = {
  DIVIDEND: '#ff9500',   // 金色
  GAIN: '#ff3b30',       // 红色
  LOSS: '#34c759',       // 绿色
  AXIS_TEXT: '#86868b'
};

const BLUE_PALETTE = ['#0071e3', '#5ac8fa', '#147efb', '#5856d6', '#00c7be', '#32ade6', '#005bb7'];

const processData = () => {
  const sortedTx = [...rawTransactions.value].sort((a, b) => 
    new Date(a.transaction_date) - new Date(b.transaction_date)
  );

  const years = new Set();
  sortedTx.forEach(t => years.add(t.transaction_date.split('-')[0]));
  availableYears.value = Array.from(years).sort().reverse();

  const portfolio = {}; 
  let realizedPLItems = []; 
  let dividendItems = [];   
  let holdingsSnapshot = {}; 

  sortedTx.forEach(tx => {
    const volume = parseFloat(tx.volume) || 0;
    const price = parseFloat(tx.price) || 0;
    const fee = parseFloat(tx.fee) || 0;
    const stock = tx.stock_name;
    const date = tx.transaction_date;
    const year = date.split('-')[0];

    if (!portfolio[stock]) portfolio[stock] = { shares: 0, totalCost: 0, industry: tx.industry || '未分类' };
    const state = portfolio[stock];

    const isInSelectedYear = selectedYear.value === 'all' || selectedYear.value === year;

    if (tx.direction === 'Dividend') {
      const dividend = parseFloat(tx.dividend_amount) || 0;
      state.totalCost -= dividend; 
      if (state.totalCost < 0) state.totalCost = 0; 
      if (isInSelectedYear) dividendItems.push({ date, amount: dividend });
    } else if (tx.direction === 'Buy') {
      state.shares += volume;
      state.totalCost += (volume * price + fee);
      if (tx.industry) state.industry = tx.industry;
    } else if (tx.direction === 'Sell') {
      const avgCost = state.shares === 0 ? 0 : state.totalCost / state.shares;
      const costOfSold = avgCost * volume;
      const pl = (volume * price - fee) - costOfSold;
      state.shares -= volume;
      state.totalCost -= costOfSold;
      if (isInSelectedYear) realizedPLItems.push({ date, amount: pl });
    }
  });

  Object.keys(portfolio).forEach(key => {
    if (portfolio[key].shares > 0.001) holdingsSnapshot[key] = portfolio[key];
  });

  totalDividends.value = dividendItems.reduce((acc, cur) => acc + cur.amount, 0);
  totalRealizedPL.value = realizedPLItems.reduce((acc, cur) => acc + cur.amount, 0);
  totalHoldingsCost.value = Object.values(holdingsSnapshot).reduce((acc, cur) => acc + cur.totalCost, 0);

  // 渲染图表
  renderIncomeChart(totalDividends.value, totalRealizedPL.value);
  renderHoldingsChart(holdingsSnapshot);
  renderIndustryChart(holdingsSnapshot);
  renderTrendChart(dividendItems, realizedPLItems);
};

// --- 1. 收益构成分析 (改为横向柱状图) ---
function renderIncomeChart(div, pl) {
  if (!charts.income) return;
  
  const net = div + pl;
  
  // 定义数据项，单独指定每根柱子的颜色
  const data = [
    { value: div, name: '分红收入', itemStyle: { color: COLORS.DIVIDEND } },
    { value: pl, name: '平仓盈亏', itemStyle: { color: pl >= 0 ? COLORS.GAIN : COLORS.LOSS } },
    { value: net, name: '净收益', itemStyle: { color: net >= 0 ? COLORS.GAIN : COLORS.LOSS } }
  ];

  charts.income.setOption({
    // 1. 标题放在左上方
    title: {
      text: '收益构成分析',
      left: '0',
      top: '0',
      textStyle: { fontSize: 16, fontWeight: 600, color: '#1d1d1f' }
    },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '10%', bottom: '3%', top: '20%', containLabel: true },
    // 横向柱状图：X轴是数值，Y轴是类别
    xAxis: { 
      type: 'value', 
      splitLine: { lineStyle: { type: 'dashed' } },
      axisLabel: { formatter: (val) => `¥${val}` }
    },
    yAxis: { 
      type: 'category', 
      data: ['分红收入', '平仓盈亏', '净收益'],
      axisTick: { show: false },
      axisLine: { show: false },
      inverse: true // 让分红在最上面
    },
    series: [{
      type: 'bar',
      data: data,
      barWidth: '40%',
      label: {
        show: true,
        position: 'right', // 正数显示在右侧
        formatter: (p) => {
            // 如果是负数，ECharts 默认可能会把标签挤在里面，这里做个简单处理
            return `¥${p.value.toLocaleString()}`;
        },
        fontWeight: 'bold'
      }
    }]
  });
}

// --- 2. 持仓分布 (保持蓝色系) ---
function renderHoldingsChart(holdings) {
  if (!charts.holdings) return;
  const data = Object.entries(holdings).map(([name, val]) => ({ value: val.totalCost, name })).sort((a, b) => b.value - a.value);

  charts.holdings.setOption({
    color: BLUE_PALETTE,
    tooltip: { trigger: 'item' },
    legend: { type: 'scroll', orient: 'vertical', right: 0, top: 20, bottom: 20 },
    series: [{
      name: '持仓成本',
      type: 'pie',
      radius: [20, 90],
      center: ['40%', '50%'],
      roseType: 'area',
      itemStyle: { borderRadius: 5 },
      data: data
    }]
  });
}

// --- 3. 行业分布 (保持蓝色系) ---
function renderIndustryChart(holdings) {
  if (!charts.industry) return;
  const industryMap = {};
  Object.values(holdings).forEach(h => {
    const ind = h.industry || '未分类';
    industryMap[ind] = (industryMap[ind] || 0) + h.totalCost;
  });
  const data = Object.entries(industryMap).map(([name, val]) => ({ value: val, name }));

  charts.industry.setOption({
    color: BLUE_PALETTE,
    tooltip: { trigger: 'item' },
    legend: { type: 'scroll', orient: 'vertical', right: 0, top: 20, bottom: 20 },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['40%', '50%'],
      label: { show: false },
      data: data
    }]
  });
}

// --- 4. 月度趋势 (合并盈亏 + 滑动) ---
function renderTrendChart(dividends, realized) {
  if (!charts.trend) return;

  // 1. 聚合数据：按月合并分红和平仓
  const monthlyData = {}; // { '2023-01': 100, '2023-02': -50 }
  
  const addToMonth = (date, amount) => {
    const month = date.substring(0, 7);
    monthlyData[month] = (monthlyData[month] || 0) + amount;
  };

  dividends.forEach(d => addToMonth(d.date, d.amount));
  realized.forEach(r => addToMonth(r.date, r.amount));

  const months = Object.keys(monthlyData).sort();
  const seriesData = months.map(m => monthlyData[m]);

  charts.trend.setOption({
    tooltip: { 
      trigger: 'axis',
      formatter: (params) => {
        const item = params[0];
        // Tooltip 显示月份和具体金额
        return `${item.name}<br/>
                <span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${item.color};"></span>
                净盈亏: <b>¥${item.value.toLocaleString()}</b>`;
      }
    },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true }, // bottom 留出空间给滑动条
    xAxis: { 
      type: 'category', 
      data: months,
      axisLine: { lineStyle: { color: '#e5e5ea' } },
      axisLabel: { color: COLORS.AXIS_TEXT }
    },
    yAxis: { 
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed' } }
    },
    // 3. 添加左右滑动 (DataZoom)
    dataZoom: [
      {
        type: 'slider', // 底部滑动条
        show: true,
        xAxisIndex: [0],
        start: 0, // 默认显示范围 0%
        end: 100, // 到 100% (如果月份特别多，可以设为 50 让用户滑)
        bottom: 5,
        height: 20,
        borderColor: 'transparent',
        fillerColor: 'rgba(0, 113, 227, 0.1)',
        handleStyle: { color: '#0071e3' }
      },
      {
        type: 'inside', // 支持鼠标滚轮缩放/手指拖动
        xAxisIndex: [0],
        start: 0,
        end: 100
      }
    ],
    series: [{
      name: '月度净盈亏',
      type: 'bar',
      data: seriesData,
      barMaxWidth: 40,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        // 2. 颜色逻辑：>0 红, <0 绿
        color: (params) => {
          return params.value >= 0 ? COLORS.GAIN : COLORS.LOSS;
        }
      },
      label: {
        show: true,
        position: 'top', // 正数在上方
        color: (p) => p.value >= 0 ? COLORS.GAIN : COLORS.LOSS,
        formatter: (p) => {
          // 负数时标签强制显示在柱子下方会更美观，但ECharts默认top对负数会在0轴上方
          // 这里简单处理：只显示数值
          return p.value.toFixed(0);
        }
      }
    }]
  });
}

const initCharts = () => {
  charts.income = echarts.init(incomeChartRef.value);
  charts.holdings = echarts.init(holdingsChartRef.value);
  charts.industry = echarts.init(industryChartRef.value);
  charts.trend = echarts.init(trendChartRef.value);
};
const resizeCharts = () => Object.values(charts).forEach(c => c.resize());

watch(selectedYear, () => processData());

onMounted(async () => {
  try {
    const res = await axios.get(API_URL);
    rawTransactions.value = res.data;
    initCharts();
    processData();
    window.addEventListener('resize', resizeCharts);
  } catch (e) {
    ElMessage.error('数据加载失败');
  }
});

const formatNumber = (num) => num.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
</script>

<style scoped>
/* 保持原有样式 */
.page-container { padding: 24px 32px; height: 100vh; overflow-y: auto; box-sizing: border-box; }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header-title { margin: 0; font-size: 24px; }
.stat-card { text-align: center; padding: 10px 0; }
.stat-label { font-size: 13px; color: #86868b; margin-bottom: 5px; }
.stat-value { font-size: 24px; font-weight: 600; font-family: var(--font-display); }
.chart-card { height: 380px; display: flex; flex-direction: column; }
.chart-container { width: 100%; height: 320px; }
.card-title { font-weight: 600; color: #1d1d1f; }
.text-dividend { color: #ff9500; }
.text-gain { color: #ff3b30; }  
.text-loss { color: #34c759; }  
.apple-card { border: none !important; border-radius: 16px !important; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04) !important; background-color: #fff !important; }
</style>