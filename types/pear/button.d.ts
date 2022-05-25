/**
 * pear 按钮参数
 */
interface ButtonLoadOptions {
  /**
   * 元素选择器或 Css 选择器 
   * @example
   * elem: '#userBtn'
   */
  elem: string | HTMLElement;
  /**
   * 可选，规定加载时间，单位 ms 
   * @example
   * time: 500
   */
  time?: number;
  /**
   * 可选，加载完成时的回调函数
   */
  done?:() => void;
}

/**
 * pear 加载按钮组件
 */
interface Button {
  /**
   * 加载按钮
   * @param [option] 加载按钮参数
   */
  load(option: ButtonLoadOptions): Button;

  /**
   * 停止加载
   * @param [callback] 可选，停止加载时的回调函数
   */
  stop(callback?: () => void): void;
}
