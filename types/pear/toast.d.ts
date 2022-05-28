// Type definitions for IziToast
// Project https://github.com/dolce/iziToast
// Author: Tarık İNCE <incetarik@hotmail.com>
//         Marcelo Dolce <dolcemarcelo@gmail.com>
//         ZSkycat <https://github.com/ZSkycat>
//         Sight
// Definitions: https://github.com/DefinitelyTyped/DefinitelyTyped

/**
 * 显示位置
 * | 属性         | 说明     |
 * | :------------ | -------- |
 * | bottomRight  | 右下角   |
 * | bottomLeft   | 左下角   |
 * | topRight     | 右上角   |
 * | topLeft      | 左上角   |
 * | topCenter    | 顶部中间 |
 * | bottomCenter | 底部中间 |
 * | center       | 正中间   |
 */
type IziToastPosition = 'bottomRight' | 'bottomLeft' | 'topRight' | 'topLeft' | 'topCenter' | 'bottomCenter' | 'center';
/**
 * 进场动画
| 属性          | 说明     |
| :------------ | -------- |
| bounceInLeft  | 向左反弹 |
| bounceInRight | 向右反弹 |
| bounceInUp    | 向上反弹 |
| bounceInDown  | 向下反弹 |
| fadeIn        | 淡入     |
| fadeInDown    | 向下淡入 |
| fadeInUp      | 向上淡入 |
| fadeInLeft    | 向左淡入 |
| fadeInRight   | 向右淡入 |
| flipInX       | 翻转进入 |
 */
type IziToastTransitionIn = 'bounceInLeft' | 'bounceInRight' | 'bounceInUp' | 'bounceInDown' | 'fadeIn' | 'fadeInDown' | 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'flipInX';
/**
 * 出场动画
| 属性         | 说明     |
| :------------ | :------- |
| fadeOut      | 淡出     |
| fadeOutUp    | 向上淡出 |
| fadeOutDown  | 向下淡出 |
| fadeOutLeft  | 向左淡出 |
| fadeOutRight | 向右淡出 |
| flipOutX     | 翻转退出 |
 */
type IziToastTransitionOut = 'fadeOut' | 'fadeOutUp' | 'fadeOutDown' | 'fadeOutLeft' | 'fadeOutRight' | 'flipOutX';

/**
 * toast 设置选项
 */
interface IziToastSettings {
  /**
   * toast 的 ID
   */
  id?: string;
  /**
   * 自定义 Class, 多个用空格分隔
   */
  class?: string;
  /**
   * toast.的标题
   */
  title?: string;
  /**
   * 标题颜色
   */
  titleColor?: string;
  /**
   * 标题字体大小
   */
  titleSize?: string;
  /**
   * 标题行高
   */
  titleLineHeight?: string;
  /**
   * 通知内容.
   */
  message?: string;
  /**
   * 消息颜色
   */
  messageColor?: string;
  /**
   * 消息字体大小
   */
  messageSize?: string;
  /**
   * 消息行高
   */
  messageLineHeight?: string;
  /**
   * 背景颜色
   */
  backgroundColor?: string;
  /**
   * 默认主题支持 light 和 dark，也可以自定义类别。自定义主题创建和使用 ".iziToast-theme-name"
   * @default 'light'
   */
  theme?: string;
  /**
   * 支持#十六进制的预定义主题，例如 blue, red, green and yellow，也可以自定义类别 “.iziToast-color-name”
   */
  color?: string;
  /**
   * 图标类
   */
  icon?: string;
  /**
   * 图标文本
   */
  iconText?: string;
  /**
   * 图标颜色
   */
  iconColor?: string;
  /**
   * 图标地址
   */
  iconUrl?: string;
  /**
   * 显示图片
   */
  image?: string;
  /**
   * 图片宽度
   * @default 50
   */
  imageWidth?: number;
  /**
   * 最大宽度
   */
  maxWidth?: number;
  /**
   * 设置 z-index
   * @default 99999
   */
  zindex?: number;
  /**
   * 1 或 2，也可以自定义 “.iziToast-layout3”
   * 1 标题和内容并排，2 两排显示
   * @default 1
   */
  layout?: number;
  /**
   * 气泡效果
   * @default false
   */
  balloon?: boolean;
  /**
   * 是否显示关闭按钮
   * @default true
   */
  close?: boolean;
  /**
   * 允许使用 Esc 键关闭 toast
   * @default false
   */
  closeOnEscape?: boolean;
  /**
   * 允许通过单击自身关闭 toast
   * @default false
   */
  closeOnClick?: boolean;
  /**
   * 布局方向，false内容居左，true居右
   * @default false
   */
  rtl?: boolean;
  /**
   * 显示位置
   * @default 'bottomRight'
   */
  position?: IziToastPosition;
  /**
   * Fixed place where you want to show the toasts.
   */
  target?: string;
  /**
   * 插入方式，true从上插入，false下插入
   * @default true
   */
  targetFirst?: boolean;
  /**
   * 显示模式
   * 0无限制，1 同类型存在不显示，2 同类型存在先移除
   * @default 0
   */
  displayMode?: number | boolean;
  /**
   * 关闭时间，以毫秒为单位或设置 false 禁用
   * Default value: 5000
   */
  timeout?: boolean | number;
  /**
   * 滑动关闭
   * @default true
   */
  drag?: boolean;
  /**
   * 鼠标滑过暂停消失时间
   * @default true
   */
  pauseOnHover?: boolean;
  /**
   * 鼠标滑过重置消失时间
   * @default false
   */
  resetOnHover?: boolean;
  /**
   * 进度条
   * @default true
   */
  progressBar?: boolean;
  /**
   * 进度条颜色
   */
  progressBarColor?: string;
  /**
   * 进度条动画
   * @default 'linear'
   */
  progressBarEasing?: string;
  /**
   * 启用在页面上显示遮罩层。
   * @default false
   */
  overlay?: boolean;
  /**
   * 允许单击遮罩层关闭 toast
   * @default false
   */
  overlayClose?: boolean;
  /**
   * 遮罩层颜色。
   * @default rgba(0, 0, 0, 0.6)
   */
  overlayColor?: string;
  /**
   * 文字动画效果
   * @default true
   */
  animateInside?: boolean;
  /**
   * 显示按钮
   * 第一个参数是 HTML 字符串，第二个参数是点击事件回调，
   * 最后一个参数定义是否有焦点
   */
  buttons?: ([string, (instance: IziToast, toast: HTMLDivElement, button: HTMLButtonElement, event: MouseEvent, inputs: Array<HTMLInputElement>) => void, boolean])[];
  /**
   * 显示输入框
   * 第一个参数是 HTML 字符串，第二个参数是事件类型和事件回调
   * 最后一个参数定义是否有焦点
   */
  inputs?: ([string, string, (instance: IziToast, toast: HTMLDivElement, input: HTMLInputElement, event: Event) => void, boolean])[];
  /**
   * 进场动画
   * @default  'fadeInUp'
   */
  transitionIn?: IziToastTransitionIn;
  /**
   * 出场动画
   * @default 'fadeOut'
   */
  transitionOut?: IziToastTransitionOut;
  /**
   * 进场移动过度效果
   * @default 'fadeInUp'
   */
  transitionInMobile?: IziToastTransitionIn;
  /**
   * 出场移动过度效果
   * @default 'fadeOutDown'
   */
  transitionOutMobile?: IziToastTransitionOut;
  /**
   * 打开 toast 时触发的回调函数。
   * @param settings toast 设置选项
   * @param toast Toast DOM 元素
   */
  onOpening?: (settings: IziToastSettings, toast: HTMLDivElement) => void;
  /**
   * 打开 toast 后触发的回调函数。
   * @param settings toast 设置选项
   * @param toast Toast DOM 元素
   */
  onOpened?: (settings: IziToastSettings, toast: HTMLDivElement) => void;
  /**
   * 关闭 toast 时触发的回调函数。
   * @param settings toast 设置选项
   * @param toast Toast DOM 元素
   * @param closedBy Closed by info set by hide method.
   */
  onClosing?: (settings: IziToastSettings, toast: HTMLDivElement, closedBy: string) => void;
  /**
   * 关闭 toast 后触发的回调函数。
   * @param settings toast 设置选项
   * @param toast Toast DOM 元素
   * @param closedBy Closed by info set by hide method. (default: drag | timeout | button | overlay | esc | toast)
   */
  onClosed?: (settings: IziToastSettings, toast: HTMLDivElement, closedBy: string) => void;
}

/**
 * 进度条方法
 */
interface IziToastProgress {
  /**
   * 暂停
   */
  pause(): void;
  /**
   * 重置
   */
  reset(): void;
  /**
   * 继续
   */
  resume(): void;
  /**
   * 开始
   */
  start(): void;
}

/**
 * 消息通知,基于 IziToast
 */
interface IziToast {
  /**
  * 统一设置 toast 默认值.
  * @param settings 要设置的值
  */
  settings(settings: IziToastSettings): void;
  /**
  * 销毁全部 toasts
  */
  destroy(): void;
  /**
  * 打开一个 toast
  * @returns 如果 toast 无法打开，则返回 false
  */
  show(settings: IziToastSettings): void | boolean;
  /**
   * 关闭指定的 toast.
   * @param settings toast 设置选项
   * @param toast 要隐藏的 Toast 元素或选择器。
   * @param closedBy Custom closed by info to use in other functions.
   */
  hide(settings: IziToastSettings, toast: HTMLDivElement | string, closedBy?: string): void;
  /**
   * 控制进度条时间
   * @param settings toast 设置选项
   * @param toast Toast element
   * @param callback 调用 IziToastProgress 时触发的回调函数
   */
  progress(settings: IziToastSettings, toast: HTMLDivElement, callback?: () => void): IziToastProgress;
  /**
   * 显示一个消息通知.
   * @param settings toast 设置选项
   */
  info(settings: IziToastSettings): void;
  /**
   * 显示一个错误通知
   * @param settings toast 设置选项
   */
  error(settings: IziToastSettings): void;
  /**
   * 显示一个警告通知
   * @param settings toast 设置选项
   */
  warning(settings: IziToastSettings): void;
  /**
   * 显示一个成功通知
   * @param settings toast 设置选项
   */
  success(settings: IziToastSettings): void;
  /**
   * 显示一个.
   * @param settings toast 设置选项
   */
  question(settings: IziToastSettings): void;
}
