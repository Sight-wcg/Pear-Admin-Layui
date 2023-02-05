layui.define([], function (exports) {
  var setter = {
    // 网站配置
    logo: {
      title: "Pear Admin", // 网站图标
      image: "admin/images/logo.png", // 网站图标
    },
    // 菜单配置
    menu: {
      data: "admin/data/menu.json", // 菜单数据来源
      method: "GET", // 菜单接口的请求方式 GET / POST
      accordion: true, // 是否同时只打开一个菜单目录
      collapse: false, // 侧边默认折叠状态
      control: false, // 是否开启多系统菜单模式
      controlWidth: 500, // 顶部菜单宽度 PX
      select: "10", // 默认选中的菜单项
      async: true, // 是否开启异步菜单，false 时 data 属性设置为静态数据，true 时为后端接口
    },
    // 视图内容配置
    tab: {
      enable: true, // 是否开启多选项卡
      keepState: true, // 保持视图状态
      session: true, // 开启选项卡记忆
      preload: true, // 是否预加载非激活标签页,懒加载
      max: "30", // 可打开的数量, false 不限制
      // 首页
      index: {
        id: "10", // 标识 ID , 建议与菜单项中的 ID 一致
        href: "view/console/console1.html", // 页面地址
        title: "首页", // 标题
      },
    },
    // 主题配置
    theme: {
      defaultColor: "2", //  默认主题色，对应 colors 配置中的 ID 标识
      defaultMenu: "dark-theme", // 默认的菜单主题 dark-theme 黑 / light-theme 白
      defaultHeader: "light-theme", // 默认的顶部主题 dark-theme 黑 / light-theme 白
      allowCustom: true, // 是否允许用户切换主题，false 时关闭自定义主题面板
      banner: false, // 通栏配置
    },
    // 主题色配置列表
    colors: [
      {
        id: "1",
        color: "#2d8cf0",
        second: "#ecf5ff",
      },
      {
        id: "2",
        color: "#36b368",
        second: "#f0f9eb",
      },
      {
        id: "3",
        color: "#f6ad55",
        second: "#fdf6ec",
      },
      {
        id: "4",
        color: "#f56c6c",
        second: "#fef0f0",
      },
      {
        id: "5",
        color: "#3963bc",
        second: "#ecf5ff",
      },
    ],
    // 其他配置
    other: {
      keepLoad: "1200", // 主页动画时长
      autoHead: false, // 布局顶部主题
      footer: false, // 页脚
    },
    // 头部配置
    header: {
      // 站内消息，通过 false 设置关闭
      message: "admin/data/message.json",
    },
  };
  exports("setter", setter);
});
