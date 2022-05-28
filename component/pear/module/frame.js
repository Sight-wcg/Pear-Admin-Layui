layui.define(['jquery', 'element'], function (exports) {
	"use strict";

	var $ = layui.jquery;

	var pearFrame = function (opt) {
		this.option = opt;
	};

	pearFrame.prototype.render = function (opt) {
		var option = {
			elem: opt.elem,
			data: opt.data,
			session: opt.session,
			width: opt.width,
			height: opt.height,
			done: opt.done ? opt.done : function (data) { console.log("菜单渲染成功"); }
		}
		if (option.session) {
			var cacheInfo = frameCache(option.elem).get();
			if (cacheInfo) {
				option.data = cacheInfo;
			}
			frameCache(option.elem, option.data).set();
		}
		createFrameHTML(option);
		$("#" + option.elem).width(option.width);
		$("#" + option.elem).height(option.height);
		option.done(option.data);
		return new pearFrame(option);
	}

	pearFrame.prototype.changePage = function (id, title, url, loading) {
		var $frameLoad = $("#" + this.option.elem).find(".pear-frame-loading");
		var $frame = $("#" + this.option.elem + " iframe");
		$frame.attr("src", url);
		frameLoading($frame, $frameLoad, loading);
		if (this.option.session) {
			frameCache(this.option.elem, { id: id, title: title, url: url }).set();
		}
	}

	pearFrame.prototype.changePageByElement = function (elem, id, url, title, loading) {
		var $frameLoad = $("#" + elem).find(".pear-frame-loading");
		var $frame = $("#" + elem + " iframe");
		$frame.attr("src", url);
		$("#" + elem + " .title").html(title);
		frameLoading($frame, $frameLoad, loading);
		if (this.option.session) {
			frameCache(this.option.elem, { id: id, title: title, url: url }).set();
		}
	}

	pearFrame.prototype.refresh = function (loading) {
		var $frameLoad = $("#" + this.option.elem).find(".pear-frame-loading");
		var $frame = $("#" + this.option.elem).find("iframe");
		$frame.attr("src", $frame.attr("src"));
		frameLoading($frame, $frameLoad, loading);
	}

	pearFrame.prototype.clear = function () {
		frameCache(this.option.elem).remove();
	}

	function createFrameHTML(option) {
		var iframe = "<iframe class='pear-frame-content' style='width:100%;height:100%;'  scrolling='auto' frameborder='0' src='" + option.data.url + "' ></iframe>";
		var loading = '<div class="pear-frame-loading">' +
			'<div class="ball-loader">' +
			'<span></span><span></span><span></span><span></span>' +
			'</div>' +
			'</div></div>';
		$("#" + option.elem).html("<div class='pear-frame'>" + iframe + loading + "</div>");
	}

	function frameLoading(iframeEl, loadingEl, isLoading) {
		if (isLoading) {
			loadingEl.css({ display: 'block' });
			iframeEl.load(function () {
				loadingEl.fadeOut(1000);
			})
		}
	}

	function frameCache(elem, data) {
		var key = elem + "-pear-frame-data-current";
		return {
			set: function () {
				sessionStorage.setItem(key, JSON.stringify(data));
			},
			get: function () {
				return JSON.parse(sessionStorage.getItem(key));
			},
			remove: function () {
				sessionStorage.removeItem(key);
			}
		}
	}

	exports('frame', new pearFrame());
});
