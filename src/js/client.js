(function() {
	var TV = (document.documentElement.getAttribute('data-user-mode') == 'tv');
	window.qad = new (class Qad {
		constructor(...args) {
			this.libs();
			let self = this;
			let scheme;
			if (scheme = window.localStorage.getItem('color_scheme'))
				document.documentElement.setAttribute('data-user-color-scheme', scheme);
			if (!('$' in window) && !('$$' in window)) {
				window.$ = self.$.bind(self);
				window.$$ = self.$$.bind(self);
			}
			Node.prototype.on = Window.prototype.on = function(event, callback, options) {
				if (event.constructor.name == 'Array') {
					for (let e of event) {
						this.addEventListener(e, callback, options);
					}
				}else
					this.addEventListener(event, callback, options);
				return this;
			}
			Node.prototype.off = Window.prototype.off = function(event, callback, options) {
				this.removeEventListener(event, callback, options);
				return this;
			}
			Node.prototype.emit = Window.prototype.emit = function(event, args=null) {
				this.dispatchEvent(new CustomEvent(event, {detail: args}));
				return this;
			}
			Element.prototype.$ = function(css) {
				return self.$(css, this);
			}
			Element.prototype.$$ = function(css) {
				return self.$$(css, this);
			}
			Element.prototype.html = function(string, text) {
				if (typeof(string) == 'undefined')
					return this[(text ? 'innerText' : 'innerHTML')];
				this[(text ? 'innerText' : 'innerHTML')] = string;
				return this;
			}
			window[((this.libs_ && (this.libs_.indexOf('HTMLDialogElement') > -1)) ? 'Element' : 'HTMLDialogElement')].prototype.popup = function(e) {
				let url = location.href,
					y = window.scrollY;
				let events = {
					click: e => ((e.target.tagName == 'DIALOG') && this.close()),
					// hashchange: e => (e.oldURL.match('#dialog_') && (this.id == e.oldURL.split('#dialog_')[1]) && this.close()),
					popstate: e => {
						if (location.hash != '#dialog_'+this.id)
							this.close();
					}
				};
				history.pushState(null, null, '#dialog_'+this.id);
				// location.hash = 'dialog_'+this.id;
				document.body.dataset.modal = true;
				if ((typeof(this.showModal) == 'undefined') && ('dialogPolyfill' in window))
					dialogPolyfill.registerDialog(this);
				this.showModal();
				document.documentElement.scrollTop = y;
				if (typeof(this.form) == 'undefined') {
					let se = this.$('section');
					this.form = this.$('form[method="dialog"]');
					if (TV && ('SpatialNavigation' in window)) {
						self.controller_.focus = e.target;
						[ self.controller_.aside, self.controller_.body ].forEach(c => SpatialNavigation.disable(c));
					}
					if ((!TV && se && (se.scrollHeight != se.offsetHeight)) || (TV && !this.form))
						this.classList.add('scrolled');
					Object.keys(events).forEach(ev => ((ev == 'popstate') ? window : this).on(ev, events[ev]));
					// this.on('click', e => ((e.target.tagName == 'DIALOG') && this.close()));
					this.$$('button:not([onclick])').forEach(el => el.on('click', e => {
						this.close(
							((e.target.type == 'submit') && e.target.value)
							? e.target.value
							: ((this.form && (e.target.type != 'reset')) ? new URLSearchParams(new FormData(this.form)).toString() : '')
						);
					}));
				}
				return new Promise((resolve) => this.on('close', e => {
					if (TV && ('SpatialNavigation' in window)) {
						[ self.controller_.aside, self.controller_.body ].forEach(c => SpatialNavigation.enable(c));
						if (self.controller_.focus && ('SpatialNavigation' in window))
							SpatialNavigation.focus(self.controller_.focus);
						this.returnValue = ((this.form && (e.target.type != 'reset')) ? new URLSearchParams(new FormData(this.form)).toString() : '');
					}
					history.replaceState(null, null, url);
					Object.keys(events).forEach(ev => ((ev == 'popstate') ? window : this).off(ev, events[ev]));
					delete this.form;
					delete document.body.dataset.modal;
					resolve(this.returnValue);
					this.returnValue = '';
				}, { once: true }));
			}
			Object.defineProperties(Node.prototype, {
				on: { enumerable: false },
				off: { enumerable: false },
				emit: { enumerable: false }
			});
			Object.defineProperties(Element.prototype, {
				$: { enumerable: false },
				$$: { enumerable: false },
				html: { enumerable: false },
				visible: {
					get() {
						let w = window, d = document.documentElement, p = this.getBoundingClientRect();
						return (
							((w.pageYOffset + p.bottom) > w.pageYOffset) &&
							((w.pageYOffset + p.top) < (w.pageYOffset + d.clientHeight)) &&
							((w.pageXOffset + p.right) > w.pageXOffset) &&
							((p.left > -1) && ((w.pageXOffset + p.left) < (w.pageXOffset + d.clientWidth)))
						);
					}
				},
				onrender: {
					get() {
						return new Function('event', this.getAttribute('onrender'));
					}
				}
			});
			Object.defineProperties(this, {
				color_theme: {
					get: () => (window._color_theme || getComputedStyle(document.documentElement).getPropertyValue('--theme').replace(/[^a-z0-9#-]+/gi,'')),
					set: (val) => {
						let c = this.color(val),
							l = c.luminance,
							header = this.$('body > header, body > .content > header');
						window._color_theme = c.hex;
						console.log(c);
						document.documentElement.style.setProperty('--theme', c.hex);
						document.documentElement.style.setProperty('--theme-rgb', c.rgb);
						document.documentElement.style.setProperty('--theme-light', c.light);
						document.documentElement.style.setProperty('--theme-dark', c.dark);
						document.documentElement.style.setProperty('--bcolor', ((((l > 1.05) ? ((l + 0.05) / 1.05) : ((1.05) / (l + 0.05))) >= 4.5) ? '#fff' : '#000'));
						if (header && (header.classList.contains('color') || header.classList.contains('prominent')))
							this.$('meta[name="theme-color"]').content = c.hex;
					},
					enumerable: true,
					configurable: true
				},
				color_scheme: {
					get: () => (getComputedStyle(document.documentElement).getPropertyValue('--scheme').replace(/[^a-z0-9#-]+/gi,'')),
					set: (val) => {
						window.localStorage.setItem('color_scheme', val);
						if (val == 'auto')
							document.documentElement.removeAttribute('data-user-color-scheme');
						else
							document.documentElement.setAttribute('data-user-color-scheme', val);
					},
					enumerable: true,
					configurable: true
				},
				reduced_motion: {
					get: () => (window._reduced_motion || location.search.split('reduced_motion=').slice(1).join().split('&').slice(0, 1).join() || getComputedStyle(document.documentElement).getPropertyValue('--motion').replace(/[^a-z0-9#-]+/gi,'')),
					set: (val) => {
						window._reduced_motion = val;
						if (val == 'auto')
							document.documentElement.removeAttribute('data-user-reduced-motion');
						else
							document.documentElement.setAttribute('data-user-reduced-motion', val);
					},
					enumerable: true,
					configurable: true
				}
			});
			(this.init = this.init_()).run();
		}
		libs(arr) {
			arr = (arr || [
				'AbortController',
				'Object.entries', 'Object.fromEntries', 'Object.values',
				'String.prototype.startsWith', 'String.prototype.endsWith',
				'Element.prototype.after', 'Element.prototype.append', 'Element.prototype.before', 'Element.prototype.prepend',
				'Element.prototype.closest', 'Element.prototype.matches',
				[ 'FormData.prototype.get', {
					js: [ 'https://cdn.jsdelivr.net/npm/formdata-polyfill@3.0.19/formdata.min.js' ]
				}],
				[ 'URLSearchParams', {
					js: [ 'https://unpkg.com/@ungap/url-search-params@0.1.4/min.js' ]
				}],
				[ `(document.createElement('link').relList.supports('preload') || undefined)`, {
					js: [ 'https://cdnjs.cloudflare.com/ajax/libs/loadCSS/2.1.0/cssrelpreload.js' ]
				}],
				[ 'HTMLDialogElement', {
					js: [ 'https://cdnjs.cloudflare.com/ajax/libs/dialog-polyfill/0.4.9/dialog-polyfill.min.js' ],
					css: [ 'https://cdnjs.cloudflare.com/ajax/libs/dialog-polyfill/0.4.9/dialog-polyfill.min.css' ]
				}]
			]).filter(lib => (new Function('try {return (typeof('+((typeof(lib) == 'string') ? lib : lib[0])+') == "undefined")} catch (e) {return true;}')()));
			if (arr.length) {
				if (!this.libs_)
					this.libs_ = [];
				let pio = [[], [], [], []];
				arr.forEach(lib => {
					if (typeof(lib) == 'string') {
						this.libs_.push(lib);
						pio[0].push(lib);
					}else{
						this.libs_.push(lib[0]);
						pio[1] = pio[1].concat((lib[1].js || []));
						pio[2] = pio[2].concat((lib[1].css || []));
						pio[3] = pio[3].concat((lib[1].replace || []));
					}
				});
				if (pio[0].length)
					pio[1].push('https://polyfill.io/v3/polyfill.js?features='+encodeURIComponent(pio[0].join(',')));
				pio.slice(1, -1).forEach((urls, i) => urls.forEach(url => {
					let request = new XMLHttpRequest();
					request.open('GET', url, false);
					request.send(null);
					if (request.status === 200) {
						let res = request.responseText;
						pio[3].forEach(rep => (res = res.replace(rep[0], rep[1])));
						if (i) {
							let s = document.createElement('style');
							s.innerHTML = res;
							document.head.append(s);
						}else
							(new Function(res))();
					}
				}));
			}
			return arr;
		}
		$(css, parent) {
			if (typeof(css) == 'string') {
				if ((css.slice(0, 1) == '<') && (css.slice(-1) == '>'))
					return document.createElement('template').html(css).content;
				return (parent || document).querySelector(css);
			}
		}
		$$ (css, parent) {
			return [].slice.call((parent || document).querySelectorAll(css), 0);
		}
		color(v) {
			let r = {},
				t = [],
				ar = [],
				lb = [];
			let r2h = r => '#'+((1 << 24)+((+r[0]) << 16)+((+r[1]) << 8)+(+r[2])).toString(16).slice(1);
			let rlr = v => {
				v = v.map(v => (((v /= 255) <= 0.04045) ? (v / 12.92) : Math.pow((v + 0.055) / 1.055, 2.4)));
				v = [
					((0.4124564 * v[0] + 0.3575761 * v[1] + 0.1804375 * v[2]) / 0.950470),
					((0.2126729 * v[0] + 0.7151522 * v[1] + 0.0721750 * v[2]) / 1),
					((0.0193339 * v[0] + 0.1191920 * v[1] + 0.9503041 * v[2]) / 1.088830)
				].map(v => ((v > 0.008856452) ? Math.pow(v, 1 / 3) : (v / 0.12841855 + 0.137931034)));
				v.push(116 * v[1] - 16);
				return [ 18, -18 ].map(v_ => [
					(((v[3] < 0) ? 0 : v[3]) + v_), (500 * (v[0] - v[1])), (200 * (v[1] - v[2]))
				]).map(lab => {
					let yxz = [ (lab[0] + 16) / 116 ];
					yxz = yxz.concat([
						(isNaN(lab[1]) ? yxz[0] : (yxz[0] + lab[1] / 500)),
						(isNaN(lab[2]) ? yxz[0] : (yxz[0] - lab[2] / 200))
					]).map(v => ((v > 0.206896552) ? (v * v * v) : (0.12841855 * (v - 0.137931034))));
					[ 1, 0.950470, 1.088830 ].forEach((v, i) => (yxz[i] = v * yxz[i]));
					return [
						(3.2404542 * yxz[1] - 1.5371385 * yxz[0] - 0.4985314 * yxz[2]),
						(-0.9692660 * yxz[1] + 1.8760108 * yxz[0] + 0.0415560 * yxz[2]),
						(0.0556434 * yxz[1] - 0.2040259 * yxz[0] + 1.0572252 * yxz[2])
					].map(v => (255 * ((v <= 0.00304) ? (12.92 * v) : (1.055 * Math.pow(v, 1 / 2.4) - 0.055)))).map(v => ((v < 0) ? 0 : ((v > 255) ? 255 : v)));
				});
			};
			if ((v = v.trim()).indexOf('#') == 0)
				r.hex = v;
			else if ((v.split(',').length-1) >= 2)
				r.rgb = v;
			else
				throw new Error();
			if (r.hex && (r.hex.length === 4))
				r.hex = '#'+Array(3).join(r.hex.substr(1, 1))+Array(3).join(r.hex.substr(2, 1))+Array(3).join(r.hex.substr(3, 1));
			if (!r.rgb)
				r.rgb = (ar = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(r.hex).slice(1).map(v => parseInt(v, 16))).join(', ');
			else
				r.hex = r2h(ar = r.rgb.split(','));
			lb = rlr(ar);
			r.light = r2h(lb[0]);
			r.dark = r2h(lb[1]);
			r.luminance = ar.map(v => (((v /= 255) <= 0.03928) ? v/12.92 : Math.pow(((v + 0.055) / 1.055), 2.4))).map((v, i) => ([
				0.2126, 0.7152, 0.0722
			][i] * v)).reduce((s, v) => (s + v), 0);
			return r;
		}
		snackbar(el, b, cb, force) {
			if (!this._snackbar)
				this._snackbar = [];
			if (!force)
				this._snackbar.push([el, b, cb]);
			if ((this._snackbar.length == 1) || force) {
				let _el;
				if (typeof(el) == 'string') {
					el = this.$('<div class="snackbar">'+(_el = el)+'</div>');
					if (b && cb)
						el.firstElementChild.append(this.$('<button>'+b+'</button>').firstElementChild.on('click', cb));
					this.$('.content').append((el = el.firstElementChild));
				}else{
					let _cl;
					if ((_cl = el.$('.material-icons')) && (_cl.innerText.trim() == 'close'))
						_cl.onclick = el.close;
				}
				el.close = () => {
					this._snackbar.shift();
					el.dataset.open = false;
					if (this._snackbar.length)
						setTimeout(() => this.snackbar(this._snackbar[0][0], this._snackbar[0][1], this._snackbar[0][2], true), 300);
					if (_el)
						setTimeout(() => el.remove(), 300);
				}
				console.log(el);
				el.dataset.open = true;
				setTimeout(() => el.close(), 5000);
			}
		}
		init_() {
			return {
				run: () => {
					let header = this.$('body > header, body > .content > header'),
						nav = (header && header.$('nav.tabs')),
						content = this.$('body > .content'),
						aside = this.$$('body > aside, main > aside'),
						onrender = this.$$('[onrender]'),
						onvisibilitychange = this.$$('[onvisibilitychange]');
					if (header) {
						this.init.header(header, nav);
						this.init.target(content, header, nav);
					}
					if (content)
						aside.forEach(el => this.init.sidenav(el, content, header));
					this.$$('form[data-google]').forEach(el => this.init.form(el));
					this.$$('.table').forEach(el => this.init.table(el));
					this.$$('.carousel').forEach(el => this.init.carousel(el));
					this.$$('.menu').forEach(el => this.init.menu(el));
					this.$$('a[target="_blank"]:not([rel])').forEach(el => (el.rel = 'noopener'));
					if (onrender.length)
						onrender.forEach(el => el.on('render', (new Function('qad', el.getAttribute('onrender'))).bind(el, this), { once: true }).emit('render'));
					if (onvisibilitychange.length) {
						let vcObserver = new IntersectionObserver((entries, observer) => {
							entries.forEach(entry => {
								entry.target.on('visibilitychange', (new Function('qad', entry.target.getAttribute('onvisibilitychange'))).bind(entry.target, this), {
									once: true
								}).emit('visibilitychange', {
									entry,
									kill: () => vcObserver.unobserve(entry.target)
								});
							});
						});
						onvisibilitychange.forEach(el => vcObserver.observe(el));
					}
					if (TV) {
						let timer,
							aside = document.createElement('aside'),
							ul = document.createElement('ul');
						aside.classList.add('tv');
						let add = el => {
							let div = el.closest('[id]'),
								h = el.previousElementSibling,
								pos = div.getBoundingClientRect(),
								li = document.createElement('li');
							h.classList.add('tv');
							li.textContent = h.textContent;
							li.dataset.link = div.id;
							div.classList.add('tv_link');
							ul.append(li.on('click',
								() => SpatialNavigation.focus(div.$('.carousel > div > *'))
							).on('focus',
								() => li.parentNode.parentNode.classList.add('active')
							).on('blur',
								() => {
									if (timer)
										clearTimeout(timer);
									timer = setTimeout(() => {
										if (!document.activeElement.closest('aside.tv, header'))
											li.parentNode.parentNode.classList.remove('active');
										timer = null;
									});
								}
							));
						}
						this.$$('main [id] > h2 ~ .carousel').forEach(el => add(el));
						if (ul.childElementCount)
							this.$$('[role="group"][aria-label]').forEach(el => {
								let div = this.$$('main [id].tv_link').slice(-1)[0],
									list = this.$('<div id="'+'_'+Math.random().toString(36).substr(2, 9)+'"><h2 class="'+div.$('h2').getAttribute('class')+'">'+el.getAttribute('aria-label')+'</h2><div class="carousel"><div></div></div></div>').firstElementChild;
								list.$('.carousel div').append(...[].slice.call(el.children).map(el_ => {
									el_.classList.add('card');
									el_.classList.remove('material-icons');
									el_.innerHTML = '<div class="media" style="--aspect-ratio:16/9;"><i class="material-icons">'+el_.innerHTML+'</i></div><h2>'+el_.title+'</h2><br>';
									return el_;
								}));
								div.after(list);
								add(list.$('.carousel'));
							});
						if (ul.childElementCount) {
							aside.append(ul);
							document.body.prepend(aside);
						}
						setTimeout(() => {
							let sn = () => {
								window.on('sn:willunfocus', e => {
									let card;
									if ((card = e.target.closest('.info')) && e.target.parentNode.classList.contains('tabs') && e.detail.nextElement && e.detail.nextElement.closest('.info') && !e.detail.nextElement.parentNode.classList.contains('tabs'))
										card.classList.add('scrolled');
									else if ((card = e.detail.nextElement) && card.parentNode.classList.contains('tabs') && (card = card.closest('.info')))
										card.classList.remove('scrolled');
									else if (e.target.closest('.info.fixed') && e.detail.nextElement && !e.detail.nextElement.closest('.info.fixed'))
										e.preventDefault();
								});
								window.on('sn:focused', e => {
									let nav, li, link, card;
									if (e.target.dataset.link)
										link = this.$('#'+(li = e.target).dataset.link);
									else{
										if (link = (card = e.target).closest('.tv_link'))
											li = this.$('[data-link="'+link.id+'"]');
										else if (!e.target.closest('dialog.scrolled') && (!(nav = e.target.closest('.info .nav')))) {
											if ((li = e.detail.previousElement) && li.closest('aside') && card.closest('label.input.extended'))
												aside.classList.add('active');
											// return;
										}
									}
									this.$$('.tv_link').forEach(el_ => (el_.style.filter = ((el_ == link) ? '' : 'brightness(0.5)')));
									(card || link).scrollIntoView({
										block: (((li && (li.parentNode.firstElementChild == li)) || nav) ? 'end' : 'center'),
										inline: (nav ? 'end' : 'center')
									});
									if (li && link)
										aside.scrollTop = li.offsetTop - (card || link).getBoundingClientRect().top;
								});
								window.on('sn:navigatefailed', e => {
									let el;
									if ((e.detail.direction == 'down') && (el = this.$('header[data-extended="focus"]')))
										aside.hidden = !(el.dataset.extended = 'blur');
								});
								window.on('sn:enter-down', e => {
									let el;
									if ((e.target.tagName == 'LI') && (el = e.target.$('input'))) {
										console.log(el);
										el.click();
									}else if (e.target.dataset.more_min && e.target.dataset.more_max) {
										let card = e.target.closest('.info');
										e.target.scrollTop = 0;
										if (card.classList.contains('fixed')) {
											card.classList.remove('fixed');
											card.scrollIntoView();
										}else
											card.classList.add('fixed');
									}else if ([ 'BUTTON', 'A' ].indexOf((el = e.target).tagName) == -1)
										el.emit('click');
								});
								this.controller_ = SpatialNavigation.init([
									{ selector: 'label.input.extended i, input, aside.tv li' },
									{ selector: 'a, [tabindex], button' },
									{ selector: 'dialog li', restrict: 'self-only' }
								]).reduce((r, e, i) => (r[[ 'aside', 'body', 'dialog' ][i]] = e, r), {});
							};
							if ('SpatialNavigation' in window)
								sn();
							else{
								let script = document.createElement('script');
								script.src = 'https://alex2844.github.io/js-spatial-navigation/spatial_navigation.min.js';
								script.on('load', () => sn());
								document.body.append(script);
							}
						}, 700);
					}
				},
				target: (content, header, nav) => {
					let _tabset = el => {
						if (!el)
							return false;
						let _a,
							npos = nav.getBoundingClientRect(),
							epos = el.getBoundingClientRect();
						if (_a = nav.$('.active'))
							_a.classList.remove('active');
						el.classList.add('active');
						if ((nav.clientWidth - epos.right) < 20)
							nav.scrollBy(epos.width, 0);
						else if (((epos.left - npos.left) < nav.scrollLeft) && ((epos.left - npos.left) < 20))
							nav.scrollBy(epos.width * -1, 0);
						content.scrollTop = 0;
					}
					if (nav) {
						header.dataset._tabs_scroll = (nav.scrollWidth > nav.clientWidth);
						window.on('resize', () => (header.dataset._tabs_scroll = (nav.scrollWidth > nav.clientWidth)));
					}else{
						let els = content.$$('[id^="scroll_"]');
						if (els.length)
							content.on(['mousewheel', 'pointercancel'], e => {
								let els_f = els.filter(el => el.visible);
								if (!els_f.length)
									location.hash = '';
								else if (location.hash.slice(1) != ((els[0] == els_f[0]) ? els_f[0] : els_f.slice(1)[0]).id)
									location.hash = ((els[0] == els_f[0]) ? els_f[0] : els_f.slice(1)[0]).id;
							}, { passive: true });
					}
					window.on('hashchange', () => {
						let sel;
						if (nav && (sel = nav.$('a[href^="'+location.hash+'"]')))
							_tabset(sel);
					}).on('load', () => {
						if (location.hash) {
							let sel;
							if (nav && (sel = nav.$('a[href^="'+location.hash+'"]')))
								_tabset(sel);
							else if (!nav && (sel = this.$(location.hash)))
								setTimeout(() => sel.scrollIntoView()); // content.scrollTop = content.scrollTop + sel.getBoundingClientRect().top - 200;
						}
					});
				},
				header: (header, nav) => {
					let h1 = header.$('h1'),
						h = header.clientHeight,
						d = true, ds = true,
						lsp = document.documentElement.scrollTop,
						cbt = 0,
						ext = header.$('.extended input');
					if (ext) {
						let mic = ext.previousElementSibling;
						if (TV)
							ext.parentNode.firstElementChild.on('click', () => {
								let aside;
								header.dataset.extended = 'focus';
								if (aside = this.$('aside.tv'))
									aside.hidden = true;
							});
						else
							ext.on('focus', () => (header.dataset.extended = 'focus')).on('blur', e => {
								setTimeout(() => (!mic.dataset.focus && (header.dataset.extended = 'blur')));
							});
						if (mic && (mic.innerText.trim() == 'mic'))
							mic.on('click', () => {
								mic.dataset.focus = true;
								Object.assign(new webkitSpeechRecognition(), {
									lang: navigator.language,
									onresult: event => {
										delete mic.dataset.focus;
										let s = ext.form && ext.form.$('[type="submit"]');
										ext.value = event.results[0][0].transcript;
										if (s)
											s.click();
									},
									onstart: () => {
										if (TV) {
											mic.style.setProperty('background-color', '#ff4343', 'important');
											mic.style.setProperty('color', '#eee', 'important');
										}else
											mic.style.setProperty('color', '#F44336', 'important');
									},
									onend: () => (header.dataset && (header.dataset.extended = 'focus') && mic.style.removeProperty('color') && mic.style.removeProperty('background-color'))
								}).start();
							});
					}
					let cfu = () => {
						let hoff = cbt < 0,
							hon = cbt > -h,
							ps = hoff && hon;
						if (ps) {
							d = false;
							if (nav) {
								if (lsp >= (header.clientHeight - nav.clientHeight - 8))
									cbt = -(header.clientHeight - nav.clientHeight - 8);
							}else if (header.classList.contains('prominent') && !header.classList.contains('fixed')) {
								if (lsp >= (header.clientHeight))
									cbt = -(header.clientHeight);
							}
						}else {
							if (!d)
								return (d = true);
							else if (ds !== hon) {
								ds = hon;
								return true;
							}
						}
						return ps;
					}
					this.$('head').append(this.$('<meta name="theme-color" content="'+((header.classList.contains('color') || header.classList.contains('prominent')) ? this.color_theme : getComputedStyle(document.documentElement).getPropertyValue('--background').replace(/[^a-z0-9#]+/gi,''))+'" />'));
					if (getComputedStyle(header).position == 'sticky')
						document.on('scroll', e => {
							if (this.reduced_motion == 'reduce')
								return;
							let sy = (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0);
							if (header.classList.contains('fixed') && !nav) {
								if (header.classList.contains('prominent')) {
									let csp = Math.max(sy, 0),
										diff = csp - lsp;
									lsp = csp;
									cbt -= diff;
									if (cbt > 0)
										cbt = 0;
									if (cfu()) {
										if (!h1.dataset.top)
											h1.dataset.top = +getComputedStyle(h1).marginTop;
										let offset = cbt + (+h1.dataset.top);
										if (Math.abs(offset) >= h)
											offset = -128;
										h1.style['margin-top'] = ((offset < 0) ? 0 : offset)+'px';
										if ((offset < 0) && !header.classList.contains('scrolled'))
											header.classList.add('scrolled');
										else if ((offset > 0) && header.classList.contains('scrolled'))
											header.classList.remove('scrolled');
									}
								}else{
									if (sy && !header.classList.contains('scrolled'))
										header.classList.add('scrolled');
									else if (!sy && header.classList.contains('scrolled'))
										header.classList.remove('scrolled');
								}
							}else{
								let csp = Math.max(sy, 0),
									diff = csp - lsp;
								lsp = csp;
								cbt -= diff;
								if (cbt > 0)
									cbt = 0;
								else if (Math.abs(cbt) > h)
									cbt = -h;
								if (cfu()) {
									let offset = cbt;
									if (Math.abs(offset) >= h)
										offset = -128;
									if (nav) {
										if (offset <= -(header.clientHeight - nav.clientHeight - 8)) {
											offset = -(header.clientHeight - nav.clientHeight - 8);
											if (!header.classList.contains('scrolled'))
												header.classList.add('scrolled');
										}else if (header.classList.contains('scrolled'))
											header.classList.remove('scrolled');
									}
									if (header.classList.contains('prominent') && (offset == 0) && (document.documentElement.scrollTop > 0))
										return;
									header.style.top = offset+'px';
								}
							}
						});
				},
				sidenav: (aside, content, header) => {
					let st, sx, sy, sw, px, py,
						fid = null,
						left = (aside.parentNode.tagName == 'BODY'),
						busy = false, once = false, lock = false,
						co = 0, cw = 0;
					let fc = el => {
						let el_ = el.closest('.carousel');
						if (el_)
							return ([].slice.call(el_.children).filter(el_ => (el_ == el)).length > 0);
						return true;
					}
					let ts = e => {
						if (busy || (fid !== null) || (e.touches.length !== 1) || !fc(e.target) || (!aside.visible && (
							(left && (e.touches[0].clientX >= 20)) ||
							(!left && (window.innerWidth - e.touches[0].clientX) >= 20)
						)))
							return;
						if (!aside.visible)
							e.preventDefault();
						fid = e.touches[0].identifier;
						st = e.timeStamp;
						sx = e.touches[0].clientX;
						sy = e.touches[0].clientY;
						sw = cw;
						once = lock = false;
						px = py = -999;
						document.body.style.setProperty('overscroll-behavior-x', 'contain');
						document.on('touchmove', tm).on(['touchcancel', 'touchend'], tf);
					}
					let tm = e => {
						for (let i = 0; i < e.changedTouches.length; i++) {
							if (fid === e.changedTouches[i].identifier) {
								let px_ = e.changedTouches[i].clientX,
									py_ = e.changedTouches[i].clientY;
								if (Math.abs(px_ - px) < 1 && Math.abs(py_ - py) < 1)
									return;
								px = px_;
								py = py_;
								if (aside.visible) {
									if (!lock && Math.abs(sx - px_) < Math.abs(sy - py_))
										return dtf(null);
									lock = true;
									if ((left && !once && (px_ > cw)) || (!left && !once && (px_ < window.innerWidth - aside.offsetWidth)))
										return;
								}
								once = true;
								if (left)
									expandTo(sw + (px_ - Math.min(sx, aside.offsetWidth)));
								else
									expandTo(sw - (px_ - Math.min(sx, window.innerWidth + aside.offsetWidth)));
								return;
							}
						}
					}
					let tf = e => {
						for (let i = 0; i < e.changedTouches.length; i++) {
							if (fid === e.changedTouches[i].identifier) {
								let px_ = e.changedTouches[i].clientX;
								let speedSwipe = (((aside.offsetWidth / 2) / (Math.abs(px_ - sx) / (e.timeStamp - st))) / 1000).toFixed(3),
									intent = (left ? ((sx - px_) > 0) : ((sx - px_) < 0));
								dtf(once ? (((aside.offsetWidth / 2.25) > (aside.offsetWidth - cw)) ? !(intent && speedSwipe < 2) : (!intent && speedSwipe < 2)) : null);
							}
						}
						document.body.style.removeProperty('overscroll-behavior-x');
					}
					let dtf = so => {
						if (so === true)
							aside.open();
						else if (so === false)
							aside.close();
						document.off('touchmove', tm).off('touchcancel', tf).off('touchend', ts);
						fid = null;
					}
					let setTransformX = px => {
						aside.style.transform = (((
							(left && (document.documentElement.clientWidth < 1024)) ||
							(!left && (document.documentElement.clientWidth < 640))
						) || aside.hidden) ? 'translate3d('+(left ? px : -px)+'px, 0, 0)' : null);
					}
					let expandTo = px => {
						document.body.dataset.modal = aside.dataset.open = !!(aside.style.display = 'flex');
						setTransformX((cw = px = Math.min(px, aside.offsetWidth)) - aside.offsetWidth);
						content.style.setProperty('--_co', (co = 0.32 * px / aside.offsetWidth));
					}
					let back = show => {
						return new Promise((resolve) => {
							let duration = 300,
								st = null;
							let animate = time => {
								let to, tt,
									tp = 0;
								if (st === null)
									st = time;
								else{
									if (this.reduced_motion == 'reduce')
										tp = duration;
									else
										tp = Math.min((time - st), duration);
								}
								if (show) {
									to = easeOutQuad(tp, co, 0.32 - co, duration);
									tt = easeOutQuad(tp, cw, aside.offsetWidth - cw, duration);
								}else{
									to = co - easeOutQuad(tp, 0, co, duration);
									tt = cw - easeOutQuad(tp, 0, cw + 30, duration);
								}
								setTransformX((-1 * aside.offsetWidth) + tt);
								if (document.documentElement.clientWidth < 1024)
									content.style.setProperty('--_co', to);
								if (tp < duration)
									requestAnimationFrame(animate);
								else{
									if (show) {
										co = 0.32;
										cw = aside.offsetWidth;
									}else{
										co = 0;
										cw = 0;
									}
									resolve();
								}
							}
							requestAnimationFrame(animate);
						});
					}
					let easeOutQuad = (t, b, c, d) => {
						t /= d;
						return -c * t * (t - 2) + b;
					}
					aside.open = () => {
						aside.style.display = 'flex';
						if ((left && (document.documentElement.clientWidth < 1024)) || (!left && (document.documentElement.clientWidth < 640)))
							aside.dataset.open = true;
						return (busy ? Promise.reject() : back((busy = !(aside.hidden = false))).then(function() {
							if (aside.dataset.open)
								document.body.dataset.modal = aside.dataset.open = !!content.on('click', aside.close);
							busy = false;
						}));
					}
					aside.close = () => {
						return (busy ? Promise.reject() : back(!(busy = aside.hidden = true)).then(function() {
							content.off('click', aside.close);
							delete aside.dataset.open;
							delete document.body.dataset.modal;
							aside.style.display = 'none';
							busy = false;
						}));
					}
					aside.style.opacity = 1;
					if (left)
						header.prepend(this.$('<button class="material-icons" title="Главное меню">menu</button>').firstElementChild.on('click', e => {
							aside[(aside.visible ? 'close' : 'open')]();
						}));
					else{
						let h3 = aside.children[0];
						if (h3 && (h3.tagName == 'H3')) {
							if (h3.dataset.icon) {
								let nav = header.$('nav'),
									btn = this.$('<button class="material-icons" title="'+h3.textContent.trim()+'">'+h3.dataset.icon+'</button>').firstElementChild.on('click', e => {
										aside[(aside.visible ? 'close' : 'open')]();
									});
								if (nav)
									nav.before(btn);
								else
									header.append(btn);
							}
							h3.append(this.$('<i class="material-icons">close</i>').firstElementChild.on('click', () => aside.close()));
						}
					}
					setTransformX((-1 * aside.offsetWidth) - 30);
					window.on('resize', e => (setTransformX((-1 * aside.offsetWidth) - 30)));
					document.on('touchstart', ts, { passive: false });
				},
				form: el => (new IntersectionObserver((entries, observer) => {
					if (entries[0].isIntersecting) {
						observer.unobserve(entries[0].target);
						fetch('https://google-form-exporter.herokuapp.com/formdress?url=https://docs.google.com/forms/d/e/'+el.dataset.google+'/viewform').then(d => d.json()).then(d => {
							if (d.Error)
								return el.innerText = d.Error;
							let body = '';
							let types = [
								'input', 'textarea', 'radio', 'select', 'checkbox', 'linear', 'title', 'grid', 'section', 'date', 'time', 'image', 'video'
							];
							if (!el.getAttribute('action'))
								el.action = 'https://docs.google.com/forms/u/0/d/e/1FAIpQLSeLYwB43NtEnsgWZ1aWsbsFTiJocK0TrOAJYbqtfGqiEqE-ug/formResponse';
							if (!el.getAttribute('method'))
								el.method = 'POST';
							body += '<h2>'+d.header+'</h2>';
							if (d.desc)
								body += '<small>'+d.desc+'</small><hr />';
							if (d.askEmail)
								body += '<label class="input full"><input type="emailAddress" placeholder=" " required /><span>Email</span></label>';
							d.fields.forEach(f => {
								let type = types[f.typeid];
								if (type == 'input')
									body += '<label class="input full"><input type="text" name="entry.'+f.widgets[0].id+'" placeholder="'+(f.desc || ' ')+'" '+(f.widgets[0].required ? 'required' : '')+' /><span>'+f.label+'</span></label>';
								else if (type == 'textarea')
									body += '<label class="input full"><textarea name="entry.'+f.widgets[0].id+'" placeholder="'+(f.desc || ' ')+'" '+(f.widgets[0].required ? 'required' : '')+'></textarea><span>'+f.label+'</span></label>';
								else if ((type == 'radio') || (type == 'checkbox')) {
									body += '<fieldset><legend>'+f.label+'</legend>';
									f.widgets[0].options.forEach((c, i) => {
										if (!c.custom)
											body += '<label class="'+type+'"><input type="'+type+'" name="entry.'+f.widgets[0].id+'" value="'+c.label+'" '+(((i == 0) && (type == 'radio') && f.widgets[0].required) ? 'required' : '')+' /><span>'+c.label+'</span></label>';
										else{
											body += '<label class="'+type+'"><input type="'+type+'" name="entry.'+f.widgets[0].id+'" value="__other_option__" '+(((i == 0) && (type == 'radio') && f.widgets[0].required) ? 'required' : '')+' /><span></span></label>';
											body += '<label class="input"><input type="text" name="entry.'+f.widgets[0].id+'.other_option_response" placeholder="'+(f.desc || ' ')+'" /></label>';
										}
									});
									body += '</fieldset>';
								}else if (type == 'select') {
									body += '<label class="select full"><select name="entry.'+f.widgets[0].id+'" '+(f.widgets[0].required ? 'required' : '')+'><option value="" disabled selected>'+f.desc+'</option>';
									f.widgets[0].options.forEach(c => {
										body += '<option>'+c.label+'</option>';
									});
									body += '</select><span>'+f.label+'</span></label>';
								}else if (type == 'linear')
									body += '<label class="range full"><input type="range" name="entry.'+f.widgets[0].id+'" min="'+f.widgets[0].options[0].label+'" max="'+f.widgets[0].options.slice(-1)[0].label+'" /><span>'+f.label+'</span></label>';
								else if (type == 'grid') {
									body += '<fieldset><legend>'+f.label+'</legend>';
									f.widgets.forEach(w => {
										body += '<div><span>'+w.name+': </span>';
										w.columns.forEach((c, i) => {
											body += '<label class="radio"><input type="radio" name="entry.'+w.id+'" value="'+c.label+'" '+(((i == 0) && (type == 'radio') && f.widgets[0].required) ? 'required' : '')+' /><span>'+c.label+'</span></label>';
										});
										body += '</div>';
									});
									body += '</fieldset><br />';
								}else if (type == 'title')
									body += '<p>'+f.label+(f.desc ? '<br /><small>'+f.desc+'</small>' : '')+'</p>';
								else if (type == 'section')
									body += '<h2>'+f.label+'</h2>'+(f.desc ? '<small>'+f.desc+'</small><hr />' : '');
								else if ((type == 'date') || (type == 'time')) {
									body += '<label class="input _filled full">';
									[
										(f.widgets[0].options.year && 'year'), ((type == 'date') && 'month'), ((type == 'date') && 'day'), ((f.widgets[0].options.time || (type == 'time')) && 'hour'), ((f.widgets[0].options.time || (type == 'time')) && 'minute'), (f.widgets[0].options.duration && 'second')
									].filter(c => c).forEach(c => (body += '<input type="number" name="entry.'+f.widgets[0].id+'_'+c+'" placeholder="'+c+'" '+(f.widgets[0].required ? 'required' : '')+' style="width: 100px; '+((c == 'year') ? 'border-right: 0;' : (((type == 'date') && (c == 'hour')) ? 'margin-left: 50px;' : ''))+'" />'));
									body += '<span>'+f.label+'</span></label>';
								}else if (type == 'image')
									body += '<img src="'+f.widgets[0].src+'" alt="'+f.title+'" title="'+f.label+'" loading="lazy" style="max-width: 100%" />';
								else if (type == 'video')
									body += '<iframe width="560" height="315" src="'+f.widgets[0].src+'" title="'+f.label+'" style="max-width: 100%" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>';
								else{
									console.log(type, f);
								}
							});
							body += '<input type="hidden" name="fvv" value="1"><input type="hidden" name="fbzx" value="'+d.fbzx+'"><input type="hidden" name="pageHistory" value="'+[...Array(d.sectionCount).keys()].join(',')+'"><input type="submit" />';
							el.innerHTML = body;
							if (!el.getAttribute('target'))
								el.on('submit', e => {
									e.preventDefault();
									fetch(el.action, {
										method: 'POST',
										body: new FormData(el)
									});
									if (el.dataset.result)
										el.innerHTML = '<h2>'+d.header+'</h2>'+el.dataset.result;
									else
										el.reset();
								});
						});
					}
				})).observe(el),
				table: table => {
					let fp, fn, ft, fs,
						table_ = table.$('table'),
						footer = table.$('footer');
					if (!table_) {
						table.append(this.$('<div class="scroll"><table><thead></thead><tbody></tbody></table></div>').firstElementChild);
						table_ = table.$('table');
					}
					if (table.dataset.array)
						table_.innerHTML = '<tbody>'+(table.dataset.array.startsWith('[[') ? JSON.parse(table.dataset.array) : window[table.dataset.array]).map(tr => {
							return '<tr>'+tr.map(td => '<td>'+td+'</td>').join('')+'</tr>';
						}).join('')+'</tbody>';
					else if (table.dataset.google && !table.dataset.google_load)
						return (new IntersectionObserver((entries, observer) => {
							if (entries[0].isIntersecting) {
								observer.unobserve(entries[0].target);
								return fetch('https://spreadsheets.google.com/feeds/cells/'+table.dataset.google+'/1/public/values?alt=json').then(d => d.json()).then(d => {
									let head = '',
										body = '';
									let arr = d.feed.entry.reduce((arr, cur) => {
										while (arr.length < cur.gs$cell.row) {
											arr.push([]);
										}
										let cur_ = arr[arr.length - 1];
										while ((cur_.length + 1) < cur.gs$cell.col) {
											cur_.push('');
										}
										cur_.push(cur.content.$t);
										return arr;
									}, []);
									for (let i in arr) {
										if (i == 0)
											head += '<tr>'+arr[i].map(v => '<th>'+v+'</th>').join('')+'</tr>';
										else
											body += '<tr>'+arr[i].map(v => '<td>'+v+'</td>').join('')+'</tr>';
									}
									table_.innerHTML = '<thead>'+head+'</thead><tbody>'+body+'</tbody>';
									this.init.table(table, (table.dataset.google_load = true));
								});
							}
						})).observe(table);
					let thc = ((table_.tHead && table_.tHead.rows.length) ? table_.tHead.rows[0].cells[0].$('[type="checkbox"]') : null);
					let sort = (th, recover) => {
						if (th.hasAttribute('data-nosort') || th.closest('[data-nosort]') || th.classList.contains('material-icons'))
							return;
						if (th.tagName != 'TH')
							th = th.closest('th');
						let collator = new Intl.Collator(['en', 'ru'], { numeric: true });
						table_.tBodies[0].append(...[].slice.call(table_.tBodies[0].rows).sort(((i, order) => (a, b) => {
							return (order * collator.compare(a.children[i].innerHTML, b.children[i].innerHTML));
						})([].slice.call(th.parentNode.cells).indexOf(th), (th.dataset.order = (recover ? th.dataset.order : -(th.dataset.order || -1))))));
						for (let cell of th.parentNode.cells) {
							cell.classList.toggle('sorted', cell === th);
						}
						if (table.dataset.page && (table.dataset.page = 1))
							paginator([].slice.call(table_.tBodies[0].rows).forEach(tr => (tr.style.display = tr.dataset.display)));
					}
					let paginator = () => {
						if (!table.dataset.page)
							table.dataset.page = 1;
						let pages,
							page = +table.dataset.page,
							rows = +table.dataset.rows,
							trs = [].slice.call(table_.tBodies[0].children);
						if ((pages = (((rows = (rows || 10)) > 0) ? Math.ceil(trs.length / rows) : 1)) < 1)
							pages = 1;
						if (page > pages)
							page = pages;
						if (page < 1)
							page = 1;
						for (let i=0; i<trs.length; ++i) {
							if (typeof(trs[i]['data-display']) == 'undefined')
								trs[i]['data-display'] = (trs[i].style.display || '');
							if ((rows > 0) && !((i < (page * rows)) && (i >= ((page - 1) * rows))))
								trs[i].style.display = 'none';
							else
								trs[i].style.display = trs[i]['data-display'];
						}
						if (!footer) {
							footer = this.$('<footer>').firstElementChild;
							let fs_ = this.$('<label><span>Строк на странице:</span></label>').firstElementChild;
							fs_.append(this.$('<select>'+[10, 20, 30, 40, 50, -1].concat([rows]).filter((v, pos, self) => (self.indexOf(v) == pos)).sort((a, b) => (a - b)).map(v => {
								return '<option value="'+v+'" '+((v == rows) ? 'selected' : '')+'>'+((v == -1) ? 'Все' : v)+'</option>';
							})+'</select>').firstElementChild.on('change', e => paginator(table.dataset.rows = e.target.value)));
							footer.append(fs_);
							footer.append((ft = this.$('<span>').firstElementChild));
							footer.append((fp = this.$('<a tabindex="0"><i class="material-icons">chevron_left</i></a>').firstElementChild.on('click', () => paginator(--table.dataset.page))));
							footer.append((fn = this.$('<a tabindex="0"><i class="material-icons">chevron_right</i></a>').firstElementChild.on('click', () => paginator(++table.dataset.page))));
							table.append(footer);
						}
						ft.innerText = ((rows == -1) ? '' : ((page - 1) * rows + 1)+' - '+(page * rows)+' из '+trs.length);
						if (page == 1)
							fp.setAttribute('aria-disabled', true);
						else
							fp.removeAttribute('aria-disabled');
						if (page == pages)
							fn.setAttribute('aria-disabled', true);
						else
							fn.removeAttribute('aria-disabled');
					}
					let aria = el => {
						if (el)
							el.closest('tr').setAttribute('aria-selected', el.checked);
						let s = [].slice.call(table_.tBodies[0].rows).map(row => {
							if (!el)
								row.setAttribute('aria-selected', row.cells[0].$('[type="checkbox"]').checked);
							return row.getAttribute('aria-selected');
						}).filter((v, pos, self) => (self.indexOf(v) == pos));
						if (!(thc.indeterminate = (s.length == 2)))
							thc.checked = (s[0] == 'true');
					}
					table.filter = func => [].slice.call(table_.tBodies[0].rows).forEach(row => (row.style.display = (func(row) ? '' : 'none')));
					if (table.classList.contains('sort') && table_.tHead) {
						let th_ = table.$('thead th[data-order]');
						if (th_)
							sort(th_, th_.dataset.order);
						table_.tHead.on('click', e => sort(e.target));
					}
					if (table.dataset.rows)
						paginator(table_);
					if (thc) {
						aria();
						thc.onchange = () => [].slice.call(this.$('table').tBodies[0].rows).forEach(row => row.setAttribute('aria-selected', (row.cells[0].$('[type="checkbox"]').checked = thc.checked)));
						table_.tBodies[0].onchange = e => {
							if ((e.target.closest('tr').children[0] == e.target.closest('td')) && (e.target.type == 'checkbox'))
								aria(e.target);
						}
					}
				},
				carousel: el => {
					let _timer = null,
						_loop = null,
						div = el.$('div'),
						lazy = div.$$('img, video'),
						prev = el.$('.prev'),
						next = el.$('.next');
					if (prev && next) {
						let timer = (cb, _cb) => {
							if (_timer) {
								clearTimeout(_timer);
								_timer = null;
							}else if (_cb)
								_cb();
							_timer = setTimeout(() => cb(_timer = null), 300);
						};
						(el.state = () => {
							prev.hidden = (div.scrollLeft == 0);
							next.hidden = (div.offsetWidth + div.scrollLeft >= div.scrollWidth);
						})();
						el.prev = () => (div.scrollLeft -= (div.clientWidth / 1.5));
						el.next = () => (div.scrollLeft += (div.clientWidth / 1.5));
						lazy.forEach(_el => _el.on('load', e => timer(el.state), { once: true }));
						div.on('scroll', () => {
							timer(() => {
								document.body.style.removeProperty('overscroll-behavior-x');
								el.state();
							}, () => document.body.style.setProperty('overscroll-behavior-x', 'contain'));
						});
						prev.on('click', () => el.prev());
						next.on('click', () => el.next());
						if (el.dataset.scroll == 'auto') {
							let lr, hover;
							let loop = () => {
								if (hover)
									return;
								if ((!lr || (lr == 'right') || prev.hidden) && !next.hidden)
									el.next(lr = 'right');
								else if (((lr == 'left') || next.hidden) && !prev.hidden)
									el.prev(lr = 'left');
								else
									clearInterval(_loop);
							};
							el.on('mouseout', () => (hover = false));
							el.on('mouseover', () => (hover = true));
							return (new IntersectionObserver((entries, observer) => {
								if (entries[0].isIntersecting)
									_loop = setInterval(() => loop(), 3000);
								else
									clearInterval(_loop);
							})).observe(el);
						}
					}
				},
				menu: el => {
					if (el.closest('nav.tabs'))
						el.on('focus', () => {
							if (!el.dataset.menu) {
								let s = this.$('<span class="menu" tabindex="-1"></span>').firstElementChild;
								s.dataset.link_menu = el.dataset.menu = (new Date()).getTime();
								s.append(el.$('ul'));
								this.$('body').append(s);
							}
							let p = JSON.parse(JSON.stringify(el.getBoundingClientRect())),
								el_ = this.$('.menu[data-link_menu="'+el.dataset.menu+'"]');
							if (p.left < 0) {
								el.parentNode.scrollBy(p.left, 0);
								p.left = 0;
							}else if (window.innerWidth < (p.left + p.width)) {
								el.parentNode.scrollBy((p.right - window.innerWidth), 0);
								// p.left -= (p.right - window.innerWidth);
								// p.right = 0;
								p.left = null;
								p.right = 35;
							}else if ((p.width < 128) && ((p.left + 128 + 35) > window.innerWidth)) {
								// p.left = window.innerWidth - 128;
								p.left = null;
								p.right = 10;
								p.width = 128;
							}
							el_.dataset.layout = (((p.left != null) && (window.innerWidth / 2) > (p.left + p.width)) ? 'left' : 'right');
							if (p.left != null)
								el_.style.left = p.left+'px';
							if (p.right != null)
								el_.style.right = p.right+'px';
							el_.style.top = p.top+'px';
							el_.style.width = p.width+'px';
							el_.style.position = 'absolute';
							el_.style.zIndex = 4;
							el_.focus();
						});
					el.$$('ul li').forEach(ell => {
						if (!ell.parentNode.classList.contains('submenu'))
							ell.on('click', e => {
								let s;
								if (s = el.$('input')) {
									s.value = ell.innerText;
									if (s = el.$('li[aria-selected="true"]'))
										s.setAttribute('aria-selected', false);
									ell.setAttribute('aria-selected', true);
								}
								setTimeout(() => document.activeElement.blur());
							});
						else if (matchMedia('(hover: none)').matches)
							ell.on('touchstart', e => {
								let el_ = e.target.firstElementChild;
								if (!el_)
									return;
								e.stopPropagation();
								e.preventDefault();
								el_.classList.add('active');
								document.body.on('click', function handler(ev) {
									el_.classList.remove('active');
									this.off('click', handler);
								});
							});
					});
				}
			}
		}
		encodeHTML(d) {
			return document.createElement('a').appendChild(document.createTextNode(d)).parentNode.innerHTML;
		}
		decodeHTML(d) {
			let el = document.createElement('a'); 
			el.innerHTML = d;
			return el.textContent;
		}
		autocomplete(el) {
			if (el.controller_)
				el.controller_.abort();
			if (el.value && (el.value != el.value_))
				fetch(el.dataset.api+(el.value_ = el.value), {
					signal: (el.controller_ = new AbortController()).signal
				}).then(d => d.json()).then(d => {
					if (TV) {
						let list = el.list.parentNode.$('section .carousel div');
						if (!list) {
							el.parentNode.append(this.$('<section><div class="carousel"><div></div></div></section>'));
							list = el.list.parentNode.$('section .carousel div');
						}else
							list.innerHTML = '';
						d.forEach(v => list.append(
							this.$('<div class="card" tabindex="-1">'+
								(v.img ? '<div class="media" style="--aspect-ratio:1/1.441;"><img src="'+v.img+'" loading="lazy" /></div>' : '')+
								(v.title ? '<h2>'+v.title+'</h2><h3>'+v.value+'</h3>' : '<h2>'+v.value+'</h2><br />')+
							'</div>').firstElementChild.on('click', () => {
								let s = el.form && el.form.$('[type="submit"]');
								el.value = v.value;
								if (s)
									s.click();
							})
						));
					}else{
						el.list.innerHTML = '';
						d.forEach(v => el.list.append(new Option((v.title || v.value), v.value)));
					}
				}).catch(err => {
					if (err.name != 'AbortError')
						throw err;
				});
		}
	})();
	console.log(window.qad);
})();
