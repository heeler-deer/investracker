<template>
  <el-container class="main-layout">

    <el-header class="app-header">
      <el-card shadow="never">
        <template #header>
          <div class="card-header">
            <span>
              <h1>股票/基金 交易记录</h1>
            </span>
          </div>
        </template>

        <el-form :model="newTransaction" label-width="80px" :inline="true" @submit.prevent="handleAddTransaction">
          <el-form-item label="名称" prop="stockName">
            <el-input v-model="newTransaction.stockName" placeholder="股票/基金名称" required />
          </el-form-item>
          <el-form-item label="方向" prop="direction">
            <el-select v-model="newTransaction.direction" placeholder="选择类型" required style="width: 120px">
              <el-option label="买入" value="Buy" />
              <el-option label="卖出" value="Sell" />
              <el-option label="分红" value="Dividend" />
            </el-select>
          </el-form-item>
          <el-form-item label="日期" prop="date">
            <el-date-picker v-model="newTransaction.date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期"
              required />
          </el-form-item>

          <template v-if="newTransaction.direction !== 'Dividend'">
            <el-form-item label="行业" prop="industry">
              <el-input v-model="newTransaction.industry" placeholder="行业" />
            </el-form-item>
            <el-form-item label="类别" prop="category">
              <el-select v-model="newTransaction.category" placeholder="类别" required style="width: 120px">
                <el-option label="股票" value="Stock" />
                <el-option label="基金" value="Fund" />
              </el-select>
            </el-form-item>
            
            <el-form-item :label="newTransaction.category === 'Stock' ? '股数' : '份额'" prop="volume">
              <el-input-number v-model="newTransaction.volume" :min="0" :precision="4" placeholder="成交数量" required />
            </el-form-item>
            <el-form-item :label="newTransaction.category === 'Stock' ? '单价' : '净值'" prop="price">
              <el-input-number v-model="newTransaction.price" :min="0" :precision="6" placeholder="成交价格" step="0.01"
                required />
            </el-form-item>
            
            <el-form-item label="手续费" prop="fee">
              <el-input-number v-model="newTransaction.fee" :min="0" :precision="2" placeholder="手续费" step="0.01"
                required />
            </el-form-item>
          </template>

          <template v-if="newTransaction.direction === 'Dividend'">
            <el-form-item label="分红金额" prop="dividendAmount">
              <el-input-number v-model="newTransaction.dividendAmount" :min="0" :precision="2" placeholder="分红总额" required />
            </el-form-item>
          </template>

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
        <el-table-column prop="stock_name" label="名称" fixed width="120" />
        <el-table-column prop="directionDisplay" label="投资方向" width="80" />
        <el-table-column prop="transaction_date" label="投资日期" width="110">
          <template #default="scope">
            {{ formatDate(scope.row.transaction_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="industry" label="行业" width="100" />
        <el-table-column prop="categoryDisplay" label="类别" width="80" />
        
        <el-table-column prop="volume" label="成交股数/份额" align="right">
          <template #default="scope">
            {{ scope.row.direction !== 'Dividend' ? formatNumber(scope.row.volume, 4) : 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column prop="price" label="成交单价/净值" align="right">
          <template #default="scope">
             {{ scope.row.direction !== 'Dividend' ? formatCurrency(scope.row.price, 4) : 'N/A' }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="交易金额" align="right">
          <template #default="scope">
             {{ scope.row.direction !== 'Dividend' ? formatCurrency(scope.row.totalAmount) : 'N/A' }}
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
        <el-table-column prop="cumulativeShares" label="累计持仓/份额" align="right" width="120">
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
import { ElMessage, ElMessageBox } from 'element-plus'

// --- 状态定义 (State) ---

const API_URL = 'http://localhost:3000/api/transactions';
const rawTransactions = ref([]); 
const currentPage = ref(1);
const pageSize = ref(20); 

// ⭐️ 变更 6：为表单添加 dividendAmount 状态
const getInitialFormState = () => ({
  stockName: '',
  direction: 'Buy',
  date: new Date().toISOString().split('T')[0], 
  industry: '',
  category: 'Stock',
  volume: null,
  price: null,
  fee: null,
  dividendAmount: null, // 新增
});
const newTransaction = ref(getInitialFormState());

const selectedRows = ref([]);

// --- 核心逻辑 (Computed Properties) ---

/**
 * ⭐️ 变更 7：修改核心计算逻辑以处理分红
 */
const processedTransactions = computed(() => {
  const portfolio = {}; 

  // 1. 遍历 (后端已确保是 ASC 升序)
  const calculated = rawTransactions.value.map(tx => {
    // 确保数据是数字
    const volume = parseFloat(tx.volume) || 0;
    const price = parseFloat(tx.price) || 0;
    const fee = parseFloat(tx.fee) || 0;
    const stock = tx.stock_name; 

    if (!portfolio[stock]) {
      portfolio[stock] = { shares: 0, totalCost: 0 };
    }
    const state = portfolio[stock];

    // ⭐️ 移植 app.js 中的计算逻辑 (并修改)
    let totalAmount = 0;
    let netCashFlow = 0;
    let realizedPL = 0;
    let realizedPLRate = 0;
    let currentAvgCost = (state.shares === 0) ? 0 : state.totalCost / state.shares;

    // --- 核心修改点 ---
    if (tx.direction === 'Dividend') {
      const dividend = parseFloat(tx.dividend_amount) || 0;
      
      // 关键：分红降低总成本
      state.totalCost -= dividend; 
      
      realizedPL = dividend; // 分红是已实现收益
      netCashFlow = dividend; // 现金流入
      
    } else if (tx.direction === 'Buy') {
      totalAmount = volume * price;
      const costOfThisBuy = totalAmount + fee;
      netCashFlow = -(totalAmount + fee);

      state.shares += volume;
      state.totalCost += costOfThisBuy;
      
    } else { // 'Sell'
      totalAmount = volume * price;
      netCashFlow = (totalAmount - fee);

      const costOfSharesSold = currentAvgCost * volume;
      realizedPL = (totalAmount - fee) - costOfSharesSold;

      state.shares -= volume;
      state.totalCost -= costOfSharesSold;

      if (costOfSharesSold !== 0) {
        realizedPLRate = realizedPL / costOfSharesSold;
      }
    }
    // --- 核心修改结束 ---

    let cumulativeShares = state.shares;
    let avgCost = (state.shares === 0) ? 0 : state.totalCost / state.shares;
    
    // 确保 avgCost 不是负数 (如果分红超过成本)
    if (avgCost < 0) avgCost = 0; 
    // 确保 state.totalCost 不是负数
    if (state.totalCost < 0) state.totalCost = 0;


    // 返回一个包含所有计算字段的新对象
    return {
      ...tx,
      volume,
      price,
      fee,
      
      // ⭐️ (修改) 增加分红的显示
      directionDisplay: tx.direction === 'Buy' ? '买入' : (tx.direction === 'Sell' ? '卖出' : '分红'),
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

// 3. (无变化)
const pagedTransactions = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return processedTransactions.value.slice(startIndex, endIndex);
});

// 4. (无变化)
const totalTransactions = computed(() => processedTransactions.value.length);


// --- 方法 (Methods) ---

/**
 * 从后端加载所有交易数据
 */
async function loadTransactions() {
  try {
    const response = await axios.get(API_URL);
    rawTransactions.value = response.data; 
  } catch (error) {
    console.error('加载交易数据失败:', error);
    ElMessage.error('无法从服务器加载数据。请确保后端 API 正在运行。');
  }
}

/**
 * ⭐️ 变更 8：处理表单提交
 */
async function handleAddTransaction() {
  try {
    // 1. 准备要发送的数据
    const payload = { ...newTransaction.value };

    if (payload.direction === 'Dividend') {
      // 如果是分红，清空无关字段
      payload.industry = null;
      payload.category = 'Stock'; // 分红默认关联为 'Stock'
      payload.volume = null;
      payload.price = null;
      payload.fee = 0;
    } else {
      // 如果是买卖，清空分红字段
      payload.dividendAmount = null;
      // 确保手续费有值
      if (payload.fee === null) payload.fee = 0;
    }

    // 2. 发送请求
    const response = await axios.post(API_URL, payload); //
    
    if (response.status === 201) {
      ElMessage.success('交易添加成功！');
      newTransaction.value = getInitialFormState();
      await loadTransactions();
      currentPage.value = 1;
    } else {
      throw new Error('保存失败');
    }
  } catch (error) {
    console.error('添加交易失败:', error);
    ElMessage.error('保存失败，请检查后端服务是否运行。');
  }
}

// --- 需求 3：(无变化) ---

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
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条记录吗？此操作不可撤销。`,
      '删除确认',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    const idsToDelete = selectedRows.value.map(row => row.id);
    const response = await axios.post(`${API_URL}/delete`, { ids: idsToDelete });

    if (response.status === 200) {
      ElMessage.success(response.data.message || '删除成功！');
      await loadTransactions();
      selectedRows.value = [];
    } else {
      throw new Error(response.data.message || '删除失败');
    }
  } catch (error) {
    if (error === 'cancel') {
      ElMessage.info('已取消删除');
    } else {
      console.error('删除交易失败:', error);
      ElMessage.error(error.response?.data?.message || error.message || '删除失败，请检查后端服务。');
    }
  }
}


// --- 辅助函数 (Helpers) --- (无变化)
function formatCurrency(value, precision = 2) {
  if (typeof value !== 'number') value = 0;
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}
function formatNumber(value, precision = 2) {
  if (typeof value !== 'number') value = 0;
  return value.toLocaleString('zh-CN', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  });
}
function formatPercentage(value) {
  if (typeof value !== 'number') value = 0;
  return (value * 100).toFixed(2) + '%';
}

/**
 * ⭐️ 变更 9：表格行样式 (买入/卖出/分红)
 */
function tableRowClassName({ row }) {
  if (row.direction === 'Buy') {
    return 'buy-row';
  } else if (row.direction === 'Sell') {
    return 'sell-row';
  } else if (row.direction === 'Dividend') {
    return 'dividend-row';
  }
  return '';
}

// --- 生命周期 (Lifecycle) ---
onMounted(loadTransactions);

/**
 * (新增) 格式化日期
 */
function formatDate(value) {
  if (typeof value !== 'string' || !value.includes('T')) {
    return value; 
  }
  return value.split('T')[0];
}

/**
 * ⭐️ 变更 10：(新增) 根据单元格内容动态添加 CSS 类
 */
function tableCellClassName({ row, column }) {
  if (!column.property) {
    return '';
  }

  // 需求 1：投资方向 (directionDisplay)
  if (column.property === 'directionDisplay') {
    if (row.direction === 'Buy') {
      return 'value-negative-green'; // 买入 = 绿色
    } else if (row.direction === 'Sell') {
      return 'value-positive-red'; // 卖出 = 红色
    } else if (row.direction === 'Dividend') {
      return 'value-dividend-blue'; // 分红 = 蓝色
    }
  }

  // 需求 2：净流入现金流 (netCashFlow)
  if (column.property === 'netCashFlow') {
    if (row.netCashFlow > 0) {
      return 'value-positive-red'; // 正数 (卖出/分红) = 红色
    } else if (row.netCashFlow < 0) {
      return 'value-negative-green'; // 负数 (买入) = 绿色
    }
  }

  // 需求 3：实现/浮动收益 (realizedPL) 和 盈亏率 (realizedPLRate)
  if (column.property === 'realizedPL' || column.property === 'realizedPLRate') {
    const value = row[column.property];
    if (value > 0) {
      return 'value-positive-red'; // 盈利 = 红色
    } else if (value < 0) {
      return 'value-negative-green'; // 亏损 = 绿色
    }
  }

  return ''; // 其他情况使用默认样式
}
</script>

<style>
/* ⭐️ 变更 11：移除旧的 buy/sell-row 样式，新增 dividend-row 和 cell 样式 */

/* (移除) .el-table .buy-row .el-table__cell:nth-child(3) ... */
/* (移除) .el-table .sell-row .el-table__cell:nth-child(3) ... */

/* 新增：分红行基础样式 (可选) */
.el-table .dividend-row {
   /* background-color: #f8f8f8; */
}

/* 单元格文本颜色 */
.el-table__cell.value-positive-red .cell {
  color: #dc3545 !important; /* 红色 (用于正数/卖出) */
  font-weight: bold;
}
.el-table__cell.value-negative-green .cell {
  color: #28a745 !important; /* 绿色 (用于负数/买入) */
  font-weight: bold;
}
.el-table__cell.value-dividend-blue .cell {
  color: #007bff !important; /* 蓝色 (用于分红) */
  font-weight: bold;
}
</style>

<style scoped>
/* ... (scoped 样式基本无变化) ... */
.main-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  height: auto;
  padding: 10px;
  background-color: #f4f7f6;
}

.app-header .el-card {
  border: none; 
}

.app-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
  text-align: center;
}

.el-form-item {
  margin-bottom: 10px;
}

.app-main {
  flex: 1;
  padding: 0 10px;
  overflow: hidden; 
  display: flex;
  flex-direction: column;
}

.table-toolbar {
  display: flex;
  justify-content: flex-start;
  padding: 10px 0;
}

.app-main .el-table {
  flex: 1;
}


.app-footer {
  display: flex;
  justify-content: center; 
  align-items: center;
  border-top: 1px solid #e4e7ed;
  background-color: #ffffff;
}
</style>