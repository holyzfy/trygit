(function($){

	function houseSlide() {
		var $carousel = $("#index_house").carousel(),
			$index = $("#index_house_index strong"),
			$total = $("#index_house_index span"),
			size = $("#index_house a.m-item").length;
		$total.text((size < 10 ? "0" : "") + size);
		$carousel.on("afterSlide", function(e, prevIndex, newIndex) {
			var index = newIndex >= 10 ? newIndex : 0 + "" + newIndex;
			$index.text(index);
		});
		NEHouse.resetCarousel($carousel);
		$carousel.adjustHeight();
	}

	// 点击“更多+”分页加载内容
	function load($trigger, callback) {
		$trigger = $($trigger);
		var $list,
			$source = $($trigger.data("source")),
			$container = $($trigger.data("container")),
			pageSize = $trigger.data("pagesize"),
			done; // true: 内容已全部显示，false:内容未全部显示
		
		$trigger.click(function(e) {
			e.preventDefault();
			if(!$list) {
				$list = $($source.html()).filter("li");
			}
			if($list.length > 0) {
				// 够两页吗
				var end = $list.length >= pageSize * 2  ? pageSize : undefined;
				$container.append($list.slice(0, end));
				if(end) {
					$list = $list.slice(end);
					done = false;
				} else {
					$trigger.remove();
					done = true;
				}
			} else {
				$trigger.remove();
				done = true;
			}
			var start = end ? end : 0 - $list.length;
			var $newList = $container.children().slice(start);
			callback && callback(done, $newList);
		});
	}

	// 最新房源
	function latestHouse() {
		var formatPrice = function() {
			// 原始价格
			$("#index_latest_bd span.item_currency_todo").formatCurrency(function(){
				$(this).removeClass("item_currency_todo");
			});

			// 换算价格
			$("#index_latest_bd span.item_price_todo").exprice(function(){
				$(this).removeClass("item_price_todo");
			});
		};

		// 查看更多
		load("#index_latest_load", function(done, $list) {
			formatPrice();
			$list && $list.length > 0 && $list.find("div.item_img").adjustHeight();
		});

		formatPrice();
		$("#index_latest_bd div.item_img").adjustHeight();
	}

	// 热门景区
	function scenic() {
		load("#index_scenic_load");
	}

	function init() {
		houseSlide();
		latestHouse();
		scenic();
	}

	NEHouse.indexInit = init;
})(Zepto);