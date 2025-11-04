/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/extensions/core/main.ts":
/*!*************************************!*\
  !*** ./src/extensions/core/main.ts ***!
  \*************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

eval("{\nvar __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    var desc = Object.getOwnPropertyDescriptor(m, k);\n    if (!desc || (\"get\" in desc ? !m.__esModule : desc.writable || desc.configurable)) {\n      desc = { enumerable: true, get: function() { return m[k]; } };\n    }\n    Object.defineProperty(o, k2, desc);\n}) : (function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    o[k2] = m[k];\n}));\nvar __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {\n    Object.defineProperty(o, \"default\", { enumerable: true, value: v });\n}) : function(o, v) {\n    o[\"default\"] = v;\n});\nvar __importStar = (this && this.__importStar) || (function () {\n    var ownKeys = function(o) {\n        ownKeys = Object.getOwnPropertyNames || function (o) {\n            var ar = [];\n            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;\n            return ar;\n        };\n        return ownKeys(o);\n    };\n    return function (mod) {\n        if (mod && mod.__esModule) return mod;\n        var result = {};\n        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== \"default\") __createBinding(result, mod, k[i]);\n        __setModuleDefault(result, mod);\n        return result;\n    };\n})();\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nconst coreExtensions = __importStar(__webpack_require__(/*! ./window */ \"./src/extensions/core/window.ts\"));\nwindow.core = coreExtensions;\nwindow.onerror = function (message, source, lineno, colno, error) {\n    console.error(message, error);\n    alert(message);\n};\n\n\n//# sourceURL=webpack:///./src/extensions/core/main.ts?\n}");

/***/ }),

/***/ "./src/extensions/core/storage.ts":
/*!****************************************!*\
  !*** ./src/extensions/core/storage.ts ***!
  \****************************************/
/***/ ((__unused_webpack_module, exports) => {

eval("{\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.getActiveSets = getActiveSets;\nexports.getActiveCollectionName = getActiveCollectionName;\nexports.saveActiveCollectionName = saveActiveCollectionName;\nexports.saveActiveSetsText = saveActiveSetsText;\nexports.addToParty = addToParty;\nexports.removeFromParty = removeFromParty;\nexports.getParty = getParty;\nexports.saveParty = saveParty;\nexports.saveActiveSets = saveActiveSets;\nexports.saveSetCollection = saveSetCollection;\nexports.getSetCollection = getSetCollection;\nfunction getActiveSets() {\n    let activeCollectionName = getActiveCollectionName();\n    let collection = getSetCollection();\n    if (!activeCollectionName || !collection)\n        return {};\n    return collection[activeCollectionName];\n}\nfunction getActiveCollectionName() {\n    let activeCollectionName = getStorageItem('activeCollection');\n    if (activeCollectionName)\n        return activeCollectionName;\n    return Object.keys(getSetCollection())[0];\n}\nfunction saveActiveCollectionName(name) {\n    localStorage.setItem('activeCollection', name);\n}\nfunction saveActiveSetsText(text) {\n    let activeSets = getSetCollection();\n    let activeSetName = getActiveCollectionName();\n    activeSets[activeSetName] = JSON.parse(text);\n    saveSetCollection(activeSets);\n}\nfunction addToParty(pokemonId) {\n    let party = getParty();\n    party.push(pokemonId);\n    saveParty(party);\n}\nfunction removeFromParty(pokemonId) {\n    let party = getParty();\n    let index = party.indexOf(pokemonId);\n    if (index !== -1) {\n        party.splice(index, 1);\n        saveParty(party);\n    }\n}\nfunction getParty() {\n    let party = localStorage.getItem('party');\n    if (party)\n        return JSON.parse(party);\n    return [];\n}\nfunction saveParty(party) {\n    localStorage.setItem('party', JSON.stringify(party));\n}\nfunction saveActiveSets(sets) {\n    saveActiveSetsText(JSON.stringify(sets));\n}\nfunction saveSetCollection(collection) {\n    localStorage.setItem('setCollection', JSON.stringify(collection));\n    if (localStorage.customsets)\n        localStorage.removeItem('customsets');\n}\nfunction getSetCollection() {\n    let storage = getStorageItem('setCollection');\n    if (!storage) {\n        let activeSet = JSON.parse(getStorageItem('customsets') || \"{}\");\n        return {\n            \"Default\": activeSet\n        };\n    }\n    return JSON.parse(storage);\n}\nfunction getStorageItem(key) {\n    return localStorage.getItem(key);\n}\n\n\n//# sourceURL=webpack:///./src/extensions/core/storage.ts?\n}");

/***/ }),

/***/ "./src/extensions/core/window.ts":
/*!***************************************!*\
  !*** ./src/extensions/core/window.ts ***!
  \***************************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {

eval("{\nvar __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    var desc = Object.getOwnPropertyDescriptor(m, k);\n    if (!desc || (\"get\" in desc ? !m.__esModule : desc.writable || desc.configurable)) {\n      desc = { enumerable: true, get: function() { return m[k]; } };\n    }\n    Object.defineProperty(o, k2, desc);\n}) : (function(o, m, k, k2) {\n    if (k2 === undefined) k2 = k;\n    o[k2] = m[k];\n}));\nvar __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {\n    Object.defineProperty(o, \"default\", { enumerable: true, value: v });\n}) : function(o, v) {\n    o[\"default\"] = v;\n});\nvar __importStar = (this && this.__importStar) || (function () {\n    var ownKeys = function(o) {\n        ownKeys = Object.getOwnPropertyNames || function (o) {\n            var ar = [];\n            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;\n            return ar;\n        };\n        return ownKeys(o);\n    };\n    return function (mod) {\n        if (mod && mod.__esModule) return mod;\n        var result = {};\n        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== \"default\") __createBinding(result, mod, k[i]);\n        __setModuleDefault(result, mod);\n        return result;\n    };\n})();\nObject.defineProperty(exports, \"__esModule\", ({ value: true }));\nexports.storage = void 0;\nexports.storage = __importStar(__webpack_require__(/*! ./storage */ \"./src/extensions/core/storage.ts\"));\n\n\n//# sourceURL=webpack:///./src/extensions/core/window.ts?\n}");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/extensions/core/main.ts");
/******/ 	
/******/ })()
;