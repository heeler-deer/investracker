<template>
  <div class="page-container">
    <div class="header-area">
      <h1 class="page-header-title">交易记录</h1>

      <el-card shadow="hover" class="input-card">
        <el-form :model="newTransaction" label-width="auto" :inline="true" @submit.prevent="handleAddTransaction" class="transaction-form">
          <el-form-item label="名称" prop="stockName">
            <el-input v-model="newTransaction.stockName" placeholder="股票/基金名称" required />
          </el-form-item>
          <el-form-item label="方向" prop="direction">
            <el-select v-model="newTransaction.direction" placeholder="选择类型" required style="width: 100px">
              <el-option label="买入" value="Buy" />
              <el-option label="卖出" value="Sell" />
              <el-option label="分红" value="Dividend" />
            </el-select>
          </el-form-item>
          <el-form-item label="日期" prop="date">
            <el-date-picker v-model="newTransaction.date" type="date" value-format="YYYY-MM-DD" placeholder="选择日期"
              required style="width: 140px"/>
          </el-form-item>

          <template v-if="newTransaction.direction !== 'Dividend'">
            <el-form-item label="行业" prop="industry">
              <el-input v-model="newTransaction.industry" placeholder="行业" style="width: 120px"/>
            </el-form-item>
            <el-form-item label="类别" prop="category">
              <el-select v-model="newTransaction.category" placeholder="类别" required style="width: 100px">
                <el-option label="股票" value="Stock" />
                <el-option label="基金" value="Fund" />
              </el-select>
            </el-form-item>
            
            <el-form-item :label="newTransaction.category === 'Stock' ? '股数' : '份额'" prop="volume">
              <el-input-number v-model="newTransaction.volume" :min="0" :precision="4" placeholder="数量" required style="width: 130px"/>
            </el-form-item>
            <el-form-item :label="newTransaction.category === 'Stock' ? '单价' : '净值'" prop="price">
              <el-input-number v-model="newTransaction.price" :min="0" :precision="6" placeholder="价格" step="0.01"
                required style="width: 130px"/>
            </el-form-item>
            
            <el-form-item label="手续费" prop="fee">
              <el-input-number v-model="newTransaction.fee" :min="0" :precision="2" placeholder="手续费" step="0.01"
                required style="width: 100px"/>
            </el-form-item>
          </template>

          <template v-if="newTransaction.direction === 'Dividend'">
            <el-form-item label="分红金额" prop="dividendAmount">
              <el-input-number v-model="newTransaction.dividendAmount" :min="0" :precision="2" placeholder="分红总额" required />
            </el-form-item>
          </template>

          <el-form-item>
            <el-button type="primary" native-type="submit" round>
              <el-icon><Plus /></el-icon>
              添加
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <div class="content-area">
      <div class="table-toolbar">
        <el-button type="danger" plain size="small" @click="handleDeleteSelected" :disabled="selectedRows.length === 0">
          <el-icon style="margin-right: 4px"><Delete /></el-icon>
          删除选中 ({{ selectedRows.length }})
        </el-button>
      </div>

      <el-table :data="pagedTransactions" :row-class-name="tableRowClassName" :cell-class-name="tableCellClassName" 
        style="width: 100%; border-radius: 8px; overflow: hidden;" height="100%"
        @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="45" fixed />
        <el-table-column prop="stock_name" label="名称" fixed width="120" show-overflow-tooltip />
        <el-table-column prop="directionDisplay" label="方向" width="70" align="center"/>
        <el-table-column prop="transaction_date" label="日期" width="100" sortable>
          <template #default="scope">
            {{ formatDate(scope.row.transaction_date) }}
          </template>
        </el-table-column>
        <el-table-column prop="industry" label="行业" width="100" show-overflow-tooltip />
        <el-table-column prop="categoryDisplay" label="类别" width="70" align="center"/>
        
        <el-table-column prop="volume" label="数量" align="right" width="100">
          <template #default="scope">
            {{ scope.row.direction !== 'Dividend' ? formatNumber(scope.row.volume, 4) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价/净值" align="right" width="100">
          <template #default="scope">
             {{ scope.row.direction !== 'Dividend' ? formatNumber(scope.row.price, 4) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="交易额" align="right" width="110">
          <template #default="scope">
             {{ scope.row.direction !== 'Dividend' ? formatCurrency(scope.row.totalAmount) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="fee" label="费用" align="right" width="80">
          <template #default="scope">
             {{ formatNumber(scope.row.fee) }}
          </template>
        </el-table-column>
        <el-table-column prop="netCashFlow" label="净现金流" align="right" width="110" sortable>
          <template #default="scope">
            <span :class="getAmountClass(scope.row.netCashFlow)">{{ formatCurrency(scope.row.netCashFlow) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="cumulativeShares" label="持仓" align="right" width="100">
          <template #default="scope">
            {{ formatNumber(scope.row.cumulativeShares, 4) }}
          </template>
        </el-table-column>
        <el-table-column prop="avgCost" label="均价" align="right" width="100">
          <template #default="scope">
            {{ formatNumber(scope.row.avgCost, 4) }}
          </template>
        </el-table-column>
        <el-table-column prop="realizedPL" label="收益" align="right" width="100">
          <template #default="scope">
            <span :class="getAmountClass(scope.row.realizedPL)">{{ formatCurrency(scope.row.realizedPL) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="realizedPLRate" label="收益率" align="right" width="90">
          <template #default="scope">
            <span :class="getAmountClass(scope.row.realizedPLRate)">{{ formatPercentage(scope.row.realizedPLRate) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="footer-area">
      <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :page-sizes="[10, 20, 50, 100]"
        :total="totalTransactions" layout="total, sizes, prev, pager, next" background />
    </div>

  </div>
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

const getInitialFormState = () => ({
  stockName: '',
  direction: 'Buy',
  date: new Date().toISOString().split('T')[0], 
  industry: '',
  category: 'Stock',
  volume: null,
  price: null,
  fee: null,
  dividendAmount: null, 
});
const newTransaction = ref(getInitialFormState());

const selectedRows = ref([]);

// --- 核心逻辑 (Computed Properties) ---

const processedTransactions = computed(() => {
  const portfolio = {}; 

  // 后端返回数据假设已按时间排序
  const calculated = rawTransactions.value.map(tx => {
    const volume = parseFloat(tx.volume) || 0;
    const price = parseFloat(tx.price) || 0;
    const fee = parseFloat(tx.fee) || 0;
    const stock = tx.stock_name; 

    if (!portfolio[stock]) {
      portfolio[stock] = { shares: 0, totalCost: 0 };
    }
    const state = portfolio[stock];

    let totalAmount = 0;
    let netCashFlow = 0;
    let realizedPL = 0;
    let realizedPLRate = 0;
    let currentAvgCost = (state.shares === 0) ? 0 : state.totalCost / state.shares;

    if (tx.direction === 'Dividend') {
      const dividend = parseFloat(tx.dividend_amount) || 0;
      // 分红降低总成本
      state.totalCost -= dividend; 
      realizedPL = dividend; 
      netCashFlow = dividend; 
      
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

    let cumulativeShares = state.shares;
    let avgCost = (state.shares === 0) ? 0 : state.totalCost / state.shares;
    
    if (avgCost < 0) avgCost = 0; 
    if (state.totalCost < 0) state.totalCost = 0;


    return {
      ...tx,
      volume,
      price,
      fee,
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

  // 最新在最前
  return calculated.reverse();
});

const pagedTransactions = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return processedTransactions.value.slice(startIndex, endIndex);
});

const totalTransactions = computed(() => processedTransactions.value.length);


// --- 方法 (Methods) ---

async function loadTransactions() {
  try {
    const response = await axios.get(API_URL);
    rawTransactions.value = response.data; 
  } catch (error) {
    console.error('加载交易数据失败:', error);
    ElMessage.error('无法从服务器加载数据。');
  }
}

async function handleAddTransaction() {
  try {
    const payload = { ...newTransaction.value };

    if (payload.direction === 'Dividend') {
      payload.industry = null;
      payload.category = 'Stock'; 
      payload.volume = null;
      payload.price = null;
      payload.fee = 0;
    } else {
      payload.dividendAmount = null;
      if (payload.fee === null) payload.fee = 0;
    }

    const response = await axios.post(API_URL, payload); 
    
    if (response.status === 201) {
      ElMessage.success('交易添加成功！');
      newTransaction.value = getInitialFormState();
      await loadTransactions();
      // 保持在当前页或跳回第一页视需求而定，这里跳回第一页看最新数据
      currentPage.value = 1;
    } else {
      throw new Error('保存失败');
    }
  } catch (error) {
    console.error('添加交易失败:', error);
    ElMessage.error('保存失败，请检查后端服务。');
  }
}

function handleSelectionChange(selection) {
  selectedRows.value = selection;
}

async function handleDeleteSelected() {
  if (selectedRows.value.length === 0) return;

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedRows.value.length} 条记录吗？`,
      '确认删除',
      { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
    );

    const idsToDelete = selectedRows.value.map(row => row.id);
    const response = await axios.post(`${API_URL}/delete`, { ids: idsToDelete });

    if (response.status === 200) {
      ElMessage.success('删除成功');
      await loadTransactions();
      selectedRows.value = [];
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败');
    }
  }
}

// --- 格式化助手 ---
function formatCurrency(value) {
  if (typeof value !== 'number') return '0.00';
  return value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatNumber(value, precision = 2) {
  if (typeof value !== 'number') return '0';
  return value.toLocaleString('zh-CN', { minimumFractionDigits: precision, maximumFractionDigits: precision });
}
function formatPercentage(value) {
  if (typeof value !== 'number') return '0.00%';
  return (value * 100).toFixed(2) + '%';
}
function formatDate(value) {
  if (typeof value !== 'string' || !value.includes('T')) return value; 
  return value.split('T')[0];
}
function getAmountClass(value) {
    if (value > 0) return 'text-red';
    if (value < 0) return 'text-green';
    return '';
}


function tableRowClassName({ row }) {
  // Apple风格通常表格比较干净，这里仅保留分红行的微弱背景区分
  if (row.direction === 'Dividend') return 'dividend-row';
  return '';
}

function tableCellClassName({ row, column }) {
    // 颜色逻辑已移至 template 中的 span class，这里主要用于整列的特殊样式如果需要的话
    // 为了保持兼容性，保留部分逻辑
    if (column.property === 'directionDisplay') {
         if (row.direction === 'Buy') return 'cell-buy';
         if (row.direction === 'Sell') return 'cell-sell';
         if (row.direction === 'Dividend') return 'cell-dividend';
    }
    return '';
}

onMounted(loadTransactions);
</script>

<style scoped>
/* 容器样式 */
.page-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0 20px 20px 20px; /* 给一点边距 */
  box-sizing: border-box;
}

.header-area {
  flex-shrink: 0;
  margin-bottom: 20px;
}

.page-header-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 15px 0;
  color: #1d1d1f;
}

.input-card {
  /* 使用全局 style.css 中的 Apple 风格卡片样式 */
  padding: 10px 0;
}

.transaction-form .el-form-item {
  margin-bottom: 0;
  margin-right: 12px;
}

.content-area {
  flex: 1;
  overflow: hidden; /* 确保表格在内部滚动 */
  display: flex;
  flex-direction: column;
  background-color: rgba(255, 255, 255, 0.5); /* 微弱的背景 */
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.03);
}

.table-toolbar {
  margin-bottom: 10px;
  padding-left: 5px;
}

.footer-area {
  flex-shrink: 0;
  margin-top: 15px;
  display: flex;
  justify-content: center;
}

/* 文本颜色工具类 */
.text-red { color: #ff3b30; font-weight: 500; }
.text-green { color: #34c759; font-weight: 500; }

:deep(.cell-buy .cell) { color: #34c759; font-weight: 600; }
:deep(.cell-sell .cell) { color: #ff3b30; font-weight: 600; }
:deep(.cell-dividend .cell) { color: #007aff; font-weight: 600; }
:deep(.dividend-row) { background-color: rgba(0, 122, 255, 0.03); }

</style>