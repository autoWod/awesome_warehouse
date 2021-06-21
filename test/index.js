/*
 * @Description: awesome_warehouse
 * @Version: 1.0.3
 * @Author: lax
 * @Date: 2021-06-15 10:50:14
 * @LastEditors: lax
 * @LastEditTime: 2021-06-22 00:30:22
 * @FilePath: \awesome_warehouse\test\index.js
 */
// ==UserScript==
// @name         awesome_warehouse
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @description  awesome warehouse
// @author       lax
// @match        http://*.world-of-dungeons.org/wod/spiel/hero/items.php?*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/js/select2.min.js
// @resource     select2-css https://cdnjs.cloudflare.com/ajax/libs/select2/4.0.13/css/select2.min.css
// @require      file://D:\project\person\wod\wod_plugin_base\src\index.js
// ==/UserScript==

(function() {
	"use strict";

	GM_addStyle(GM_getResourceText("select2-css"));

	const selectBox = new SelectBox();

	// storage
	const lib = window.localStorage;

	// 应用改动
	const post = document.querySelector("input[name=ok]");

	// 位置口
	const itemFrom = document.querySelector("input[name*=doEquipItem]");

	// 位置选择框
	const itemSelect = document.querySelector("select[name=dummy]");

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
			selectBox.selects.map(select => {
				let startTimeStamp = new Date().getTime();
				// 是否显示搜索栏
				let selectShow = false;
				// 搜索框是否被悬停
				let selected = false;
				// 搜索列表是否被悬停
				let dropSelected = false;
				// 计时器
				let tick;

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
			selectBox.search();
		}

		autoSelectByConsumable(flag) {
			this.autoSelectBy(() => {
				selectBox.setConsumable(1);
			}, flag);
		}

		autoSelectByAll(flag) {
			this.autoSelectBy(() => {
				selectBox.setConsumable(0);
			}, flag);
		}

		autoSelectByGroup(flag) {
			this.autoSelectBy(() => {
				selectBox.setGroup(1);
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
