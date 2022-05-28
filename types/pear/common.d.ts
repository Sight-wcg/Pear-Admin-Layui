/**
 * pear 公共组件
 */
interface Common {
  /**
   * 获取表格选中字段
   * @param obj 表格回调参数
   * @param field 要获取的字段
   */
  checkField(obj: object, field: string): string;

  /**
   * 当前是否为移动端
   */
  isModile(): boolean;


  /**
   *  提交 json 数据
   * @param data 提交数据
   * @param href 提交接口
   * @param table 刷新父级表
   * @param callback 请求成功回调
   */
  submit(data: object, href: string, table: any, callback: (result: object) => void)
}
