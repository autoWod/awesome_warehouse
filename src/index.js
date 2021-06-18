/*
 * @Description: awesome_warehouse
 * @Version: 1.0.0
 * @Author: lax
 * @Date: 2021-06-15 10:50:14
 * @LastEditors: lax
 * @LastEditTime: 2021-06-18 14:47:06
 * @FilePath: \awesome_warehouse\src\index.js
 */
// ==UserScript==
// @name         awesome_warehouse
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  awesome warehouse
// @author       lax
// @match        http://*.world-of-dungeons.org/wod/spiel/hero/items.php*
// @grant        none
// ==/UserScript==

(function() {
	"use strict";

	const lib = window.localStorage;

	const form = document.querySelector("form[action*='/wod/spiel/hero/items.php']");

	// 开始搜索
	const search = document.querySelector("a.button");

	const post = document.querySelector("input[name=ok]");

	const itemFrom = document.querySelector("input[name*=doEquipItem]");

	const itemSelect = document.querySelector("select[name=dummy]");

	initController();

	autoSaleConsumable();


	function initController(){
		const searchContainer = document.querySelector(".search_container");
		const controller = document.createElement("div");
		searchContainer.parentNode.appendChild(controller);
	}

	function autoSaleConsumable(){
		const consumable = document.querySelectorAll("input[name=item_3usage_item]");
		consumable[1].click();
		itemFrom.click();
		itemSelect.options[2].selected = true;
		const e = document.createEvent("HTMLEvents");
		e.initEvent("change",false,true);
		itemSelect.dispatchEvent(e);
		// search.click();
	}

})();
