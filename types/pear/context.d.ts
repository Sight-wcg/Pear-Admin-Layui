/**
 * pear 上下文组件
 */
interface Context {

  /**
   * 向 localStorage 添加键值对，如果不存在则创建
   * @param key 键
   * @param value  值
   */
  put(key: string, value: string): void;

  /**
   * 返回 key 对应的 value, 如果 key 不存在，则返回null
   * @param key 键
   */
  get(key: string): string;
}
