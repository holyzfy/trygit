(function($){
	function photoCarousel() {
		if($("#detail_photo").length < 1) return;
		var $carousel = $("#detail_photo").carousel(),
			$index = $("#detail_photo_index strong"),
			$total = $("#detail_photo_index span"),
			size = $("#detail_photo div.m-item").length;
		$total.text((size < 10 ? "0" : "") + size);
		$carousel.on("afterSlide", function(e, prevIndex, newIndex) {
			var index = newIndex >= 10 ? newIndex : 0 + "" + newIndex;
			$index.text(index);
			newIndex > 1 && prevIndex == size && prevIndex == newIndex && $carousel.carousel("move", 1);
		});
		NEHouse.resetCarousel($carousel);
		$carousel.find("div.m-item").adjustHeight("4:3");
	}

	function percent(elem, value) {
		$(elem).each(function(){
			var canvas = $("canvas", this)[0];
			var $txt = $("em", this);
			var value = parseInt(this.dataset.value, 10);
			var ctx = canvas.getContext("2d");
			ctx.strokeStyle = "#c38e00";
			ctx.lineWidth = 5;
			ctx.beginPath();
			ctx.arc(56, 56, 53, 0, (value * 2 / 100) * Math.PI);
			ctx.stroke();
			$txt.text(value);
		});
	}

	function otherCarousel() {
		if($("#detail_other").length < 1) return;
		var $carousel = $("#detail_other").carousel(),
			size = $("#detail_other div.m-item").length;
		$carousel.on("afterSlide", function(e, prevIndex, newIndex) {
			newIndex > 1 && prevIndex == size && prevIndex == newIndex && $carousel.carousel("move", 1);
		});
		$("#detail_other span[data-price]").exprice();
		NEHouse.resetCarousel($carousel);
	}

	function recommendCarousel() {
		if($("#detail_recommend_bd").length < 1) return;
		var $carousel = $("#detail_recommend_bd").carousel(),
			size = $("#detail_recommend_bd div.m-item").length;
		$carousel.on("afterSlide", function(e, prevIndex, newIndex) {
			newIndex > 1 && prevIndex == size && prevIndex == newIndex && $carousel.carousel("move", 1);
		});
		NEHouse.resetCarousel($carousel);
		$carousel.find("div.detail_recommend_photo").adjustHeight("16:9");
	}

	function map() {
		// http://msdn.microsoft.com/en-us/library/ff701724.aspx
		if(!window.mapData) return;
		
		var keyList = [
			"Ar_a0tBJwvchAXbeSWw6LSbgLAWSkNr_spAd-BvXS0ibSK46fLwLafhxJnEHBpyR",
			"At9Jj3qXPuksg5dxqkWgz-XFcEFFgqll-gu4xRdvAsn5m41q4HXTnoax2qudLtMa"
		];
		var randomIndex = Math.floor(Math.random() * keyList.length);
		var key = keyList[randomIndex];

		// 静态地图图片
		var site = "http://dev.virtualearth.net/REST/v1/Imagery/Map/Road/{centerPoint}/{zoomLevel}?mapSize={mapSize}&pushpin={centerPoint}&format=jpeg&key={key}";
		var img = '<img src="{src}" alt="" />';
		var w = $(window).width(),
			h = Math.floor(w * 350 / 640);
		var data = $.extend(mapData, {
			zoomLevel: 15,
			mapSize: [w, h].join(","),
			key: key
		});
		$("#detail_map").html(NEHouse.render(img, {
			src: NEHouse.render(site, data)
		}));

		// 点击静态地图图片后，全屏显示地图
		$("#detail_map").click(function(){
			$("#dlg_map").addClass("dlg_show");

			var centerPoint = $.trim(mapData.centerPoint).split(/\s*,\s*/);
			var center = new Microsoft.Maps.Location(centerPoint[0], centerPoint[1]);
			var mapOptions = {
					credentials: key,
					mapTypeId: Microsoft.Maps.MapTypeId.road,
					zoom: 15
				};
			var map = new Microsoft.Maps.Map($("#dlg_map_bd")[0], $.extend(
				mapOptions, {
					center: center
				}
			));

			var pin = new Microsoft.Maps.Pushpin(center); 
			map.entities.push(pin);
		});
	}

	// 近期总价
	function price() {
		if(!window.chartData) return;

		var tmpl = '<li><label>{name}</label><span class="{deltaCls}">{price}</span></li>';

		showItemPrice("#detail_price_room", chartData.total_by_room.series);
		showItemPrice("#detail_price_type", chartData.total_by_type.series);

		function showItemPrice($wrap, series) {
			$wrap = $($wrap);
			$.each(series, function(){
				if(this.data && this.data.length > 0) {
					var price = this.data.pop() + "";
					var delta = price - this.data.pop();
					var formatPrice = [];
					for(var i = price.length - 1, j = 1; i >= 0; i--, j++) {
						formatPrice.unshift(price[i]);
						i > 0 && (j >= 3) && (j % 3 == 0) && formatPrice.unshift(",");
					}
					var li = NEHouse.render(tmpl, {
						name: this.name,
						price: "$" + formatPrice.join(""),
						deltaCls: delta < 0 ? "item_desc": "item_asc"
					});
					$wrap.append(li);
				}
			});
		}
	}

	// 周边房源
	function getHouseListByNear() {
		var dfd = $.Deferred();
		var firstTmpl = $("#houses_first_tmpl").html(),
			othersTmpl = $("#houses_others_tmpl").html();
		$.getJSON("/nearbyHouses.do", {
			screenId: $("#field_screen_id").val()
		}, function(data){
			if(data.result) {
				var firstHouse = data.result.nearbyHouses[0];
				firstHouse.description = firstHouse.descriptionCn || firstHouse.description;
				var first = NEHouse.render(firstTmpl, firstHouse);
				$("#detail_nearby_houses").prepend(first);
				var othersData = data.result.nearbyHouses.slice(1, 4);
				var others = NEHouse.render(othersTmpl, othersData);
				$("#detail_nearby_houses ul").prepend(others);
				dfd.resolve();
			} else {
				dfd.reject();
				$("#detail_nearby_houses, detail_nearby_houses_ctrl").remove();
			}
		});
		return dfd;
	}

	// 同价位房源
	function getHouseListByPrice() {
		var dfd = $.Deferred();
		var firstTmpl = $("#houses_first_tmpl").html(),
			othersTmpl = $("#houses_others_tmpl").html();
		$.getJSON("/samePriceHouses.do", {
			screenId: $("#field_screen_id").val()
		}, function(data){
			if(data.result) {
				var firstHouse = data.result.samePriceHouses[0];
				firstHouse.description = firstHouse.descriptionCn || firstHouse.description;
				var first = NEHouse.render(firstTmpl, firstHouse);
				$("#detail_same_houses").prepend(first);
				var othersData = data.result.samePriceHouses.slice(1, 4);
				var others = NEHouse.render(othersTmpl, othersData);
				$("#detail_same_houses ul").prepend(others);
				dfd.resolve();
			} else {
				dfd.reject();
				$("#detail_same_houses, detail_same_houses_ctrl").remove();
			}
		});
		return dfd;
	}

	// 猜你喜欢
	function recommend() {
		var dfd = $.Deferred();
		var tmpl = $("#detail_recommend_tmpl").html();
		$.getJSON("/recommend/getRecommend.do", function(data) {
			var list = data.recommend.elementsString.slice(0, 9);
			var content = "";
			for(var i = 0, length = list.length; i < length; i+=3) {
				var itemData = list.slice(i, i + 3);
				var itemTmpl = '<div class="m-item"><ul class="clearfix">{li}</ul></div>';
				content += NEHouse.render(itemTmpl, {
					li: NEHouse.render(tmpl, itemData)
				});
				$("#detail_recommend_bd div.m-carousel-inner").html(content);

				var ctrl = NEHouse.render('<a href="#" data-slide="{index}">{index}</a>', {index: i / 3 + 1});
				$("#detail_recommend_bd div.detail_recommend_ctrl").append(ctrl);
				// 等DOM reflow完毕后再继续
				setTimeout(function(){
					dfd.resolve();
				}, 50);
			}
		});

		return dfd;
	}

	function housePrice() {
		$("#detail_house_price span").exprice();
		// 原始价格
		var $price = $("#detail_house_ch_price");
		$price.text(NEHouse.getCurrencyName($.trim($price.text())));

		// 购房税费
		$.isFunction(window.getTax) && getRateToUSD().done(function(rate) {
			var $tax = $("#detail_tax");
			$tax[0].dataset.currency = "USD";
			$tax[0].dataset.price = Math.round(getTax(rate));
			$tax.exprice();
			$tax.closest("tr").show();
		});
	}

	function getRateToUSD() {
		var dfd = $.Deferred();

		var currencyName = $("#field_currency").val().toUpperCase();
		if(currencyName == "USD") {
			dfd.resolve(1);
		} else {
			var symbol = currencyName + "USD";
			NEHouse.exchange().done(function(list){
				var symbol = currencyName + "USD";
				$.each(list, function(i, item) {
					if(symbol == item.symbol) {
						dfd.resolve(item.rate);
						return false;
					}
				});
			});
		}
		return dfd;
	}

	function description() {
		var $descriptionCn = $("#detail_description_cn");
		var $descriptionEn = $("#detail_description_en");
		$.trim($descriptionCn.text()).length > 0 ? $descriptionEn.remove() : $descriptionEn.show();
	};

	function init(){
		photoCarousel();
		housePrice();
		percent("#detail_pie_asc, #detail_pie_desc");
		map();
		price();
		$.when(getHouseListByNear(), getHouseListByPrice()).done(otherCarousel);
		recommend().done(recommendCarousel);
		description();
	}

	init();
})(Zepto);