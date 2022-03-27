import { onMounted, ref } from 'vue';
import { read, utils, WorkSheet } from "xlsx";
import dayjs from 'dayjs'
import { createDir, readBinaryFile, writeBinaryFile } from '@tauri-apps/api/fs';
import { dialog, http, path } from '@tauri-apps/api';
import { ResponseType } from '@tauri-apps/api/http';

type ISheetRow = any[];

type IRow = {
  user: string;
  no: string;
  dept: string;
  travelCode: string;
  healthCode: string;
  state: -1 | 0 | 1 | 2
};

const useCode = () => {
  // excel文件路径
  const filePath = ref<string>('')
  // 下载目录
  const downloadDir = ref<string>('')

  const tableData = ref<IRow[]>([])
  const errRow = ref<number[]>([])
  const loading = ref<boolean>(false)
  // 取消下载标识
  const cancel = ref<boolean>(false)
  // 下载失败提示信息
  const downloadErrors = ref<string[]>([])

  /**
   * 文件选择
   */
  const selectFile = () => {
    dialog.open({ filters: [{ name: 'excel', extensions: ['xlsx'] }] }).then(res => {
      if (!(res as string).endsWith('.xlsx')) {
        dialog.confirm('文件类型错误');
        return;
      }
      filePath.value = res as string
    });
  }

  /**
   * 解析图片真实url
   * @param path 
   * @returns 
   */
  const getUrl = (path: string, index: number): string => {
    let url: string = '';
    if (!path || !(path || '').includes('https')) {
      errRow.value.push(index);
    } else if (path.includes(',https')) {
      url = path.split(',https')[0]
    } else {
      url = path || ''
    }
    return url
  }

  /**
   * 读取文件内容
   */
  const readeExcel = async () => {
    if (!filePath.value) return;
    errRow.value = [];
    downloadErrors.value = [];
    const data = read(await readBinaryFile(filePath.value));

    const rows = getRowsCols(data.Sheets, data.SheetNames[0]);

    if (rows[0][0] !== '提交人') {
      dialog.message('表格格式有误');
      return
    }
    const result = rows.slice(1, rows.length)

    tableData.value = result.map((item, index) => {
      return { user: item[0], no: item[2], dept: item[3], travelCode: getUrl(item[8], index), healthCode: getUrl(item[9], index), state: 0 }
    })
  }

  /**
   * 读取表格内容并转为json
   * @param data 
   * @param sheetName 
   * @returns 
   */
  const getRowsCols = (data: WorkSheet, sheetName: string) => {
    const rows: ISheetRow[] = utils.sheet_to_json(data[sheetName], { header: 1 });
    return rows;
  }

  /**
   * 
   * @param param0 解析失败标记
   * @returns 
   */
  const tableRowClassName = ({ row }: { row: IRow }) => {
    return (!row.healthCode || !row.travelCode) ? 'warning-row' : ''
  }

  /**
   * 根据路径下载图片
   */
  const downloadPng = async () => {
    try {
      // 创建目录
      await createDir(downloadDir.value)
    } catch {
      dialog.message(`文件存在请先删除: ${downloadDir.value}`);
      return
    }
    cancel.value = false
    loading.value = true
    let promiseList = []
    for (let i = 0; i < tableData.value.length; i++) {
      if (cancel.value) {
        // 停止下载
        cancel.value = false
        break
      }
      const item = tableData.value[i]
      tableData.value[i].state = 1;
      if (item.travelCode) {
        promiseList.push(downloadPic(item.travelCode, `${item.user}(${item.no})行程码`, i))
      }
      if (item.healthCode) {
        promiseList.push(downloadPic(item.healthCode, `${item.user}(${item.no})健康码`, i))
      }
      if (i != 0 && i % 3 === 0) {
        await Promise.allSettled(promiseList);
      }
    }
    loading.value = false
  }

  /**
   * 下载保存文件
   * @param url 
   * @param name 
   * @param index 
   */
  const downloadPic = async (url: string, name: string, index: number) => {
    const suffix = url.split('.')[url.split('.').length - 1];
    const path = `${downloadDir.value}${name}.${suffix}`
    console.log(index, url);

    try {
      const res = await http.fetch(url, { method: 'GET', responseType: ResponseType.Binary });
      if (tableData.value[index].state != -1 && tableData.value[index].state == 1) {
        tableData.value[index].state = 2;
      }
      writeBinaryFile({ contents: res.data as any, path: path })
    } catch {
      tableData.value[index].state = -1;
      downloadErrors.value.push(`${index + 1}行 ${name}下载失败`)
    }
  }

  const cancelDownloadPng = () => {
    cancel.value = true
  }

  onMounted(async () => {
    // 获取下载路径
    const downloadPath = await path.downloadDir();
    // 默认目录
    const dirName = `${dayjs().format('YYYY-MM-DD')}两码情况/`
    // 拼接完整路径
    downloadDir.value = `${downloadPath}${dirName}`;
  })

  return {
    filePath,
    selectFile,
    readeExcel,
    tableData,
    downloadPng,
    tableRowClassName,
    loading,
    cancelDownloadPng,
    downloadErrors
  }
}

export default useCode;