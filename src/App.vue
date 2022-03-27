<template>
  <el-config-provider :locale="zhCn">
    <DoubleCode />
  </el-config-provider>
</template>
<script setup lang="ts">
import zhCn from 'element-plus/lib/locale/lang/zh-cn'
import DoubleCode from './views/double-code/DoubleCode.vue'
</script>

