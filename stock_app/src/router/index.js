import { createRouter, createWebHistory } from 'vue-router'
import TransactionList from '../views/TransactionList.vue'
import MemoPad from '../views/MemoPad.vue'

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
  // 未来可以在这里轻松添加 { path: '/charts', ... }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router