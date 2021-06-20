/*
 * @Description:
 * @Version: 1.0.0
 * @Author: lax
 * @Date: 2020-10-10 17:07:52
 * @LastEditors: lax
 * @LastEditTime: 2021-06-20 11:56:17
 */
module.exports = {
	root: true,
	env: {
		node: true,
		es6: true
	},
	parserOptions: {
		parser: "babel-eslint",
		ecmaVersion: 8
	},
	extends: ["airbnb-base/legacy", "plugin:prettier/recommended"],
	plugins: ["prettier"],
	rules: {
		"no-console": process.env.NODE_ENV === "production" ? "warn" : "off",
		"no-debugger": process.env.NODE_ENV === "production" ? "warn" : "off",
		"array-callback-return": "off",
		"consistent-return": "off",
		"no-plusplus": "off",
		"func-names": "off",
		"no-param-reassign": "off",
		"no-nested-ternary": "off",
		"class-methods-use-this": "off",
		"no-unused-expressions": "off",
		"no-underscore-dangle": "off",
		"no-use-before-define": "off",
		"no-else-return": "off",
		"no-alert": "off",
		camelcase: "off",
		strict: "off"
	},
	globals: {
		logger: true,
		XmlSerializer: true,
		base64_encode: true,
		$: true,
		GM_addStyle: true,
		GM_getResourceText: true
	},
	overrides: [
		{
			files: ["**/__test__/*.{j,t}s?(x)", "**/test/unit/**/*.test.{j,t}s?(x)"],
			env: {
				jest: true
			}
		}
	]
};
