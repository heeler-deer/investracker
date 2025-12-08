<template>
  <div class="page-container">
    <div class="header-area">
      <div class="header-title-row">
        <h1 class="page-header-title">交易记录</h1>
      </div>

      <el-card shadow="never" class="input-card apple-card">
        <el-form :model="newTransaction" label-position="top" class="transaction-form" @submit.prevent="handleAddTransaction">
          
          <el-row :gutter="20">
            <el-col :span="8" :xs="24">
              <el-form-item label="名称">
                <el-input v-model="newTransaction.stockName" placeholder="股票/基金名称" class="apple-input" required />
              </el-form-item>
            </el-col>
            <el-col :span="8" :xs="12">
              <el-form-item label="方向">
                <el-select v-model="newTransaction.direction" placeholder="选择" class="apple-select" required style="width: 100%">
                  <el-option label="买入" value="Buy" />
                  <el-option label="卖出" value="Sell" />
                  <el-option label="分红" value="Dividend" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8" :xs="12">
              <el-form-item label="日期">
                <el-date-picker 
                  v-model="newTransaction.date" 
                  type="date" 
                  value-format="YYYY-MM-DD" 
                  placeholder="选择日期"
                  class="apple-input"
                  style="width: 100%"
                  required 
                />
              </el-form-item>
            </el-col>

            <template v-if="newTransaction.direction !== 'Dividend'">
              <el-col :span="8" :xs="12">
                <el-form-item label="类别">
                  <el-select v-model="newTransaction.category" placeholder="类别" class="apple-select" required style="width: 100%">
                    <el-option label="股票" value="Stock" />
                    <el-option label="基金" value="Fund" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="12">
                <el-form-item label="行业">
                  <el-input v-model="newTransaction.industry" placeholder="可选" class="apple-input"/>
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="24">
                <el-form-item :label="newTransaction.category === 'Stock' ? '股数' : '份额'">
                  <el-input-number 
                    v-model="newTransaction.volume" 
                    :min="0" :precision="4" :controls="false"
                    placeholder="0.0000" class="apple-input-number" style="width: 100%" required
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="12">
                <el-form-item :label="newTransaction.category === 'Stock' ? '单价' : '净值'">
                  <el-input-number 
                    v-model="newTransaction.price" 
                    :min="0" :precision="6" :step="0.001" :controls="false"
                    placeholder="0.000000" class="apple-input-number" style="width: 100%" required
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8" :xs="12">
                <el-form-item label="手续费">
                  <el-input-number 
                    v-model="newTransaction.fee" 
                    :min="0" :precision="2" :step="0.1" :controls="false"
                    placeholder="0.00" class="apple-input-number" style="width: 100%" required
                  />
                </el-form-item>
              </el-col>
            </template>

            <template v-else>
               <el-col :span="8" :xs="24">
                <el-form-item label="分红金额">
                  <el-input-number 
                    v-model="newTransaction.dividendAmount" 
                    :min="0" :precision="2" :controls="false"
                    placeholder="0.00"
                    class="apple-input-number" style="width: 100%" required 
                  />
                </el-form-item>
              </el-col>
            </template>

            <el-col :span="8" :xs="24" style="display: flex; align-items: flex-end;">
              <el-form-item style="width: 100%;">
                <el-button type="primary" native-type="submit" class="apple-btn-submit" style="width: 100%;">
                  <el-icon style="margin-right: 6px"><Plus /></el-icon>
                  添加记录
                </el-button>
              </el-form-item>
            </el-col>

          </el-row>
        </el-form>
      </el-card>
    </div>

    <div class="content-area apple-content-card">
      
      <div class="table-toolbar">
        <div class="toolbar-left">
          <span class="table-title">历史明细</span>
          <el-button @click="showFilters = !showFilters" :type="showFilters ? 'primary' : 'default'" link class="filter-toggle-btn">
            <el-icon style="margin-right: 4px"><Filter /></el-icon>
            筛选
          </el-button>
        </div>

        <el-button 
          v-if="selectedRows.length > 0"
          type="danger" plain size="small" 
          @click="handleDeleteSelected" 
          class="apple-btn-danger"
        >
          <el-icon style="margin-right: 4px"><Delete /></el-icon>
          删除选中 ({{ selectedRows.length }})
        </el-button>
      </div>

      <el-collapse-transition>
        <div v-if="showFilters" class="filter-panel">
          <el-row :gutter="15">
            <el-col :span="6" :xs="12">
              <div class="filter-item">
                <span class="filter-label">名称查找</span>
                <el-input v-model="filters.name" placeholder="支持模糊搜索" clearable size="small" class="apple-input"/>
              </div>
            </el-col>
            <el-col :span="4" :xs="12">
              <div class="filter-item">
                <span class="filter-label">方向</span>
                <el-select v-model="filters.direction" placeholder="全部" clearable size="small" class="apple-select">
                  <el-option label="买入" value="Buy" />
                  <el-option label="卖出" value="Sell" />
                  <el-option label="分红" value="Dividend" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="4" :xs="12">
              <div class="filter-item">
                <span class="filter-label">类别</span>
                <el-select v-model="filters.category" placeholder="全部" clearable size="small" class="apple-select">
                  <el-option label="股票" value="Stock" />
                  <el-option label="基金" value="Fund" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="10" :xs="24">
              <div class="filter-item">
                <span class="filter-label">日期范围</span>
                <el-date-picker
                  v-model="filters.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始"
                  end-placeholder="结束"
                  value-format="YYYY-MM-DD"
                  size="small"
                  class="apple-input"
                  style="width: 100%"
                />
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="15" style="margin-top: 10px;">
             <el-col :span="10" :xs="24">
               <div class="filter-item">
                 <span class="filter-label">净现金流范围</span>
                 <div style="display: flex; align-items: center;">
                    <el-input-number v-model="filters.cashFlowMin" :controls="false" placeholder="最小值" size="small" class="apple-input-number" style="flex:1"/>
                    <span style="margin: 0 8px; color: #888;">-</span>
                    <el-input-number v-model="filters.cashFlowMax" :controls="false" placeholder="最大值" size="small" class="apple-input-number" style="flex:1"/>
                 </div>
               </div>
             </el-col>
             <el-col :span="14" :xs="24" style="display: flex; align-items: flex-end; justify-content: flex-end;">
               <el-button link type="primary" size="small" @click="resetFilters">重置条件</el-button>
             </el-col>
          </el-row>
        </div>
      </el-collapse-transition>
      
      <div v-if="activeFilterTags.length > 0" class="active-filters-bar">
        <span class="active-label">过滤条件:</span>
        <el-tag 
          v-for="tag in activeFilterTags" 
          :key="tag.key" 
          closable 
          size="small" 
          type="info"
          @close="removeFilter(tag.key)"
          style="margin-right: 8px;"
        >
          {{ tag.label }}
        </el-tag>
      </div>

      <el-table 
        :data="pagedTransactions" 
        :row-class-name="tableRowClassName" 
        style="width: 100%;" 
        height="100%"
        @selection-change="handleSelectionChange"
        class="apple-table"
      >
        <el-table-column type="selection" width="45" fixed />
        <el-table-column prop="stock_name" label="名称" fixed width="140" show-overflow-tooltip>
           <template #default="scope">
             <span style="font-weight: 600; color: #1d1d1f;">{{ scope.row.stock_name }}</span>
           </template>
        </el-table-column>
        <el-table-column prop="directionDisplay" label="方向" width="80" align="center">
          <template #default="scope">
            <el-tag :type="getDirectionTagType(scope.row.direction)" effect="light" round size="small">
              {{ scope.row.directionDisplay }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="transaction_date" label="日期" width="110" sortable>
          <template #default="scope">
            <span style="color: #86868b; font-size: 13px;">{{ formatDate(scope.row.transaction_date) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="categoryDisplay" label="类别" width="80" align="center"/>
        
        <el-table-column prop="volume" label="数量" align="right" width="120">
          <template #default="scope">
            {{ scope.row.direction !== 'Dividend' ? formatNumber(scope.row.volume, 4) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价/净值" align="right" width="120">
          <template #default="scope">
             {{ scope.row.direction !== 'Dividend' ? formatNumber(scope.row.price, 4) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="fee" label="费用" align="right" width="90">
          <template #default="scope">
             <span style="color: #86868b;">{{ formatNumber(scope.row.fee) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="netCashFlow" label="净现金流" align="right" width="130" sortable>
          <template #default="scope">
            <span :class="getAmountClass(scope.row.netCashFlow)" style="font-family: monospace; font-size: 14px;">
              {{ formatCurrency(scope.row.netCashFlow) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="cumulativeShares" label="持仓" align="right" width="110">
          <template #default="scope">
            {{ formatNumber(scope.row.cumulativeShares, 4) }}
          </template>
        </el-table-column>
        <el-table-column prop="avgCost" label="持仓均价" align="right" width="110">
          <template #default="scope">
            {{ formatNumber(scope.row.avgCost, 4) }}
          </template>
        </el-table-column>
        <el-table-column prop="realizedPL" label="平仓收益" align="right" width="110">
          <template #default="scope">
            <span :class="getAmountClass(scope.row.realizedPL)">{{ formatCurrency(scope.row.realizedPL) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="footer-area">
      <el-pagination 
        v-model:current-page="currentPage" 
        v-model:page-size="pageSize" 
        :page-sizes="[10, 20, 50, 100]"
        :total="totalTransactions" 
        layout="total, sizes, prev, pager, next" 
        background 
        class="apple-pagination"
      />
    </div>

  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Filter } from '@element-plus/icons-vue' 

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

// ⭐️ 筛选相关状态
const showFilters = ref(false);
const filters = reactive({
  name: '',
  direction: '',
  category: '',
  dateRange: null,
  cashFlowMin: null,
  cashFlowMax: null
});

// --- 核心逻辑 (Computed Properties) ---

// 1. 先计算完整的持仓状态 (保证数据准确性)
const processedTransactions = computed(() => {
  const portfolio = {}; 

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
  return calculated.reverse(); // 最新在最前
});

// 2. ⭐️ 应用筛选逻辑 (Advanced Filtering)
const filteredTransactions = computed(() => {
  return processedTransactions.value.filter(item => {
    // 名称模糊搜索
    if (filters.name && !item.stock_name.toLowerCase().includes(filters.name.toLowerCase())) {
      return false;
    }
    // 方向精确匹配
    if (filters.direction && item.direction !== filters.direction) {
      return false;
    }
    // 类别精确匹配
    if (filters.category && item.category !== filters.category) {
      return false;
    }
    // 日期范围
    if (filters.dateRange && filters.dateRange.length === 2) {
      const date = item.transaction_date.split('T')[0];
      if (date < filters.dateRange[0] || date > filters.dateRange[1]) {
        return false;
      }
    }
    // 净现金流范围
    if (filters.cashFlowMin !== null && item.netCashFlow < filters.cashFlowMin) return false;
    if (filters.cashFlowMax !== null && item.netCashFlow > filters.cashFlowMax) return false;

    return true;
  });
});

// 3. 计算分页
const pagedTransactions = computed(() => {
  const startIndex = (currentPage.value - 1) * pageSize.value;
  const endIndex = startIndex + pageSize.value;
  return filteredTransactions.value.slice(startIndex, endIndex);
});

const totalTransactions = computed(() => filteredTransactions.value.length);

// 4. ⭐️ 生成当前激活的筛选标签
const activeFilterTags = computed(() => {
  const tags = [];
  if (filters.name) tags.push({ key: 'name', label: `名称: ${filters.name}` });
  if (filters.direction) tags.push({ key: 'direction', label: `方向: ${filters.direction === 'Buy' ? '买入' : (filters.direction === 'Sell' ? '卖出' : '分红')}` });
  if (filters.category) tags.push({ key: 'category', label: `类别: ${filters.category === 'Stock' ? '股票' : '基金'}` });
  if (filters.dateRange) tags.push({ key: 'dateRange', label: `日期: ${filters.dateRange[0]} 至 ${filters.dateRange[1]}` });
  if (filters.cashFlowMin !== null || filters.cashFlowMax !== null) {
    const min = filters.cashFlowMin !== null ? filters.cashFlowMin : '-∞';
    const max = filters.cashFlowMax !== null ? filters.cashFlowMax : '+∞';
    tags.push({ key: 'cashFlow', label: `现金流: ${min} ~ ${max}` });
  }
  return tags;
});


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
      ElMessage.success('交易添加成功');
      newTransaction.value = getInitialFormState();
      await loadTransactions();
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
    if (error !== 'cancel') ElMessage.error('删除失败');
  }
}

function removeFilter(key) {
  if (key === 'name') filters.name = '';
  if (key === 'direction') filters.direction = '';
  if (key === 'category') filters.category = '';
  if (key === 'dateRange') filters.dateRange = null;
  if (key === 'cashFlow') { filters.cashFlowMin = null; filters.cashFlowMax = null; }
}

function resetFilters() {
  filters.name = '';
  filters.direction = '';
  filters.category = '';
  filters.dateRange = null;
  filters.cashFlowMin = null;
  filters.cashFlowMax = null;
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
function formatDate(value) {
  if (typeof value !== 'string' || !value.includes('T')) return value; 
  return value.split('T')[0];
}
// ⭐️ 颜色逻辑：正数为红，负数为绿
function getAmountClass(value) {
    if (value > 0) return 'text-red';
    if (value < 0) return 'text-green';
    return '';
}
function getDirectionTagType(direction) {
  if (direction === 'Buy') return 'success';
  if (direction === 'Sell') return 'danger';
  return 'primary';
}
function tableRowClassName({ row }) {
  if (row.direction === 'Dividend') return 'dividend-row';
  return '';
}

onMounted(loadTransactions);
</script>

<style scoped>
/* 使用 scoped 样式定义红绿颜色 */
.text-red { color: #ff3b30; font-weight: 500; }
.text-green { color: #34c759; font-weight: 500; }

.active-filters-bar {
  padding: 8px 20px;
  background-color: #f9f9fc;
  border-bottom: 1px solid rgba(0,0,0,0.03);
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}
.active-label {
  font-size: 13px;
  color: #86868b;
  margin-right: 10px;
}
</style>