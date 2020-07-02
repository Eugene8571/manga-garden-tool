/**
 * mge v2
 * by blade.sk
 */

const mge = {
	hoveredElement: false,
	markedElement: false,
	selectedElement: false,
	targetingMode: false,
	transpose: 0, // how far to travel up the line of ancestors
	maxZIndex: 2147483647,
	hiddenElements: [],
	settings: {},
	
	helpWindow: false,
	
	triggerResize: function() {
		let evt = document.createEvent('UIEvents');
		evt.initUIEvent('resize', true, false,window,0);
		window.dispatchEvent(evt);

		setTimeout(function() { // also update overlays
			mge.refreshOverlays();
		});
	},
	
	highlightElement: function() {
		if (!mge.hoveredElement) return;
		
		if (mge.markedElement) {
			mge.removeHighlightStyle(mge.markedElement);
		}

		mge.markedElement = mge.hoveredElement;
		if (mge.markedElement.className == "mge_overlay") { // this is just a proxy for an iframe
			mge.markedElement = mge.markedElement.relatedElement;
		}
		// возможное место для условия
		let i = 0;
		for (i = 0; i < mge.transpose; i++) {
			if (mge.markedElement.parentNode != window.document) {
				mge.markedElement = mge.markedElement.parentNode;
			} else {
				break;
			}
		}
		
		mge.transpose = i;
		mge.addHighlightStyle(mge.markedElement);

		// alert(mge.getPathHTML(mge.hoveredElement, mge.transpose));
		document.querySelector('#mge_current_elm').innerHTML = mge.getPathHTML(mge.hoveredElement, mge.transpose);
		document.querySelector('#mge_current_elm').scrollTop = 9999;
		// сюда
	},

	addHighlightStyle: function (elm) {
		if (mge.selectedElement) {
			mge.selectedElement.style.outline = 'solid 5px rgba(230,126,34,0.5)';
			mge.selectedElement.style.outlineOffset = '-5px';			
			return;}
		mge.markedElement.style.outline = 'solid 5px rgba(230,126,34,0.5)';
		mge.markedElement.style.outlineOffset = '-5px';
	},

	removeHighlightStyle: function (elm) {
		mge.markedElement.style.outline = '';
		mge.markedElement.style.outlineOffset = '';
	},
	
	mouseover: function(e) {
		if (mge.isChildOfmgeWindow(e.target)) return;
		
		if (mge.hoveredElement != e.target) {
			mge.transpose = 0;
			mge.hoveredElement = e.target;
			mge.highlightElement();
		}
	},

	isChildOfmgeWindow: function(elm) {
		for (var i = 0; i < 8; i++) {
			if (elm == mge.helpWindow) return true;
			elm = elm.parentNode;
			if (!elm) break;
		}

		return false;
	},
	
	keyDown: function(e) {
		// managed via browser actions
		/*if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.keyCode == 88) {
			if (mge.targetingMode)
				mge.deactivate();
			else
				mge.activate();
				
			e.stopPropagation(); e.preventDefault();
			return false;
		}*/

		if (!mge.targetingMode) return;
		
		if (e.keyCode == 27) {
			mge.deactivate();
		}
		
		if (e.keyCode == 87) { // w
			if (mge.transpose > 0) mge.transpose--;
			mge.highlightElement();
		} else if (e.keyCode == 81) { // q
			mge.transpose++;
			mge.highlightElement();
		}

		e.stopPropagation(); e.preventDefault();
		return false;
	},
	
	keyUp: function(e) {
		if (!mge.targetingMode) return;

		e.stopPropagation(); e.preventDefault();
		return false;
	},
	
	hideTarget: function(e) {
		if (mge.isChildOfmgeWindow(e.target)) return;

		let selector = mge.getSelector(mge.markedElement);

		if (!selector) return;

		mge.selectedElement = mge.markedElement;

		mge.hiddenElements.push({
			selector,
			permanent: !!mge.settings.remember,
		});

		mge.updateCSS();
		mge.updateElementList();
		mge.triggerResize();
		mge.refreshOverlays();
		// mge.updateSavedElements();

		e.preventDefault();
		e.stopPropagation();
		return false;
	},

	getSelector: function(element) {
		if (element.tagName == 'BODY') return 'body';
		if (element.tagName == 'HTML') return 'html';
		if (!element) return null;

		return cssFinder(element, {
			seedMinLength: 3,
			optimizedMinLength: 1,
		});
	},

	getPathHTML: function (element, transpose) {
		function getElmName (elm) {
			if (elm.id) {
				return "#" + elm.id;
			} else if (typeof elm.className == "string" && elm.className.trim().length) {
				return elm.tagName.toLowerCase() + "." + elm.className.trim().split(" ").join(".");
			} else {
				return elm.tagName.toLowerCase();
			}
		}

		let path = [];
		let currentElm = element;

		if (currentElm.className == "mge_overlay") { // this is just a proxy for an iframe
			currentElm = currentElm.relatedElement;
		}

		while (currentElm) {
			path.push(currentElm);
			currentElm = currentElm.parentElement;
		}

		path = path.reverse();

		let html = [];
		for (let i = 0; i < path.length; i++) {
			// здесь формируется строка позиции элемента
			html.push(`${path.length - 1 - i == transpose ? " active" : ""}${getElmName(path[i])}`);
		}

		return html.join(" > ");
	},

	preventEvent: function(e) {
		if (mge.isChildOfmgeWindow(e.target)) return;

		e.preventDefault();
		e.stopPropagation();
		return false;
	},
	
	updateCSS: function() {
		let cssLines = [
			`
			#mge_wnd {
				display: none;
				position: absolute;
				top: 200px;
				right: 10px;
				width: 360px;
				height: 340px; 
				padding: 10px 20px;
				box-sizing: content-box;
				background: #fff;
				// display: inline-block;
				margin: 15px;
				box-shadow: 
				0 7px 14px rgba(0,0,0,0.25), 
				0 5px 5px rgba(0,0,0,0.22);  
				padding: 10px;
				margin-top: 15px;



				// position: fixed; bottom: 0; right: 10px; width: 360px; padding: 10px 20px;
				// box-sizing: content-box;
				// text-align: left; font-family: Helvetica, Arial, sans-serif;
				// background: #fff; box-shadow: 0px 0px 40px rgba(0,0,0,0.15);
				// z-index: ${mge.maxZIndex};
				// font-size: 12px; color: #666;
			}
			#mge_wnd * {
				line-height: 1.3; font-size: inherit; color: inherit;
				font-weight: normal; font-style: normal; font-family: inherit;
				cursor: default;
			}
			#mge_wnd a, #mge_wnd input[type=checkbox] { cursor: pointer; }

			// #mge_wnd .ct_minimize, 
			// #mge_wnd .ct_close {
			// 	display: block; cursor: pointer;
			// 	position: absolute; top: 0; right: 0; width: 32px; line-height: 32px;
			// 	font-size: 14px; text-align: center;
			// 	transition: color 0.3s, background 0.3s;
			// }
			#mge_wnd .ct_minimize { right: 32px; background: #fff; color: #0fb4d4; }
			#mge_wnd .ct_minimize:hover { background: #0fb4d4; color: #fff; }
			#mge_wnd .ct_minimize i {
				display: inline-block; cursor: pointer;
				transform: rotate(45deg); transition: transform 0.5s;
			}
			// #mge_wnd .ct_close { color: #f00; background: #fff0f0; }
			// #mge_wnd .ct_close:hover { color: #fff; background: #f00; }
			#mge_wnd .key {
				display: inline-block;
				font-family: monospace;
				background: #f7f7f7; color: #999;
				padding: 0 2px; margin: 0 2px;
				border: solid 1px #d5d5d5; border-radius: 3px;
			}
			#mge_wnd .ct_logo { font-size: 15px; font-weight: bold; }
			#mge_wnd .ct_logo.small { display: none; }
			#mge_wnd .ct_logo svg {
				fill: #666; vertical-align: -15%;
				transform: rotate(-240deg); transition: transform 1s;
			}
			#mge_wnd .ct_logo.anim svg { transform: rotate(0deg); }

			#mge_wnd .version { color: #bbb; }
			#mge_wnd .keys { font-size: 11px; overflow: hidden; margin-top: 4px; color: #bbb; }
			#mge_wnd .ct_settings { font-size: 11px; overflow: hidden; margin: 8px 0; color: #bbb; }
			#mge_wnd .ct_settings a { color: #999; }
			#mge_wnd .ct_settings a:hover { color: #666; }
			#mge_wnd .activationKeys { float: left; margin-left: -2px; }
			#mge_wnd .transposeKeys { 
				margin-bottom: 5px;
				 }
			#mge_current_elm {
				font-family: monospace; background: #f7f7f7; color: #d5d5d5; padding: 2px; margin: 10px 0;
				height: 84px; overflow: hidden;
			}
			#mge_current_elm .pathNode { color: #999; border-bottom: solid 2px rgba(0,0,0,0); }
			#mge_current_elm .pathNode.active { border-bottom: solid 2px #555; }

			#mge_elm_list { 
				// display: none; 
				margin: 0 px; 
				background: #f7f7f7; 
				border: solid 12px #f7f7f7; 
				border-width: 12px 0 12px 0; 
				height: 90px; 
				overflow: hidden; 
			}
			// #mge_elm_list.hasContent { display: block; }
			#mge_wnd.hasContent { display: inline-block; }
			#mge_elm_list table { border: 0; width: 100%; border-spacing: 0; }
			#mge_elm_list tr { border: 0; }
			#mge_elm_list tr.ct_heading td { color: #bbb; }
			#mge_elm_list td { padding: 0; border: 0; background: #f7f7f7; }
			#mge_elm_list tr:nth-child(even) td { background: #fcfcfc; }
			#mge_elm_list td:nth-child(1) { padding-left: 20px; }
			#mge_elm_list td:nth-child(2) { text-align: center; }
			#mge_elm_list td:nth-child(3) { padding-right: 20px; }
			#mge_elm_list tr:not(.ct_heading) td:nth-child(1) { font-family: monospace; font-size: 11px; }
			#mge_elm_list td input { display: inline; -webkit-appearance: checkbox; }
			#mge_elm_list td input:before, 
			#mge_elm_list td input:after { content: none; }
			#mge_elm_list .ct_edit_selector { font-family: sans-serif; float: right; opacity: 0; color: #0fb4d4; text-decoration: none; }
			#mge_elm_list .ct_edit_selector:hover { color: #000; }
			#mge_elm_list tr:hover .ct_edit_selector { opacity: 1; }
			#mge_elm_list a.ct_delete { color: #f00; padding: 4px; text-decoration: none; font-size: 14px; }
			#mge_elm_list a.ct_delete:hover { color: #fff; background: #f00; }

			#mge_wnd .ct_more { border-top: solid 1px #f7f7f7; margin: 0 -20px; padding-top: 12px; color: #bbb; font-size: 10px; text-align: center; }
			#mge_wnd .ct_more a { color: #0fb4d4; font-size: inherit; text-decoration: none; transition: color 0.5s; }
			#mge_wnd .ct_more a:hover { color: #000; }

			#mge_wnd.minimized { width: 147px; height: 12px; }
			#mge_wnd.minimized > * { display: none; }
			#mge_wnd.minimized .ct_minimize,
			// #mge_wnd.minimized .ct_close { display: block; }
			#mge_wnd.minimized .ct_minimize i { display: inline-block; transform: rotate(-135deg); }
			#mge_wnd.minimized .ct_logo.small { display: block; margin: -4px 0 0 -10px; }


			#ct_btns {
				width: 100%;
				text-align: center;
				margin-top: 15px;
			}





			.send_selected,
			.ct_btns_space,
			#mge_wnd .ct_close {
				display: inline-block;
				vertical-align: middle;
			}

			.ct_btns_space {
				width: 70px;
			}


			.send_selected > button,
			#mge_wnd .ct_close > button {
				text-align: center;
				font-size: 21px;
				width: 100px;
				height: 41px;
				border: 0;
			}




			.send_selected > button {
				background-color: #3498DB;

			}
			#mge_wnd .ct_close > button {
				background-color: #E67E22;
			}




			`
		];

		for (let i in mge.hiddenElements) {
			let selector = mge.hiddenElements[i].selector;
			if (selector == 'body' || selector == 'html') {

				// отключает удаление элемента

				// cssLines.push(selector + ' { background: transparent !important; }');
			} else {
				// cssLines.push(selector + ' { display: none !important; }');
			}
		}

		let styleElm = document.querySelector('#mge_styles');
		if (!styleElm) {
			styleElm = document.createElement('style');
			styleElm.type = "text/css";
			styleElm.id = "mge_styles";
			document.head.appendChild(styleElm);
		}

		while (styleElm.firstChild) {
		    styleElm.removeChild(styleElm.firstChild);
		}


		// если отключить, подсвечиваются блоки, но клик ничего не даёт
		styleElm.appendChild(document.createTextNode(cssLines.join('\n')));
	},

	updateElementList: function() {
		if (!mge.helpWindow) return;

		let elmList = document.querySelector('#mge_elm_list');
		let wind = document.querySelector('#mge_wnd');

		let line = "";

		if (mge.hiddenElements.length) {
			// !!! одиночный вызов строки позиции элемента
		
			// alert(mge.getPathHTML(mge.markedElement));
			line = mge.getPathHTML(mge.markedElement);

			// lines.push('<table><tr class="ct_heading"><td>Removed element</td><td>Remember?</td><td></td></tr>');



			// for (let elm of mge.hiddenElements) {
			// 	lines.push(`<tr>
			// 		<td class="ct_selector"><a href="" class="ct_edit_selector">edit</a>${escapeHTML(elm.selector)}</td>
			// 		<td><input type="checkbox"${elm.permanent ? ' checked' : ''}></td>
			// 		<td><a href="" class="ct_delete">✖</a>
			// 	</tr>`);
			// }

			// lines.push('</table>');
			elmList.classList.add('hasContent');
			wind.classList.add('hasContent');

		} else {
			elmList.classList.remove('hasContent');
			wind.classList.remove('hasContent');
		}
		
		// elmList.innerHTML = lines.join('\n');
		elmList.innerHTML = line

		function onChangePermanent () {
			var tr = closest(this, 'tr');
			let index = mge.hiddenElements.findIndex(elm => elm.selector == tr.selector);
			var hiddenElement = mge.hiddenElements[index];
			hiddenElement.permanent = this.checked;

			// mge.updateSavedElements();
		}

		function onDelete (e) {
			let tr = closest(this, 'tr');

			if (tr.selector) {
				let index = mge.hiddenElements.findIndex(elm => elm.selector == tr.selector);
			    mge.hiddenElements.splice(index, 1);
			}

			mge.updateCSS();
			mge.refreshOverlays();
			mge.updateElementList();
			// mge.updateSavedElements();

			e.preventDefault();
			e.stopPropagation();
		}

		function onEditSelector (e) {
			e.preventDefault();
			e.stopPropagation();

			let tr = closest(this, 'tr');

			if (tr.selector) {
				let hiddenElement = mge.hiddenElements.find(elm => elm.selector == tr.selector);
				let newSelector = prompt('Customize CSS selector\n\nhints:\n[id^="Abc"] matches #AbcWhatever\n[class*="Abc"] matches .somethingAbcSomething', hiddenElement.selector);
				if (newSelector) {
					hiddenElement.selector = newSelector;

					mge.updateCSS();
					mge.refreshOverlays();
					mge.updateElementList();
					// mge.updateSavedElements();
				}
			}
		}

		let i = -1;
		for (let tr of document.querySelectorAll('#mge_elm_list table tr')) {
			if (i < 0) { // skip heading
				i++;
				continue;
			}

			tr.selector = mge.hiddenElements[i].selector;

			tr.querySelector('input').addEventListener('change', onChangePermanent, false);
			tr.querySelector('a.ct_delete').addEventListener('click', onDelete, false);
			tr.querySelector('a.ct_edit_selector').addEventListener('click', onEditSelector, false);

			i++;
		}
	},

	updateSavedElements: function () {
		// сохраняет удаленные элементы. если отключить, перезагрузка страници восстанавливает всё.
		return;
		chrome.extension.sendMessage({
			action: 'set_saved_elms',
			website: location.hostname.replace(/^www\./, ''),
			data: JSON.stringify(mge.hiddenElements.filter(elm => elm.permanent)),
		});
	},

	loadSavedElements: function () {
		// эффект не заметен
		// return;
		chrome.extension.sendMessage({
			action: 'get_saved_elms',
			website: location.hostname.replace(/^www\./, ''),
		}, function (data) {
			mge.hiddenElements = JSON.parse(data);

			mge.updateCSS();
			mge.updateElementList();
		});

		chrome.extension.sendMessage({
			action: 'get_settings',
		}, function (data) {
			mge.settings = JSON.parse(data);
		});
	},

	// updateSettings: function() {
	// 	// эффект не заметен
	// 	return;
	// 	document.querySelector('#mge_opt_remember').textContent = mge.settings.remember ? 'yes' : 'no';
	// },

	saveSettings: function() {
		// эффект не заметен
		// return;

		chrome.extension.sendMessage({
			action: 'set_settings',
			data: JSON.stringify(mge.settings),
		});
	},
	
	activate: function() {
		if (!mge.helpWindow) mge.updateCSS();

		let div = document.createElement('div');
		div.setAttribute("id", "mge_wnd");
		document.body.appendChild(div);



			// <div class="keys">
			// 	<div class="transposeKeys">
			// 		<span class="key">Q</span>/<span class="key">W</span>: move up or down one level
			// 	</div>
			// </div>




		div.innerHTML = `
			<span class="ct_logo">Select area to track.</span>
			<div id="mge_current_elm">Select an element with the mouse</div>

			<div id="mge_elm_list"></div>
			<div id="ct_btns">
				<div class="send_selected"><button>✔️</button></div>
				<div class="ct_btns_space"></div>
				<div class="ct_close"><button>✖️</button></div>
			</div>

		`;

		div.querySelector('.send_selected').addEventListener('click', function (e) {
			// e.preventDefault();
			// e.stopPropagation();
			// var path_html = encodeURIComponent(mge.getPathHTML(mge.markedElement));
			var path_html = encodeURIComponent(mge.getPathHTML(mge.selectedElement));
			var url = encodeURIComponent(document.location.href);
			var line = "http://127.0.0.1:5002/add_title?url=" + url + "&path_html=" + path_html;
			alert(line);
			window.location = line;
			e.preventDefault();
		});

		div.querySelector('.ct_close').addEventListener('click', function (e) {
			mge.deactivate();
			e.preventDefault();
		});

		// div.querySelector('.ct_minimize').addEventListener('click', function (e) {
		// 	div.classList.toggle('minimized');
		// 	e.preventDefault();
		// });

		// div.querySelector('#mge_opt_remember').addEventListener('click', function (e) {
		// 	mge.settings.remember = this.textContent == 'no';
		// 	mge.saveSettings();
		// 	mge.updateSettings();
		// 	e.preventDefault();
		// });

		for (let elm of div.querySelectorAll('.ct_more a')) {
			elm.addEventListener('click', function (e) {

				mge.deactivate();
			});
		}
		
		mge.helpWindow = div;

		mge.updateElementList();
		// mge.updateSettings();
		
		mge.targetingMode = true;
		document.addEventListener('mouseover', mge.mouseover, true);
		document.addEventListener('mousemove', mge.mousemove);
		document.addEventListener('mousedown', mge.hideTarget, true);
		document.addEventListener('mouseup', mge.preventEvent, true);
		document.addEventListener('click', mge.preventEvent, true);
		
		// mge.helpWindow.style.display = "block";
		
		mge.addOverlays();
		
		chrome.extension.sendMessage({action: 'status', active: true});

		setTimeout(function () {
			let logoElm = document.querySelector('#mge_wnd .logo');
			logoElm && logoElm.classList.add('anim');
		}, 10);
	},
	
	deactivate: function() {
		mge.targetingMode = false;
		
		if (mge.markedElement) {
			mge.removeHighlightStyle(mge.markedElement);
		}
		mge.markedElement = false;
		
		mge.helpWindow.parentNode.removeChild(mge.helpWindow);
		
		document.removeEventListener('mouseover', mge.mouseover, true);
		document.removeEventListener('mousemove', mge.mousemove);
		document.removeEventListener('mousedown', mge.hideTarget, true);
		document.removeEventListener('mouseup', mge.preventEvent, true);
		document.removeEventListener('click', mge.preventEvent, true);
		
		mge.removeOverlays();
		
		chrome.extension.sendMessage({action: 'status', active: false});
	},
	
	toggle: function() {
		if (mge.targetingMode) mge.deactivate();
		else mge.activate();
	},
	
	addOverlays: function() {
		// add overlay over each iframe / embed
		// this is needed for capturing mouseMove over the whole document
		let elms = document.querySelectorAll("iframe, embed");

		for (i = 0; i < elms.length; i++) {
			let e = elms[i];
			let rect = e.getBoundingClientRect();

			let new_node = document.createElement("div");
			new_node.className="mge_overlay";
			//new_node.innerHTML = html;
			new_node.style.position = "absolute";
			new_node.style.left = rect.left +  window.scrollX + "px";
			new_node.style.top = rect.top + window.scrollY + "px";
			new_node.style.width = rect.width + "px";
			new_node.style.height = rect.height + "px";
			new_node.style.background = "rgba(255,128,128,0.2)";
			new_node.style.zIndex = mge.maxZIndex - 2;
			new_node.relatedElement = e;
			
			document.body.appendChild(new_node);
		};
	},
	
	removeOverlays: function() {
		let elms = document.querySelectorAll(".mge_overlay");
		for (i = 0; i < elms.length; i++) {
			let e = elms[i];
			e.parentNode.removeChild(e);
		};
	},

	refreshOverlays: function () {
		mge.removeOverlays();
		mge.addOverlays();
	},
	
	init: function() {
		document.addEventListener('keydown', mge.keyDown);
		document.addEventListener('keyup', mge.keyUp);
		
		chrome.extension.onMessage.addListener(function(msg, sender, responseFun) {
			if (msg.action == "toggle") {
				mge.toggle();
				responseFun(2.0);
			}
			else if (msg.action == "getStatus") {
				responseFun(mge.targetingMode);
			}
		});

		mge.loadSavedElements();
	}
}

mge.init();

function closest(el, selector) {
	var retval = null;
	while (el) {
		if (el.matches(selector)) {
			retval = el;
			break;
		}
		el = el.parentElement;
	}
	return retval;
}

function escapeHTML(str) {
	// return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
	// alert(mge.getPathHTML(mge.markedElement));
	return;
}

const cssFinder = function(){function e(e,t){if(e.nodeType!==Node.ELEMENT_NODE)throw new Error("Can't generate CSS selector for non-element node type.");if("html"===e.tagName.toLowerCase())return e.tagName.toLowerCase();var o={root:document.body,className:function(e){return!0},tagName:function(e){return!0},seedMinLength:1,optimizedMinLength:2,threshold:1e3};T=b({},o,t);var a=n(e,x.All,function(){return n(e,x.Two,function(){return n(e,x.One)})});if(a){var i=g(m(a,e));return i.length>0&&(a=i[0]),r(a)}throw new Error("Selector was not found.")}function n(e,n,r){for(var o=null,a=[],v=e,d=0,g=function(){var e=p(i(v))||p.apply(void 0,l(v))||p(u(v))||[c()],g=s(v);if(n===x.All)g&&(e=e.concat(e.filter(h).map(function(e){return f(e,g)})));else if(n===x.Two)e=e.slice(0,1),g&&(e=e.concat(e.filter(h).map(function(e){return f(e,g)})));else if(n===x.One){var m=(e=e.slice(0,1))[0];g&&h(m)&&(e=[f(m,g)])}for(var y=0,b=e;y<b.length;y++){var m=b[y];m.level=d}return a.push(e),a.length>=T.seedMinLength&&(o=t(a,r))?"break":(v=v.parentElement,void d++)};v&&v!==T.root.parentElement;){var m=g();if("break"===m)break}return o||(o=t(a,r)),o}function t(e,n){var t=g(d(e));if(t.length>T.threshold)return n?n():null;for(var r=0,o=t;r<o.length;r++){var i=o[r];if(a(i))return i}return null}function r(e){for(var n=e[0],t=n.name,r=1;r<e.length;r++){var o=e[r].level||0;t=n.level===o-1?e[r].name+" > "+t:e[r].name+" "+t,n=e[r]}return t}function o(e){return e.map(function(e){return e.penalty}).reduce(function(e,n){return e+n},0)}function a(e){switch(document.querySelectorAll(r(e)).length){case 0:throw new Error("Can't select any node with this selector: "+r(e));case 1:return!0;default:return!1}}function i(e){return""!==e.id?{name:"#"+_(e.id,{isIdentifier:!0}),penalty:0}:null}function l(e){var n=Array.from(e.classList).filter(T.className);return n.map(function(e){return{name:"."+_(e,{isIdentifier:!0}),penalty:1}})}function u(e){var n=e.tagName.toLowerCase();return T.tagName(n)?{name:n,penalty:2}:null}function c(){return{name:"*",penalty:3}}function s(e){var n=e.parentNode;if(!n)return null;var t=n.firstChild;if(!t)return null;for(var r=0;;){if(t.nodeType===Node.ELEMENT_NODE&&r++,t===e||!t.nextSibling)break;t=t.nextSibling}return r}function f(e,n){return{name:e.name+(":nth-child("+n+")"),penalty:e.penalty+1}}function h(e){return"html"!==e.name&&!e.name.startsWith("#")}function p(){for(var e=[],n=0;n<arguments.length;n++)e[n]=arguments[n];var t=e.filter(v);return t.length>0?t:null}function v(e){return null!==e&&void 0!==e}function d(e,n){void 0===n&&(n=[]);var t,r,o;return w(this,function(a){switch(a.label){case 0:if(!(e.length>0))return[3,5];t=0,r=e[0],a.label=1;case 1:return t<r.length?(o=r[t],[5,E(d(e.slice(1,e.length),n.concat(o)))]):[3,4];case 2:a.sent(),a.label=3;case 3:return t++,[3,1];case 4:return[3,7];case 5:return[4,n];case 6:a.sent(),a.label=7;case 7:return[2]}})}function g(e){return Array.from(e).sort(function(e,n){return o(e)-o(n)})}function m(e,n){var t,r;return w(this,function(o){switch(o.label){case 0:if(!(e.length>2&&e.length>T.optimizedMinLength))return[3,5];t=1,o.label=1;case 1:return t<e.length-1?(r=e.slice(),r.splice(t,1),a(r)&&y(r,n)?[4,r]:[3,4]):[3,5];case 2:return o.sent(),[5,E(m(r,n))];case 3:o.sent(),o.label=4;case 4:return t++,[3,1];case 5:return[2]}})}function y(e,n){return document.querySelector(r(e))===n}var b=this&&this.__assign||Object.assign||function(e){for(var n,t=1,r=arguments.length;t<r;t++){n=arguments[t];for(var o in n)Object.prototype.hasOwnProperty.call(n,o)&&(e[o]=n[o])}return e},w=this&&this.__generator||function(e,n){function t(e){return function(n){return r([e,n])}}function r(t){if(o)throw new TypeError("Generator is already executing.");for(;u;)try{if(o=1,a&&(i=a[2&t[0]?"return":t[0]?"throw":"next"])&&!(i=i.call(a,t[1])).done)return i;switch(a=0,i&&(t=[0,i.value]),t[0]){case 0:case 1:i=t;break;case 4:return u.label++,{value:t[1],done:!1};case 5:u.label++,a=t[1],t=[0];continue;case 7:t=u.ops.pop(),u.trys.pop();continue;default:if(i=u.trys,!(i=i.length>0&&i[i.length-1])&&(6===t[0]||2===t[0])){u=0;continue}if(3===t[0]&&(!i||t[1]>i[0]&&t[1]<i[3])){u.label=t[1];break}if(6===t[0]&&u.label<i[1]){u.label=i[1],i=t;break}if(i&&u.label<i[2]){u.label=i[2],u.ops.push(t);break}i[2]&&u.ops.pop(),u.trys.pop();continue}t=n.call(e,u)}catch(e){t=[6,e],a=0}finally{o=i=0}if(5&t[0])throw t[1];return{value:t[0]?t[1]:void 0,done:!0}}var o,a,i,l,u={label:0,sent:function(){if(1&i[0])throw i[1];return i[1]},trys:[],ops:[]};return l={next:t(0),throw:t(1),return:t(2)},"function"==typeof Symbol&&(l[Symbol.iterator]=function(){return this}),l},E=this&&this.__values||function(e){var n="function"==typeof Symbol&&e[Symbol.iterator],t=0;return n?n.call(e):{next:function(){return e&&t>=e.length&&(e=void 0),{value:e&&e[t++],done:!e}}}},N={},S=N.hasOwnProperty,A=function(e,n){if(!e)return n;var t={};for(var r in n)t[r]=S.call(e,r)?e[r]:n[r];return t},C=/[ -,\.\/;-@\[-\^`\{-~]/,L=/[ -,\.\/;-@\[\]\^`\{-~]/,O=/(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g,_=function e(n,t){t=A(t,e.options),"single"!=t.quotes&&"double"!=t.quotes&&(t.quotes="single");for(var r="double"==t.quotes?'"':"'",o=t.isIdentifier,a=n.charAt(0),i="",l=0,u=n.length;l<u;){var c=n.charAt(l++),s=c.charCodeAt(),f=void 0;if(s<32||s>126){if(s>=55296&&s<=56319&&l<u){var h=n.charCodeAt(l++);56320==(64512&h)?s=((1023&s)<<10)+(1023&h)+65536:l--}f="\\"+s.toString(16).toUpperCase()+" "}else f=t.escapeEverything?C.test(c)?"\\"+c:"\\"+s.toString(16).toUpperCase()+" ":/[\t\n\f\r\x0B:]/.test(c)?o||":"!=c?"\\"+s.toString(16).toUpperCase()+" ":c:"\\"==c||!o&&('"'==c&&r==c||"'"==c&&r==c)||o&&L.test(c)?"\\"+c:c;i+=f}return o&&(/^_/.test(i)?i="\\_"+i.slice(1):/^-[-\d]/.test(i)?i="\\-"+i.slice(1):/\d/.test(a)&&(i="\\3"+a+" "+i.slice(1))),i=i.replace(O,function(e,n,t){return n&&n.length%2?e:(n||"")+t}),!o&&t.wrap?r+i+r:i};_.options={escapeEverything:!1,isIdentifier:!1,quotes:"single",wrap:!1},_.version="1.0.1";var x;!function(e){e[e.All=0]="All",e[e.Two=1]="Two",e[e.One=2]="One"}(x||(x={}));var T;return e}();


// document.getElementById('picker_btn').addEventListener('click', function() {
//   chrome.tabs.executeScript({
//     file: 'alert.js'
//   }); 

// });