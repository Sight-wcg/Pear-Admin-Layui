/**
 * pear 数据转换组件
 */
interface Convert {
  /**
   * image 转 base64
   * @param img 图片对象
   */
  imageToBase64(img: object): string
}