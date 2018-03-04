(function($, rb) {
	initilization = function() {
		var pushState = history.pushState;
		rivets.configure({

		  // Attribute prefix in templates
		  prefix: 'rv',

		  // Preload templates with initial data on bind
		  preloadData: true,

		  // Root sightglass interface for keypaths
		  rootInterface: '.',

		  // Template delimiters for text bindings
		  templateDelimiters: ['{{', '}}'],

		  // Alias for index in rv-each binder
		  iterationAlias : function(modelName) {
		    return '%' + modelName + '%';
		  },

		  // Augment the event handler of the on-* binder
		  handler: function(target, event, binding) {
		    this.call(target, event, binding.view.models)
		  },

		  // Since rivets 0.9 functions are not automatically executed in expressions. If you need backward compatibilty, set this parameter to true
		  executeFunctions: false

		});
		Array.prototype.diff = function(a) {
		    return this.filter(function(i) {return a.indexOf(i) < 0;});
		};
		getRouteSlideByIndex = function(index) {
			return document.getElementsByClassName('route-slider')[index];
		};
		$.fn.removeClassExceptThese = function(classList) {
			var $elem = $(this);
			if($elem.length > 0) {
				var existingClassList = $elem.attr("class").split(' ');
				var classListToRemove = existingClassList.diff(classList);
				$elem
					.removeClass(classListToRemove.join(" "))
					.addClass(classList.join(" "));
			}
			return $elem;
		};
		whichTransitionEvent = function(){
		  var t,
		    el = document.createElement("fakeelement");

		  var transitions = {
		    "transition"      : "transitionend",
		    "OTransition"     : "oTransitionEnd",
		    "MozTransition"   : "transitionend",
		    "WebkitTransition": "webkitTransitionEnd"
		  }

		  for (t in transitions){
		    if (el.style[t] !== undefined){
		      return transitions[t];
		    }
		  }

		};

		/* 
			Added By: Brijesh Kumar
			Date: 17/05/2017
			Descriptio: For rendering template using hanlderbar templating system
		*/

		render = function(templateElement, el, data) {
			var moveToSlider = getRouteSlideByIndex(Router.routeTo.index);
			var currentSlider = getRouteSlideByIndex(Router.currentRoute.index);
			var moveToSliderContainer = moveToSlider.getElementsByClassName('route-slider-container');
			
			var previousRouteIndex = -1;
			var nextRouteIndex = -1;
			
			if(Router.routeTo.index > 0) {
				previousRouteIndex = (Router.routeTo.index - 1)
			}

			if(Router.routeTo.index < (Router.routes.length - 1))  {
				nextRouteIndex = (Router.routeTo.index + 1)
			}

			Router.activeAnimaion = Router.activeAnimaion || Router.animations.push;
			
			if(Router.currentOperation === "pop") {
				$(currentSlider).addClass(Router.activeAnimaion);
			}
			else {
				$(moveToSlider).addClass(Router.activeAnimaion);
			}

			if(Router.beforeLoadAnimation) {
				Router.showLoader();
			}

			rivets.bind(moveToSlider, data);
			
			if(Router.beforeLoadAnimation) {
				Router.hideLoader();
			}

			setTimeout(function() {
				var $moveToSliderPrev = $(moveToSlider).prev();
				var $moveToSliderNext = $(moveToSlider).next();

				if(Router.currentOperation === "pop") {
					$(currentSlider)
						.addClass("animating")
						.removeClass("current-slider")
						.addClass("slide");
					$(currentSlider).one(whichTransitionEvent(),
						function(event) {
							afterAnimationEnd($(currentSlider));					
					});
				} else {
					$moveToSliderPrev
						.addClass("prev-animation");

					$(moveToSlider)
						.addClass("animating")
						.removeClass("next-slider")
						.addClass("slide");

					$(moveToSlider).one(whichTransitionEvent(),
						function(event) {
						afterAnimationEnd($(moveToSlider));
					});
				}

				function afterAnimationEnd($actingElement) {
					$actingElement.removeClass("animating");

					$moveToSliderNext
						.removeClassExceptThese(["route-slider","next-slider"])
						.nextAll()
						.removeClassExceptThese(["route-slider"]);

					if(Router.currentOperation === "push") {
						$(moveToSlider)
							.removeClass("prev-slider");
					}
					
					$moveToSliderPrev
						.removeClassExceptThese(["route-slider","prev-slider"])
						.prevAll()
						.removeClassExceptThese(["route-slider"]);

					$(moveToSlider)
						.removeClassExceptThese(["route-slider","current-slider"]);
				}
			},0);
		},
		updateTemplate = function() {
			var currentSlider = document.getElementsByClassName('route-slider')[Router.currentRoute.index];
			rivets.bind(currentSlider, Router.currentRoute.data);
		}
	};

	/*  
		added By: Brijesh Kumar
		Date: 17/05/2017
		Description: for getting route object using routeName
	*/

	getRouteObject = function(routeName) {
		var obj = '';
		for(var i=0; i<Router.routes.length; i++) {
			if(Router.routes[i].name === routeName) {
				obj = Router.routes[i];
			}
		}
		return obj;
	};
	bindEvents = function(eventObject, bindToObject) {
		for(key in eventObject) {
			var keySplit = key.split(",");
			var target = keySplit[1].trim();
			var event = keySplit[0].trim();
			var fun = eventObject[key];
			var bindFun = "";
			if(typeof fun === 'string') {
				fun = eventObject[i].methods[fun];
			}
			bindFun = fun.bind(bindToObject);
			$('body').on(event,target,bindFun);
		}
	};
	
	bindMethods = function(methodObject, bindToObject) {
		for(key in methodObject) {
			methodObject[key] = methodObject[key].bind(bindToObject);
		}
	};

	window.Router =  {
		routes: [],
		currentRoute: '',
		routeTo: '',
		currentOperation: '',
		activeAnimaion: '',
		beforeLoadAnimation: true,
		animations: {
			push: 'slide-from-left',
			pop: 'slide-from-right'
		},
		showLoader: function() {
			/* for giving functionality to user for showing his loader,
			he can do any stuff for showing loader */
		},
		hideLoader: function() {
			/* for giving functionality to user for hiding his loader,
			he can do any stuff for hiding loader */
		},
		init: function(configuration) {
			var self = this;
			this.routes = configuration.routes.map(function(obj, index) {
				obj['index'] = index ; 
				obj["update"] = self.update;
				obj.data["parent_data"] = configuration.data || {};
				obj["parent"] = self;
				if(obj["autoRender"] === undefined) {
					obj["autoRender"] = true
				}
				return obj 
			});
			
			/* bind events */
			this.events = configuration.events || {};
			this.methods = configuration.methods || {};

			if(this.currentRoute === '') {
				this.currentRoute = configuration.routes[0];
				this.routeTo = configuration.routes[0];
			}
			if(configuration.animations) {
				this.animations = configuration.animations;
			}
			if(configuration.showLoader) {
				this.showLoader = configuration.showLoader;
			}
			if(configuration.hideLoader) {
				this.hideLoader = configuration.hideLoader;
			}
			initilization();
			/* register route events */
			if(configuration.methods) {
				bindMethods(configuration.methods, this);
			}
			/* bind events of router*/
			
			if(configuration.events) {
				bindEvents(configuration.events, this);
			}
			/* bind methods of routes*/
			for(var i=0;i<this.routes.length; i++) {
				var cRoute = this.routes[i];
				if(cRoute.methods) {
					bindMethods(cRoute.methods, cRoute);
				}
			}
			this.go('',this.currentRoute.index, this.routeTo.index);
			for(var i=0;i<this.routes.length; i++) {
				if(this.routes[i].events) {
					bindEvents(this.routes[i].events, this.routes[i]);
				}
				if(this.routes[i].beforeRender) {
					this.routes[i].beforeRender.bind(this.routes[i]);
				}
				if(this.routes[i].afterRender) {
					this.routes[i].afterRender.bind(this.routes[i]);
				}
			}
		},
		go: function(routeName, currentRouteIndex, routeToIndex) {
			var routeObject = '';
			if(this.currentOperation == "") {
				this.currentOperation = "push";
			}
			if(routeToIndex === null) {
				routeObject = getRouteObject(routeName);
			}
			else {
				routeObject = this.routes[routeToIndex];
			}
			if(this.routeTo.beforeRender) {
				this.routeTo.beforeRender();
			}
			render(this.routeTo.template,$("#route-content"),this.routeTo.data);
			if(this.routeTo.afterRender) {
				this.routeTo.afterRender();
			}
			this.currentRoute = this.routeTo;
		},
		push: function() {
			var currentRouteIndex = $(".route-slider.current-slider").index();
			var routeToIndex = $(".route-slider.next-slider").index();

			this.currentRoute = this.routes[currentRouteIndex];
			this.routeTo = this.routes[routeToIndex];

			if(this.currentRoute.index < (this.routes.length - 1)) {
				this.routeTo = this.routes[this.currentRoute.index + 1];
				this.activeAnimaion = this.animations.push;
				this.currentOperation = "push";
				this.go('', this.currentRoute.index, this.routeTo.index);
			}
			else {
				console.log("can't push, no next route");
			}
		},
		pop: function() {
			if(this.currentRoute.index > 0) {
				this.activeAnimaion = this.animations.pop;
				this.routeTo = this.routes[this.currentRoute.index - 1];
				this.currentOperation = "pop";
				this.go('',this.currentRoute.index, this.routeTo.index);
			}
			else {
				console.log("can't pop, no more routes to pop")
			}
		}
	}
}(jQuery, rivets));