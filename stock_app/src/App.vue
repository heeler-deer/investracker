<template>
  <el-container class="main-layout">
    <el-aside width="240px" class="sidebar-menu">
      <div class="sidebar-title">InvesTracker</div>
      
      <router-link to="/" class="nav-item">
        <el-icon class="nav-icon"><List /></el-icon>
        <span>交易记录</span>
      </router-link>
      
      <router-link to="/analysis" class="nav-item">
        <el-icon class="nav-icon"><PieChart /></el-icon>
        <span>数据分析</span>
      </router-link>

      <router-link to="/memos" class="nav-item">
        <el-icon class="nav-icon"><Notebook /></el-icon>
        <span>投资笔记</span>
      </router-link>

      </el-aside>

    <el-main style="padding: 0;">
      <router-view v-slot="{Component}">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </el-main>
  </el-container>
</template>

<style scoped>
.main-layout {
  height: 100vh;
  display: flex;
}
/* 简单的淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>