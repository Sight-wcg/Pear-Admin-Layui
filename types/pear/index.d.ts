// Type definitions for pear-admin 3.9.X
// Project: https://gitee.com/pear-admin/Pear-Admin-Layui
// Definitions by: Sight

/// <reference path="button.d.ts" />
/// <reference path="common.d.ts" />
/// <reference path="context.d.ts" />
/// <reference path="convert.d.ts" />
/// <reference path="count.d.ts" />
/// <reference path="cropper.d.ts" />
/// <reference path="drawer.d.ts" />
/// <reference path="toast.d.ts" />

// declare namespace Pear {
//   /** 按钮组件 */
//   type PearButton = Button;
//   /** 公共组件 */
//   type PearCommon = Common;
//   /** 上下文组件 */
//   type PearContext = Context;
//   /** 转换组件 */
//   type PearConvert = Convert;
//   /** 数字滚动组件 */
//   type PearCount = Count;
//   /** 图片裁剪组件 */
//   type PearCropper = Cropper;
//   /** 抽屉组件 */
//   type PearDrawer = Drawer;
//   /** 消息通知组件 */
//   type PearToast = IziToast;
// }

interface Pear {
  button: Button
  common: Common;
  context: Context;
  convert: Convert;
  count: Count;
  cropper: Cropper;
  drawer: Drawer;
  toast: IziToast;
}