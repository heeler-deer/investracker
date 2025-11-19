<template>
  <div class="page-container">
    <h1 class="page-header-title">投资笔记</h1>

    <el-row :gutter="20" style="height: calc(100% - 80px);">
      <el-col :span="8">
        <el-card class="memo-editor-card" style="height: 100%; display: flex; flex-direction: column;">
          <template #header>
            <div class="card-header">
              <span>新笔记</span>
              <el-button type="primary" size="small" @click="saveMemo" :loading="loading">保存</el-button>
            </div>
          </template>
          
          <el-date-picker
            v-model="newMemo.date"
            type="date"
            placeholder="选择日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 100%; margin-bottom: 15px;"
          />
          
          <el-input
            v-model="newMemo.content"
            type="textarea"
            :rows="15"
            placeholder="记录今天的市场感悟、策略分析..."
            resize="none"
            style="flex: 1;"
          />
        </el-card>
      </el-col>

      <el-col :span="16" style="height: 100%; overflow-y: auto;">
        <div v-if="memos.length === 0" class="empty-state">
          暂无笔记
        </div>
        
        <div v-for="memo in memos" :key="memo.id" class="memo-item">
          <el-card shadow="hover">
            <div class="memo-header">
              <span class="memo-date">{{ formatDate(memo.memo_date) }}</span>
              <el-button type="danger" link icon="Delete" @click="deleteMemo(memo.id)"></el-button>
            </div>
            <div class="memo-content">
              {{ memo.content }}
            </div>
          </el-card>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

const API_URL = 'http://localhost:3000/api/memos';
const memos = ref([]);
const loading = ref(false);
const newMemo = ref({
  date: new Date().toISOString().split('T')[0],
  content: ''
});

const loadMemos = async () => {
  try {
    const res = await axios.get(API_URL);
    memos.value = res.data;
  } catch (e) {
    ElMessage.error('加载笔记失败');
  }
};

const saveMemo = async () => {
  if (!newMemo.value.content) return ElMessage.warning('写点什么吧');
  loading.value = true;
  try {
    await axios.post(API_URL, newMemo.value);
    ElMessage.success('笔记已保存');
    newMemo.value.content = ''; // 清空内容，保留日期
    await loadMemos();
  } catch (e) {
    ElMessage.error('保存失败');
  } finally {
    loading.value = false;
  }
};

const deleteMemo = async (id) => {
  try {
    await ElMessageBox.confirm('确定删除这条笔记吗？', '提示', { type: 'warning' });
    await axios.delete(`${API_URL}/${id}`);
    ElMessage.success('已删除');
    await loadMemos();
  } catch (e) {
    // cancel
  }
};

function formatDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
}

onMounted(loadMemos);
</script>

<style scoped>
.memo-item {
  margin-bottom: 15px;
}
.memo-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}
.memo-date {
  font-weight: bold;
  color: #86868b;
}
.memo-content {
  white-space: pre-wrap; /* 保留换行 */
  line-height: 1.6;
  color: #1d1d1f;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.empty-state {
  text-align: center;
  color: #999;
  margin-top: 50px;
}
</style>