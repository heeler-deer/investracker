<template>
  <el-container class="main-layout">

    <el-header class="app-header">
      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <span>
              <h1>股票交易记录</h1>
            </span>
          </div>
        </template>

        <el-form :model="newTransaction" label-width="80px" :inline="true" @submit.prevent="handleAddTransaction">
          <el-form-item label="股票名称" prop="stockName">
            <el-input v-model="newTransaction.stockName" placeholder="股票名称" required />
          </el-form-item>
          <el-form-item label="方向" prop="direction">
            <el-select v-model="newTransaction.direction" placeholder="买入/卖出" required style="width: 120px">
              <el-option label="买入" value="Buy" />
              <el-option label="卖出" value="Sell" />
            </el-select>
          </el-form-item>
          <el-form-item label="日期" prop="date">
            <el-date-picker v-model="newTransaction.date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期"
              required />
          </el-form-item>
          <el-form-item label="行业" prop="industry">
            <el-input v-model="newTransaction.industry" placeholder="行业" />
          </el-form-item>
          <el-form-item label="类别" prop="category">
            <el-select v-model="newTransaction.category" placeholder="类别" required style="width: 120px">
              <el-option label="股票" value="Stock" />
              <el-option label="基金" value="Fund" />
            </el-select>
          </el-form-item>
          <el-form-item label="股数" prop="volume">
            <el-input-number v-model="newTransaction.volume" :min="0" :precision="4" placeholder="成交股数" required />
          </el-form-item>
          <el-form-item label="单价" prop="price">
            <el-input-number v-model="newTransaction.price" :min="0" :precision="6" placeholder="成交单价" step="0.01"
              required />
          </el-form-item>
          <el-form-item label="手续费" prop="fee">
            <el-input-number v-model="newTransaction.fee" :min="0" :precision="2" placeholder="手续费" step="0.01"
              required />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" native-type="submit">
              <el-icon>
                <Plus />
              </el-icon>
              添加记录
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-header>

    <el-main class="app-main">
      <div class="table-toolbar">
        <el-button type="danger" @click="handleDeleteSelected" :disabled="selectedRows.length === 0">
          <el-icon>
            <Delete />
          </el-icon>
          删除选中 ({{ selectedRows.length }})
        </el-button>
      </div>

      <el-table :data="pagedTransactions" :row-class-name="tableRowClassName" :cell-class-name="tableCellClassName" border stripe height="100%"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" fixed />
        <el-table-column prop="stock_name" label="股票名称" fixed width="120" />
        <el-table-column prop="directionDisplay" label="投资方向" width="80" />
        <el-table-column prop="transaction_date" label="投资日期" width="110">
          <template #default="scope">
            {{ formatDate(scope.row.transaction_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="industry" label="行业" width="100" />
        <el-table-column prop="categoryDisplay" label="类别" width="80" />
        <el-table-column prop="volume" label="成交股数" align="right">
          <template #default="scope">
            {{ formatNumber(scope.row.volume, 4) }}
          </template>
        </el-table-column>
        <el-table-column prop="price" label="成交单价" align="right">
          <template #default="scope">
            {{ formatCurrency(scope.row.price, 4) }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="交易金额" align="right">
          <template #default="scope">
            {{ formatCurrency(scope.row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="fee" label="手续费" align="right">
          <template #default="scope">
            {{ formatCurrency(scope.row.fee) }}
          </template>
        </el-table-column>
        <el-table-column prop="netCashFlow" label="净流入现金流" align="right" width="120">
          <template #default="scope">
            {{ formatCurrency(scope.row.netCashFlow) }}
          </template>
        </el-table-column>
        <el-table-column prop="cumulativeShares" label="累计持仓股数" align="right" width="120">
          <template #default="scope">
            {{ formatNumber(scope.row.cumulativeShares, 4) }}
          </template>
        </el-table-column>
        <el-table-column prop="avgCost" label="加权平均成本" align="right" width="120">
          <template #default="scope">
            {{ formatCurrency(scope.row.avgCost, 4) }}
          </template>
        </el-table-column>
        <el-table-column prop="realizedPL" label="实现/浮动收益" align="right" width="120">
          <template #default="scope">
            {{ formatCurrency(scope.row.realizedPL) }}
          </template>
        </el-table-column>
        <el-table-column prop="realizedPLRate" label="盈亏率" align="right" width="80">
          <template #default="scope">
            {{ formatPercentage(scope.row.realizedPLRate) }}
          </template>
        </el-table-column>
      </el-table>
    </el-main>

    <el-footer class="app-footer">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
        :total="totalTransactions" layout="total, sizes, prev, pager, next, jumper" background />
    </el-footer>

  </el-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
// 需求 3：导入 ElMessageBox 用于确认删除
import { ElMessage, ElMessageBox } from 'element-plus'

// --- 状态定义 (State) ---

// 后端 API 地址
const API_URL = 'http://localhost:3000/api/transactions';

// 原始交易数据 (将从后端获取)
const rawTransactions = ref([]); //

// 分页状态
const currentPage = ref(1);
const pageSize = ref(20); // ⭐️ 默认每页 20 条

// 表单数据
const getInitialFormState = () => ({
  stockName: '',
  direction: 'Buy',
  date: new Date().toISOString().split('T')[0], // 默认今天
  industry: '',
  category: 'Stock',
  volume: null,
  price: null,
  fee: null,
});
const newTransaction = ref(getInitialFormState());

// 需求 3：新增状态，用于跟踪选中的行
const selectedRows = ref([]);

// --- 核心逻辑 (Computed Properties) ---

/**
 * 1. 计算所有交易的衍生数据 (成本、盈亏等)
 * - 必须按 ASC 顺序计算
 * - 2. 反转数组，实现 "最新在最前"
 */
const processedTransactions = computed(() => {
  const portfolio = {}; //

  // 1. 遍历 (后端已确保是 ASC 升序)
  const calculated = rawTransactions.value.map(tx => {
    // 确保数据是数字
    const volume = parseFloat(tx.volume) || 0;
    const price = parseFloat(tx.price) || 0;
    const fee = parseFloat(tx.fee) || 0;
    const stock = tx.stock_name; //

    if (!portfolio[stock]) {
      portfolio[stock] = { shares: 0, totalCost: 0 };
    }
    const state = portfolio[stock];

    // ⭐️ 移植 app.js 中的计算逻辑
    const totalAmount = volume * price;
    const netCashFlow = (tx.direction === 'Buy') ? -(totalAmount + fee) : (totalAmount - fee);

    let realizedPL = 0;
    let realizedPLRate = 0;
    let currentAvgCost = (state.shares === 0) ? 0 : state.totalCost / state.shares;

    let cumulativeShares = state.shares;
    let avgCost = currentAvgCost;

    if (tx.direction === 'Buy') {
      const costOfThisBuy = totalAmount + fee;
      state.shares += volume;
      state.totalCost += costOfThisBuy;
    } else {
      const costOfSharesSold = currentAvgCost * volume;
      realizedPL = (totalAmount - fee) - costOfSharesSold;

      state.shares -= volume;
      state.totalCost -= costOfSharesSold;

      if (costOfSharesSold !== 0) {
        realizedPLRate = realizedPL / costOfSharesSold;
      }
    }

    cumulativeShares = state.shares;
    avgCost = (state.shares === 0) ? 0 : state.totalCost / state.shares;

    // 返回一个包含所有计算字段的新对象
    return {
      ...tx,
      volume,
      price,
      fee,
      directionDisplay: tx.direction === 'Buy' ? '买入' : '卖出',

      // ⭐️ (新增) 类别中文显示 ⭐️
      categoryDisplay: tx.category === 'Stock' ? '股票' : (tx.category === 'Fund' ? '基金' : tx.category),

      totalAmount,
      netCashFlow,
      cumulativeShares,
      avgCost,
      realizedPL,
      realizedPLRate,
    };

  });

  // 2. 反转数组，实现 "最新在最前"
  return calculated.reverse();
});

// 3. 根据分页状态，从 "processedTransactions" 中切片出当前页的数据
const pagedTransactions = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return processedTransactions.value.slice(startIndex, endIndex);
});

// 4. 计算总条目数
const totalTransactions = computed(() => processedTransactions.value.length);


// --- 方法 (Methods) ---

/**
 * 从后端加载所有交易数据
 */
async function loadTransactions() {
  try {
    const response = await axios.get(API_URL);
    rawTransactions.value = response.data; //
    // ElMessage.success('数据加载成功！'); // 每次删除都提示这个有点烦，改为只在失败时提示
  } catch (error) {
    console.error('加载交易数据失败:', error);
    ElMessage.error('无法从服务器加载数据。请确保后端 API 正在运行。');
  }
}

/**
 * 处理表单提交
 */
async function handleAddTransaction() {
  try {
    const response = await axios.post(API_URL, newTransaction.value); //
    if (response.status === 201) {
      ElMessage.success('交易添加成功！');

      // 重置表单
      newTransaction.value = getInitialFormState();

      // ⭐️ 重新加载所有数据，以确保计算和分页正确
      await loadTransactions();

      // 自动跳转到第一页，查看最新记录
      currentPage.value = 1;

    } else {
      throw new Error('保存失败');
    }
  } catch (error) {
    console.error('添加交易失败:', error);
    ElMessage.error('保存失败，请检查后端服务是否运行。');
  }
}

// --- 需求 3：新增删除相关方法 ---

/**
 * (新增) 处理表格行选中变化
 */
function handleSelectionChange(selection) {
  selectedRows.value = selection;
}

/**
 * (新增) 处理删除选中项
 */
async function handleDeleteSelected() {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请至少选择一条记录');
    return;
  }

  try {
    // 1. 弹出确认框
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条记录吗？此操作不可撤销。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    // 2. 提取 IDs
    const idsToDelete = selectedRows.value.map(row => row.id);

    // 3. 调用后端 API (注意 URL 变为 /delete)
    const response = await axios.post(`${API_URL}/delete`, { ids: idsToDelete });

    if (response.status === 200) {
      ElMessage.success(response.data.message || '删除成功！');

      // 4. 重新加载数据
      await loadTransactions();

      // 5. 清空选中状态 (重新加载后表格会重绘，selection 会自动清空)
      selectedRows.value = [];
    } else {
      throw new Error(response.data.message || '删除失败');
    }
  } catch (error) {
    // 区分是 API 错误还是用户取消
    if (error === 'cancel') {
      ElMessage.info('已取消删除');
    } else {
      console.error('删除交易失败:', error);
      ElMessage.error(error.response?.data?.message || error.message || '删除失败，请检查后端服务。');
    }
  }
}


// --- 辅助函数 (Helpers) ---

/**
 * 格式化货币
 */
function formatCurrency(value, precision = 2) {
  if (typeof value !== 'number') value = 0;
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

/**
 * 格式化普通数字
 */
function formatNumber(value, precision = 2) {
  if (typeof value !== 'number') value = 0;
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}

/**
 * 格式化百分比
 */
function formatPercentage(value) {
  if (typeof value !== 'number') value = 0;
  return (value * 100).toFixed(2) + '%';
}

/**
 * 表格行样式 (买入/卖出)
 */
function tableRowClassName({ row }) {
  if (row.direction === 'Buy') {
    return 'buy-row';
  } else if (row.direction === 'Sell') {
    return 'sell-row';
  }
  return '';
}

// --- 生命周期 (Lifecycle) ---

// 页面加载时，立即从 API 加载数据
onMounted(loadTransactions);

/**
 * (新增) 格式化日期
 */
function formatDate(value) {
  if (typeof value !== 'string' || !value.includes('T')) {
    return value; // 如果不是预期的字符串，直接返回
  }
  return value.split('T')[0];
}
/**
 * (新增) 根据单元格内容动态添加 CSS 类
 */
function tableCellClassName({ row, column }) {
  // 我们只关心有 'property' 属性的数据列
  if (!column.property) {
    return '';
  }

  // 需求 1：净流入现金流 (netCashFlow)
  // 负数 (买入/流出) = 绿色, 正数 (卖出/流入) = 红色
  if (column.property === 'netCashFlow') {
    if (row.netCashFlow > 0) {
      return 'value-positive-red';
    } else if (row.netCashFlow < 0) {
      return 'value-negative-green';
    }
  }

  // 需求 2：实现/浮动收益 (realizedPL) 和 盈亏率 (realizedPLRate)
  // 负数 (亏损) = 绿色, 正数 (盈利) = 红色
  if (column.property === 'realizedPL' || column.property === 'realizedPLRate') {
    const value = row[column.property];
    if (value > 0) {
      return 'value-positive-red';
    } else if (value < 0) {
      return 'value-negative-green';
    }
  }

  return ''; // 其他情况使用默认样式
}
</script>

<style>
/* 全局样式 (非 scoped) 
  用于修改 Element Plus 内部的 tr/td 样式
*/
.el-table .buy-row .el-table__cell:nth-child(3) {
  /* 投资方向列 (因为加了复选框，索引从 2 变为 3) */
  color: #28a745;
  /* */
  font-weight: bold;
}

.el-table .sell-row .el-table__cell:nth-child(3) {
  color: #dc3545;
  /* */
  font-weight: bold;
}

.el-table__cell.value-positive-red .cell {
  color: #dc3545 !important; /* 红色 (用于正数) */
  font-weight: bold;
}
.el-table__cell.value-negative-green .cell {
  color: #28a745 !important; /* 绿色 (用于负数) */
  font-weight: bold;
}
</style>

<style scoped>
/* 组件局部样式 (scoped) 
  用于定义我们的主布局
*/
.main-layout {
  height: 100vh;
  /* 占满整个视口高度 */
  display: flex;
  flex-direction: column;
}

.app-header {
  /* el-header 默认有 60px 高度, 
    我们改为 auto 让它可以根据内容自动调整 
  */
  height: auto;
  padding: 10px;
  background-color: #f4f7f6;
  /* */
}

.app-header .el-card {
  border: none;
  /* 移除卡片边框 */
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
  /* */
  /* 需求 1：修改为居中 */
  text-align: center;
}

/* 让表单项更紧凑 */
.el-form-item {
  margin-bottom: 10px;
}

.app-main {
  /* ⭐️ 核心：让主内容区自动伸缩 
    它会填满 Header 和 Footer 之外的所有空间
    内部的 el-table 设置了 height="100%"，所以会填满这个区域并自动产生滚动条
  */
  flex: 1;
  padding: 0 10px;
  overflow: hidden;
  /* 隐藏 el-main 自身的滚动条 */

  /* 需求 3：让删除按钮和表格垂直排列 */
  display: flex;
  flex-direction: column;
}

/* 需求 3：表格工具栏样式 */
.table-toolbar {
  display: flex;
  justify-content: flex-start;
  padding: 10px 0;
}

.app-main .el-table {
  /* 需求 3：让表格填满剩余空间 */
  flex: 1;
}


.app-footer {
  /* el-footer 默认有 60px 高度, 保持即可 
    它将固定在底部
  */
  display: flex;
  justify-content: center;
  /* 居中分页组件 */
  align-items: center;
  border-top: 1px solid #e4e7ed;
  background-color: #ffffff;
}
</style>