/*
 * @Description: awesome_warehouse
 * @Version: 1.0.2
 * @Author: lax
 * @Date: 2021-06-15 10:50:14
 * @LastEditors: lax
 * @LastEditTime: 2021-06-20 12:02:33
 * @FilePath: \awesome_warehouse\src\index.js
 */
// ==UserScript==
// @name         awesome_warehouse
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  awesome warehouse
// @author       lax
// @match        http://*.world-of-dungeons.org/wod/spiel/hero/items.php?*
// @grant         GM_addStyle
// @grant         GM_getResourceText
// @require       https://code.jquery.com/jquery-3.3.1.min.js
// @require       https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.3/js/select2.min.js
// @resource      select2-css https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.3/css/select2.min.css
// ==/UserScript==

(function() {
	"use strict";

	GM_addStyle(GM_getResourceText("select2-css"));

	/* 储存位置 */
	const ITEM_POSITION = {
		/* 仓库 */
		LOCAL: 1,
		/* 团队仓库 */
		PUBLIC: 2,
		/* 宝库 */
		GROUP: 3,
		/* 储藏室 */
		PRIVATE: 4
	};

	// storage
	const lib = window.localStorage;

	// form
	const form = document.querySelector(
		"form[action*='/wod/spiel/hero/items.php']"
	);

	// 开始搜索
	const search = document.querySelector("a.button");

	// 是否耗材
	const consumable = document.querySelectorAll("input[name=item_3usage_item]");

	// 是否团队物品
	const group = document.querySelectorAll("input[name=item_3group_item]");

	// 应用改动
	const post = document.querySelector("input[name=ok]");

	// 位置口
	const itemFrom = document.querySelector("input[name*=doEquipItem]");

	// 位置选择框
	const itemSelect = document.querySelector("select[name=dummy]");

	// 搜索选项
	const selectBox = $(".search_container select");

	// 执行状态key
	const STATUS = "wod_awesome_warehouse_status";

	// 耗材入仓状态key
	const AUTO_SAVE_CONSUMABLE = "wod_awesome_warehouse_save_consumable";

	// 团物归仓状态key
	const GROUP_BACK = "wod_awesome_warehouse_group_back";

	// 全部入仓
	const AUTO_SAVE_ALL = "wod_awesome_warehouse_save_all";

	class Controller {
		constructor() {
			// 待执行脚本
			this.funcs = {};
			// 增强控制器
			this.controller = this._initController();
			// 耗材入仓
			this.createAutoFunWithItemReturnToPosition(
				"耗材入仓",
				AUTO_SAVE_CONSUMABLE,
				ITEM_POSITION.PUBLIC,
				() => {
					this.autoSelectByConsumable(AUTO_SAVE_CONSUMABLE);
				}
			);

			// 全部入仓
			this.createAutoFunWithItemReturnToPosition(
				"全部入仓",
				AUTO_SAVE_ALL,
				ITEM_POSITION.PUBLIC,
				() => {
					this.autoSelectByAll(AUTO_SAVE_ALL);
				}
			);

			// 团物归仓
			this.createAutoFunWithItemReturnToPosition(
				"团物归仓",
				GROUP_BACK,
				ITEM_POSITION.GROUP,
				() => {
					this.autoSelectByGroup(GROUP_BACK);
				}
			);

			// 检查可执行脚本
			this.check();
		}

		_initController() {
			const searchContainer = document.querySelector(".search_container");
			const controller = document.createElement("div");
			controller.setAttribute("id", "awesome");
			controller.style.width = "100%";
			controller.style.border = "1px solid #FFD306";
			controller.style["border-collapse"] = "separate";
			controller.style.display = "flex";
			controller.style.padding = "10px";
			// controller.style["justify-content"] = "space-around";
			// controller.style["flex-direction"] = "column";
			searchContainer.parentNode.insertBefore(
				controller,
				searchContainer.nextElementSibling
			);

			this.setSelectAutoOpen();
			return controller;
		}

		setSelectAutoOpen() {
			selectBox.each(function() {
				const select = $(this);
				const backgroundColor = select.css("background-color");
				const fontColor = select.css("color");
				const border = select.css("border");
				const borderRadius = select.css("border-radius");

				GM_addStyle(
					`
					.select2-container .select2-selection--single {
						background-color: ${backgroundColor};
						border: ${border};
						borderRadius: ${borderRadius};
					}
					.select2-dropdown {
						background-color: ${backgroundColor};
						color: ${fontColor};
						border: ${border};
					}
					.select2-selection {
						background-color: ${backgroundColor};
					}
					.select2-container--default .select2-selection--single .select2-selection__rendered {
						color: ${fontColor};
					}
					`
				);

				let startTimeStamp = new Date().getTime();
				// 是否显示搜索栏
				let selectShow = false;
				// 搜索框是否被悬停
				let selected = false;
				// 搜索列表是否被悬停
				let dropSelected = false;
				// 计时器
				let tick;

				select.select2();
				const selectView = select[0].nextElementSibling;
				selectView.addEventListener(
					"mouseenter",
					e => {
						startTimeStamp = e.timeStamp;
						tick = setInterval(() => {
							if (new Date().getTime() - startTimeStamp >= 100)
								selectShow = true;
							if (selectShow) {
								select.select2("open");

								const dropdown = $(".select2-dropdown")[0];

								dropdown.addEventListener("mouseenter", () => {
									dropSelected = true;
								});

								dropdown.addEventListener("mouseleave", () => {
									dropSelected = false;
									setTimeout(() => {
										if (!selected) select.select2("close");
									}, 100);
								});

								window.clearInterval(tick);
							}
						}, 100);
					},
					false
				);
				selectView.addEventListener(
					"mouseleave",
					() => {
						selected = false;
						window.clearInterval(tick);
						setTimeout(() => {
							if (!dropSelected) select.select2("close");
						}, 100);
					},
					false
				);
			});
		}

		check() {
			const status = lib.getItem(STATUS);
			status &&
				JSON.parse(status).map(each => {
					if (lib.getItem(each)) this.funcs[each]();
				});
		}

		createAutoFunWithItemReturnToPosition(name, flag, position, callback) {
			this.createButton(name, flag, callback);
			this.addReturnFun(flag, position);
		}

		createButton(name, flag, callback) {
			const button = document.createElement("a");
			button.setAttribute("class", "button");
			button.href = "#";
			button.innerHTML = name;
			this.controller.appendChild(button);
			button.addEventListener("click", callback);
			update(flag);
		}

		addReturnFun(flag, position) {
			this.funcs[flag] = () => {
				if (itemFrom && Number(lib.getItem(flag))) {
					itemFrom.click();
					itemSelect.options[position].selected = true;
					const e = document.createEvent("HTMLEvents");
					e.initEvent("change", false, true);
					itemSelect.dispatchEvent(e);
					lib.setItem(flag, 0);
					post.click();
				}
				lib.setItem(flag, 0);
			};
		}

		autoSelectBy(select, flag) {
			select();
			lib.setItem(flag, 1);
			search.click();
		}

		autoSelectByConsumable(flag) {
			this.autoSelectBy(() => {
				consumable[1].click();
			}, flag);
		}

		autoSelectByAll(flag) {
			this.autoSelectBy(() => {
				consumable[0].click();
			}, flag);
		}

		autoSelectByGroup(flag) {
			this.autoSelectBy(() => {
				group[1].click();
			}, flag);
		}
	}

	new Controller();

	function update(key) {
		const arr = JSON.parse(lib.getItem(STATUS)) || [];
		if (!arr.includes(key)) arr.push(key);
		lib.setItem(STATUS, JSON.stringify(arr));
	}
})();
