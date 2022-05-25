/**
 * CountUp 选项
 */
interface CountUpOptions{
  /**
   * 持续时长
   */
  time: number;
  /**
   * 最终显示的数字
   */
  num: number;
  /**
   * 调节速度
   */
  regulator: number;
  /**
   * 可选，小数位数
   * @default 0
   */
  bit?: number
}

/**
 * pear 数字滚动组件
 */
interface Count {

  /**
   * Count Up
   * @param targetEle 绑定的元素，只支持 ID
   * @param options 选项
   */
  up(targetEle: HTMLElement, options: CountUpOptions)
}