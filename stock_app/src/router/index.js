import { createRouter, createWebHistory } from 'vue-router'
import TransactionList from '../views/TransactionList.vue'
import MemoPad from '../views/MemoPad.vue'
import AnalysisDashboard from '../views/AnalysisDashboard.vue' // 1. 引入组件

const routes = [
  {
    path: '/',
    name: 'Transactions',
    component: TransactionList
  },
  {
    path: '/memos',
    name: 'Memos',
    component: MemoPad
  },
  {
    path: '/analysis',  // 2. 添加路由
    name: 'Analysis',
    component: AnalysisDashboard
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router