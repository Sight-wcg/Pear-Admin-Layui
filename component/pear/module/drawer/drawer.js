/**
 * 抽屉模块
 */
layui.define(["jquery", "layer", "loading"], function (exports) {
  ("use strict");

  var MOD_NAME = "drawer",
    $ = layui.jquery,
    layer = layui.layer,
    loading = layui.loading;
    
  layui.link(layui.cache.base + "drawer/drawer.css");
  var drawer = new (function () {
    this.open = function (option) {
      return layerDrawer(option);
    };
    this.title = layer.title;
    this.style = layer.style;
    this.close = layer.close;
    this.closeAll = layer.closeAll;
  })();

  /**
   *
   * 封装 layer.open
   *
   * @param {object} option, `type`, `anim`, `move`, `fixed` 不可用,其它参数和 layer.open 一致, 新增了 `iframe`和 `url`参数
   * @returns {number}原生 layer 的 index
   */
  function layerDrawer(option) {
    var opt = normalizeOption(option);
    if (opt.target) appendToTarget(opt);
    if (opt.url) loadFragment(opt);
    var layerIndex = layer.open(opt);

    return layerIndex;
  }

  /**
   * 加载 HTML 片段到 layer content
   * @param {object} option 设置选选项
   */
  function loadFragment(option) {
    option.success = Aspect(option.success, function (layero, index) {
      var layerID = "#" + layero.attr("id");
      loading.block({
        type: 1,
        elem: layerID,
        msg: "",
      });
      $.ajax({
        url: option.url,
        dataType: "html",
        success: function (result) {
          layero.children(".layui-layer-content").html(result);
          loading.blockRemove(layerID);
        },
      });
    });
  }

  /**
   *将 layer 挂载到指定节点
   * @param {object} opt 设置选选项
   */
  function appendToTarget(opt) {
    var targetDOM = $(opt.target);
    var contentDOM = opt.content;

    contentDOM.appendTo(targetDOM);
    opt.skin = getDrawerAnimationClass(opt.offset, true);
    opt.offset = calcOffset(opt.offset, opt.area, targetDOM);
    // 处理关闭后偶现 DOM 仍显示的问题
    opt.end = Aspect(opt.end, function () {
      contentDOM.css("display", "none");
    });
    if (opt.shade) {
      opt.success = Aspect(opt.success, function (layero, index) {
        var shadeDOM = $("#layui-layer-shade" + index);
        shadeDOM.css("position", "absolute");
        shadeDOM.appendTo(layero.parent());
      });
    }
  }

  /**
   * 规格化 layer.open 选项，兼容原版 Drawer 所有选项
   * @param {object} option layer.open 的选项
   * @returns 规格化后的 layer.open 选项
   */
  function normalizeOption(option) {
    option.type = 1;
    option.anim = -1;
    option.move = false;
    option.fixed = true;
    if (option.iframe) {
      option.type = 2;
      option.content = option.iframe;
    }
    if (option.offset === undefined) option.offset = "r";
    option.area = calcDrawerArea(option.offset, option.area);
    if (option.title === undefined) option.title = false;
    if (option.closeBtn === undefined) option.closeBtn = false;
    if (option.shade === undefined) option.shade = 0.3;
    if (option.shadeClose === undefined) option.shadeClose = true;
    if (option.skin === undefined)
      option.skin = getDrawerAnimationClass(option.offset);
    if (option.resize === undefined) option.resize = false;
    if (option.success === undefined) option.success = function () {}; // 处理遮罩需要
    if (option.end === undefined) option.end = function () {};

    return option;
  }

  /**
   * 计算抽屉宽高
   * @param {string} offset 抽屉方向 l = 左, r = 右, t = 上, b = 下
   * @param {string[] | string} drawerArea 抽屉大小,字符串数组格式：[width, height]，字符串格式：百分比或单位 px。
   * @returns{string[]} 抽屉宽高数组
   */
  function calcDrawerArea(offset, drawerArea) {
    if (drawerArea instanceof Array) {
      return drawerArea;
    }
    if (drawerArea === undefined || drawerArea === "auto") {
      drawerArea = "30%";
    }
    if (offset === "l" || offset === "r") {
      return [drawerArea, "100%"];
    } else if (offset === "t" || offset === "b") {
      return ["100%", drawerArea];
    }
    return [drawerArea, "100%"];
  }

  /**
   * 获取抽屉动画类
   * @param {string} offset 抽屉方向 l = 左, r = 右, t = 上, b = 下
   * @param {boolean} [isAbsolute] 是否absolute 布局
   * @returns {string} 抽屉入场动画类
   */
  function getDrawerAnimationClass(offset, isAbsolute) {
    var positionAbsoluteClass = "position-absolute ";
    var prefixClass = "pear-drawer pear-drawer-anim layui-anim layer-anim-";
    var suffix = "rl";

    if (isAbsolute) {
      prefixClass = positionAbsoluteClass + prefixClass;
    }
    if (offset === "l") {
      suffix = "lr";
    } else if (offset === "r") {
      suffix = "rl";
    } else if (offset === "t") {
      suffix = "tb";
    } else if (offset === "b") {
      suffix = "bt";
    }
    return prefixClass + suffix;
  }

  /**
   * 指定挂载容器重新计算 offset
   * @param {string} offset 位置
   * @param {string[] | string} area  范围大小
   * @param {*} targetEl 挂载节点
   * @returns 包含抽屉位置信息的数组，[top, left]
   */
  function calcOffset(offset, area, targetEl) {
    if (offset === undefined || offset === "l" || offset === "t") {
      offset = "lt";
    } else if (offset === "r") {
      var left;
      if (area instanceof Array) {
        area = area[0];
      }
      left = /%$/.test(area)
        ? targetEl.innerWidth() * (1 - window.parseFloat(area) / 100)
        : targetEl.innerWidth() - area;
      offset = ["0", left];
    } else if (offset === "b") {
      var top;
      if (area instanceof Array) {
        area = area[1];
      }
      top = /%$/.test(area)
        ? targetEl.innerHeight() * (1 - window.parseFloat(area) / 100)
        : (top = targetEl.innerHeight() - area);
      offset = [top, "0"];
    }
    return offset;
  }

  /**
   * 简易的切面
   * @param {Function} target 被通知的对象，原函数
   * @param {Function | undefined} [before] 前置通知
   * @param {Function | undefined} [after] 后置通知
   * @returns 代理函数
   */
  function Aspect(target, before, after) {
    function proxyFunc() {
      if (before && typeof before === "function") {
        before.apply(this, arguments);
      }
      target.apply(this, arguments);
      if (after && typeof after === "function") {
        after.apply(this, arguments);
      }
    }
    return proxyFunc;
  }

  exports(MOD_NAME, drawer);
});
