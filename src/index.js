/*
 * @Description: awesome_warehouse
 * @Version: 1.0.3
 * @Author: lax
 * @Date: 2021-06-15 10:50:14
 * @LastEditors: lax
 * @LastEditTime: 2021-07-04 14:51:22
 * @FilePath: \awesome_warehouse\src\index.js
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
// @require		 https://wod-static.oss-cn-hangzhou.aliyuncs.com/wod_plugin_base/wodBase.js
// ==/UserScript==

(function() {
	"use strict";

	GM_addStyle(GM_getResourceText("select2-css"));

	const selectBox = WOD.SelectBox.getOnt();

	const ITEM_POSITION = {
		// 仓库
		LOCAL: 1,
		// 团队仓库
		PUBLIC: 2,
		// 宝库
		GROUP: 3,
		// 储藏室
		PRIVATE: 4
	};

	// storage
	const lib = window.localStorage;

	// 应用改动
	const post = $("input[name=ok]");

	// 位置口
	const itemFrom = $("input[name*=doEquipItem]");

	// 位置选择框
	const itemSelect = $("select[name=dummy]");

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
				"团队",
				"耗材入仓",
				"将耗材放入团队仓库",
				AUTO_SAVE_CONSUMABLE,
				ITEM_POSITION.PUBLIC,
				select => {
					selectBox.setGroup(select ? 0 : 2);
					this.autoSelectByConsumable(AUTO_SAVE_CONSUMABLE);
				}
			);

			// 团物归仓
			this.createAutoFunWithItemReturnToPosition(
				"耗材",
				"团物归仓",
				"将团队物品放回宝库",
				GROUP_BACK,
				ITEM_POSITION.GROUP,
				select => {
					selectBox.setConsumable(select ? 0 : 2);
					this.autoSelectByGroup(GROUP_BACK);
				}
			);

			// 全部入仓;
			this.createAutoFunWithItemReturnToPosition(
				null,
				"全部入仓",
				"将非团队物品放入团队仓库",
				AUTO_SAVE_ALL,
				ITEM_POSITION.PUBLIC,
				() => {
					selectBox.setGroup(2);
					this.autoSelectByAll(AUTO_SAVE_ALL);
				}
			);

			// 检查可执行脚本
			this.check();
		}

		_initController() {
			GM_addStyle(`
				#awesome{
					width: 100%;
					border: 1px solid #FFD306;
					border-collapse: separate;
					display: flex;
					padding: 10px;
				}
			`);

			const searchContainer = $(".search_container");
			const controller = $(`<div id="awesome"></div>`);
			searchContainer.after(controller);

			this.setSelectAutoOpen();
			// this.addSelectCanCancel();
			return controller;
		}

		addSelectCanCancel() {
			selectBox.selects.map(select => {
				const selectView = select[0].nextElementSibling;
				const i = $("<div/>");
				i.val("x");
				$(selectView).append(i);
			});
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
				// 搜索栏是否使用
				let used = false;
				const selectView = select[0].nextElementSibling;
				selectView.addEventListener("mouseenter", e => {
					if (used) return;
					startTimeStamp = e.timeStamp;
					tick = setInterval(() => {
						if (new Date().getTime() - startTimeStamp >= 100) selectShow = true;
						if (selectShow) {
							window.clearInterval(tick);
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
						}
					}, 100);
				});
				selectView.addEventListener("mouseleave", () => {
					selected = false;
					window.clearInterval(tick);
					setTimeout(() => {
						if (!dropSelected) select.select2("close");
					}, 100);
				});
			});
		}

		check() {
			const status = lib.getItem(STATUS);
			status &&
				JSON.parse(status).map(each => {
					if (lib.getItem(each) && this.funcs[each] !== undefined)
						this.funcs[each]();
				});
		}

		createAutoFunWithItemReturnToPosition(
			check,
			bt,
			desc,
			flag,
			position,
			callback
		) {
			this.add(new PowerButton(check, bt, desc, flag, callback));
			this.addReturnFun(flag, position);
		}

		add(box) {
			this.controller.append(box.element);
		}

		addReturnFun(flag, position) {
			this.funcs[flag] = () => {
				if (itemFrom[0] && Number(lib.getItem(flag))) {
					itemFrom[0].click();
					const option = itemSelect[0].options[position];
					option.selected = true;
					this.selectActive(itemSelect[0]);
					lib.setItem(flag, 0);
					post.click();
				}
				lib.setItem(flag, 0);
			};
		}

		selectActive(ele) {
			const e = document.createEvent("HTMLEvents");
			e.initEvent("change", false, true);
			ele.dispatchEvent(e);
		}

		autoSelectBy(select, flag) {
			selectBox.clear();
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

	class PowerButton {
		constructor(check, name, desc, flag, callback) {
			this.select = false;
			this.flag = flag;
			update(flag);
			this.element = this.createCheckButton(check, name, desc, callback);
		}

		createButton(name, desc, callback) {
			const button = $(`<a/>`);
			button.attr("href", "#");
			desc && button.attr("title", desc);
			button.addClass("button");
			button.text(name);
			button.on("click", () => {
				callback(this.select);
			});
			return button;
		}

		createCheckButton(checkName, btName, desc, callback) {
			const self = this;
			const box = $(`<div/>`);
			box.css("border", "1px solid #FFD306");
			box.css("padding", "10px");
			box.css("display", "flex");
			if (checkName) {
				const label = $("<label/>");
				const input = $("<input/>");
				input.attr("type", "checkbox");
				input.attr("name", "item_3hero_level_enabled");
				label.text(checkName);
				input.on("click", function() {
					if (this.checked === true) {
						self.select = true;
					} else {
						self.select = false;
					}
				});
				label.append(input);
				box.append(label);
			}
			const button = this.createButton(btName, desc, callback);
			box.append(button);
			return box;
		}
	}
	new Controller();

	function update(key) {
		const arr = JSON.parse(lib.getItem(STATUS)) || [];
		if (!arr.includes(key)) arr.push(key);
		lib.setItem(STATUS, JSON.stringify(arr));
	}
})();
