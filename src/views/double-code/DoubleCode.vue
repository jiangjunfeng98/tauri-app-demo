<template>
  <div class="action-div" v-loading="loading" element-loading-text="正在下载，请稍后">
    <p>已选文件：{{ filePath }}</p>
    <el-button type="primary" @click="selectFile" :icon="DocumentAdd">选择文件</el-button>
    <el-button type="warning" :disabled="!filePath" @click="readeExcel" :icon="Reading">解析文件</el-button>
    <el-button type="success" :disabled="!filePath" @click="downloadPng" :icon="Download">下载文件</el-button>
    <div style="margin-top: 10px; color: #E6A23C;">
      图片保存地址目录:
      <i>下载</i>
    </div>
  </div>
  <div v-if="loading">
    <el-button type="danger" :disabled="!filePath" @click="cancelDownloadPng" :icon="Stopwatch">取消下载</el-button>
  </div>
  <el-table
    :data="tableData"
    stripe
    style="width: 100%"
    height="calc(90vh - 110px)"
    :row-class-name="tableRowClassName"
  >
    <el-table-column type="index" width="50" />
    <el-table-column prop="user" label="提交人" width="180" />
    <el-table-column prop="no" label="工号" width="180" />
    <el-table-column prop="dept" label="部门" />
    <el-table-column prop="travelCode" label="行程码" />
    <el-table-column prop="healthCode" label="健康码" />
    <el-table-column label="状态" width="120">
      <template #default="scope">
        <el-icon :size="14" v-show="scope.row.state === 0">
          <semi-select />
        </el-icon>
        <el-icon :size="18" v-show="scope.row.state === 1" class="is-loading">
          <loading />
        </el-icon>
        <el-icon :size="20" v-show="scope.row.state === 2" color="#67C23A">
          <Check />
        </el-icon>
        <el-icon :size="20" v-show="scope.row.state === -1" color="#F56C6C">
          <Close />
        </el-icon>
      </template>
    </el-table-column>
  </el-table>
  <div class="error" v-show="downloadErrors.length">
    <div>下载失败信息：</div>
    <ul>
      <li v-for="(error, index) in downloadErrors" :key="index">{{ error }}</li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { DocumentAdd, Reading, Download, Loading, Check, SemiSelect, Close, Stopwatch } from '@element-plus/icons-vue'
import useCode from './useCode';

const { filePath, selectFile, readeExcel, tableData, downloadPng, tableRowClassName, loading, cancelDownloadPng, downloadErrors } = useCode()
</script>

<style lang="scss" scoped>
.action-div {
  height: 110px;
}
.error {
  color: #f56c6c;
}
</style>

<style lang="scss">
.warning-row {
  background-color: #f56c6c !important;
  .el-table__cell {
    background-color: #f56c6c !important;
  }
}
</style>