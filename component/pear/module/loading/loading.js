layui.define([], function (exports) {
    "use strict";

    var MOD_NAME = 'loading';
    layui.link(layui.cache.base + "loading/loading.css");
    var pearOper = new function () {
		this.blockRemove = function(dom,time){
			Notiflix.Block.Remove(dom, time);
		}
		this.block = function(option){
			if(option.type==1){
				Notiflix.Block.Standard(
				option.elem
				,option.msg);
			}
			else if(option.type==2){
				Notiflix.Block.Hourglass(
				option.elem
				,option.msg);
			}
			else if(option.type==3){
				Notiflix.Block.Circle(
				option.elem
				,option.msg);
			}
			else if(option.type==4){
				Notiflix.Block.Arrows(
				option.elem
				,option.msg);
			}
			else if(option.type==5){
				Notiflix.Block.Dots(
				option.elem
				,option.msg);
			}
			else if(option.type==6){
				Notiflix.Block.Pulse(
				option.elem
				,option.msg);
			}
		}

		this.loadRemove = function(time){
			Notiflix.Loading.Remove(time);
		}

		this.Load = function(type,message){
			if(type==1){
				Notiflix.Loading.Standard(message);
			}else if(type==2){
				Notiflix.Loading.Hourglass(message);
			}else if(type==3){
				Notiflix.Loading.Circle(message);
			}else if(type==4){
				Notiflix.Loading.Dots(message);
			}else if(type==5){
				Notiflix.Loading.Pulse(message);
			}
		}
    };

	// Notiflix: Loading Default Settings on
	var loadingSettings = {
	    ID: 'NotiflixLoadingWrap', // can not customizable
	    className: 'notiflix-loading',
	    zindex: 4000,
	    backgroundColor: 'rgba(0,0,0,0.8)',
	    rtl: false,
	    useGoogleFont: true,
	    fontFamily: 'Quicksand',
	    cssAnimation: true,
	    cssAnimationDuration: 400,
	    clickToClose: false,
	    customSvgUrl: null,
	    svgSize: '80px',
	    svgColor: '#32c682',
	    messageID: 'NotiflixLoadingMessage',
	    messageFontSize: '15px',
	    messageMaxLength: 34,
	    messageColor: '#dcdcdc',
	};
	// Notiflix: Loading Default Settings off

	// Notiflix: Block Default Settings on
	var blockSettings = {
	    ID: 'NotiflixBlockWrap', // can not customizable
	    querySelectorLimit: 200,
	    className: 'notiflix-block',
	    position: 'absolute',
	    zindex: 1000,
	    backgroundColor: 'rgba(255,255,255,0.9)',
	    rtl: false,
	    useGoogleFont: true,
	    fontFamily: 'Quicksand',
	    cssAnimation: true,
	    cssAnimationDuration: 300,
	    svgSize: '45px',
	    svgColor: '#383838',
	    messageFontSize: '14px',
	    messageMaxLength: 34,
	    messageColor: '#383838',
	};
	// Notiflix: Block Default Settings off

	// Notiflix: Extend on
	var extendNotiflix = function () {
	    // variables
	    var extended = {};
	    var deep = false;
	    var i = 0;
	    // check if a deep merge
	    if (Object.prototype.toString.call(arguments[0]) === '[object Boolean]') {
	        deep = arguments[0];
	        i++;
	    }
	    // merge the object into the extended object
	    var merge = function (obj) {
	        for (var prop in obj) {
	            if (Object.prototype.hasOwnProperty.call(obj, prop)) {
	                // if property is an object, merge properties
	                if (deep && Object.prototype.toString.call(obj[prop]) === '[object Object]') {
	                    extended[prop] = extendNotiflix(extended[prop], obj[prop]);
	                } else {
	                    extended[prop] = obj[prop];
	                }
	            }
	        }
	    };
	    // loop through each object and conduct a merge
	    for (; i < arguments.length; i++) {
	        merge(arguments[i]);
	    }
	    return extended;
	};
	// Notiflix: Extend off

	// Notiflix: Plaintext on
	var notiflixPlaintext = function (html) {
	    var htmlPool = document.createElement('div');
	    htmlPool.innerHTML = html;
	    return htmlPool.textContent || htmlPool.innerText || '';
	};
	// Notiflix: Plaintext off

	// Notiflix: GoogleFont on
	var notiflixGoogleFont = function (use, family) {
	    if (!document.getElementById('NotiflixQuicksand') && use && (family && typeof family === 'string' && family.toLowerCase() === 'quicksand')) {
	        // google fonts dns prefetch on
	        var dns = '<link id="NotiflixGoogleDNS" rel="dns-prefetch" href="//fonts.googleapis.com" />';
	        var dnsRange = document.createRange();
	        dnsRange.selectNode(document.head);
	        var dnsFragment = dnsRange.createContextualFragment(dns);
	        document.head.appendChild(dnsFragment);
	        // google fonts dns prefetch off

	        // google fonts style on
	        var font = '<link id="NotiflixQuicksand" href="https://fonts.googleapis.com/css?family=Quicksand:300,400,500,700&amp;subset=latin-ext" rel="stylesheet" />';
	        var fontRange = document.createRange();
	        fontRange.selectNode(document.head);
	        var fontFragment = fontRange.createContextualFragment(font);
	        document.head.appendChild(fontFragment);
	        // google fonts style off
	    }
	};
	// Notiflix: GoogleFont off

	// Notiflix: Console Error on
	var notiflixConsoleError = function (title, message) {
	    return console.error('%c ' + title + ' ', 'padding:2px;border-radius:20px;color:#fff;background:#ff5549', '\n' + message + '\nVisit documentation page to learn more: https://www.notiflix.com/documentation');
	};
	// Notiflix: Console Error off

	// Notiflix: Console Log on
	var notiflixConsoleLog = function (title, message) {
	    return console.log('%c ' + title + ' ', 'padding:2px;border-radius:20px;color:#fff;background:#26c0d3', '\n' + message + '\nVisit documentation page to learn more: https://www.notiflix.com/documentation');
	};
	// Notiflix: Console Log off

	// Notiflix: Main on
	var newLoadingSettings;
	var newBlockSettings;
	var Notiflix = {

	    // Loading on
	    Loading: {

	        // Init
	        Init: function (userLoadingOpt) {
	            // extend options
	            newLoadingSettings = extendNotiflix(true, loadingSettings, userLoadingOpt);
	            // use GoogleFonts if "Quicksand"
	            notiflixGoogleFont(newLoadingSettings.useGoogleFont, newLoadingSettings.fontFamily);
	        },

	        // Merge First Init
	        Merge: function (userLoadingExtend) {
	            // if initialized already
	            if (newLoadingSettings) {
	                newLoadingSettings = extendNotiflix(true, newLoadingSettings, userLoadingExtend);
	            }
	            // initialize first
	            else {
	                notiflixConsoleError('Notiflix Error', 'You have to initialize the Loading module before call Merge function.');
	                return false;
	            }
	        },

	        // Display Loading: Standard
	        Standard: function (message) {
	            NotiflixLoading(message, 'standard', true, 0); // true => display || 0 => delay
	        },

	        // Display Loading: Hourglass
	        Hourglass: function (message) {
	            NotiflixLoading(message, 'hourglass', true, 0); // true => display || 0 => delay
	        },

	        // Display Loading: Circle
	        Circle: function (message) {
	            NotiflixLoading(message, 'circle', true, 0); // true => display || 0 => delay
	        },

	        // Display Loading: Arrows
	        Arrows: function (message) {
	            NotiflixLoading(message, 'arrows', true, 0); // true => display || 0 => delay
	        },

	        // Display Loading: Dots
	        Dots: function (message) {
	            NotiflixLoading(message, 'dots', true, 0); // true => display || 0 => delay
	        },

	        // Display Loading: Pulse
	        Pulse: function (message) {
	            NotiflixLoading(message, 'pulse', true, 0); // true => display || 0 => delay
	        },

	        // Display Loading: Custom
	        Custom: function (message) {
	            NotiflixLoading(message, 'custom', true, 0); // true => display || 0 => delay
	        },

	        // Display Loading: Notiflix
	        Notiflix: function (message) {
	            NotiflixLoading(message, 'notiflix', true, 0); // true => display || 0 => delay
	        },

	        // Remove Loading
	        Remove: function (theDelay) {
	            if (!theDelay) { theDelay = 0; }
	            NotiflixLoading(false, false, false, theDelay); // false = Remove
	        },

	        // Change The Message
	        Change: function (newMessage) {
	            NotiflixLoadingChange(newMessage);
	        },
	    },
	    // Loading off

	    // Block on
	    Block: {

	        // Initialize
	        Init: function (userBlockOpt) {
	            // extend options
	            newBlockSettings = extendNotiflix(true, blockSettings, userBlockOpt);
	            // use GoogleFonts if "Quicksand"
	            notiflixGoogleFont(newBlockSettings.useGoogleFont, newBlockSettings.fontFamily);
	        },

	        // Merge First Initialize
	        Merge: function (userBlockExtend) {
	            // if initialized already
	            if (newBlockSettings) {
	                newBlockSettings = extendNotiflix(true, newBlockSettings, userBlockExtend);
	            }
	            // initialize first
	            else {
	                notiflixConsoleError('Notiflix Error', 'You have to initialize the "Notiflix.Block" module before call Merge function.');
	                return false;
	            }
	        },

	        // Display Block: Standard
	        Standard: function (selector, message) {
	            var block = true;
	            var theIcon = 'standard';
	            NotiflixBlockUnblockElement(block, selector, theIcon, message);
	        },

	        // Display Block: Hourglass
	        Hourglass: function (selector, message) {
	            var block = true;
	            var theIcon = 'hourglass';
	            NotiflixBlockUnblockElement(block, selector, theIcon, message);
	        },

	        // Display Block: Circle
	        Circle: function (selector, message) {
	            var block = true;
	            var theIcon = 'circle';
	            NotiflixBlockUnblockElement(block, selector, theIcon, message);
	        },

	        // Display Block: Arrows
	        Arrows: function (selector, message) {
	            var block = true;
	            var theIcon = 'arrows';
	            NotiflixBlockUnblockElement(block, selector, theIcon, message);
	        },

	        // Display Block: Dots
	        Dots: function (selector, message) {
	            var block = true;
	            var theIcon = 'dots';
	            NotiflixBlockUnblockElement(block, selector, theIcon, message);
	        },

	        // Display Block: Pulse
	        Pulse: function (selector, message) {
	            var block = true;
	            var theIcon = 'pulse';
	            NotiflixBlockUnblockElement(block, selector, theIcon, message);
	        },

	        // Remove Block
	        Remove: function (selector, delay) {
	            var block = false;
	            var theIcon = null;
	            var message = null;
	            NotiflixBlockUnblockElement(block, selector, theIcon, message, delay);
	        },
	    },
	    // Block off
	};
	// Notiflix: Main off


	// Notiflix: Loading Single on
	var NotiflixLoading = function (message, iconType, display, theDelay) {
	    // if not initialized pretend like init
	    if (!newLoadingSettings) {
	        Notiflix.Loading.Init({});
	    }
	    // check the message
	    if (!message) {
	        message = '';
	    }
	    // show loading
	    if (display) {

	        // if message settings on
	        if (message.toString().length > newLoadingSettings.messageMaxLength) {
	            message = notiflixPlaintext(message).toString().substring(0, newLoadingSettings.messageMaxLength) + '...';
	        } else {
	            message = notiflixPlaintext(message).toString();
	        }
	        var intSvgSize = parseInt(newLoadingSettings.svgSize);
	        var messageHTML = '';
	        if (message.length > 0) {
	            var messagePosTop = Math.round(intSvgSize - (intSvgSize / 4)).toString() + 'px';
	            var messageHeight = (parseInt(newLoadingSettings.messageFontSize) * 1.4).toString() + 'px';
	            messageHTML = '<p id="' + newLoadingSettings.messageID + '" class="loading-message" style="color:' + newLoadingSettings.messageColor + ';font-size:' + newLoadingSettings.messageFontSize + ';height:' + messageHeight + '; top:' + messagePosTop + ';">' + message + '</p>';
	        }
	        // if message settings off

	        // if cssAnimaion false -> duration on
	        if (!newLoadingSettings.cssAnimation) {
	            newLoadingSettings.cssAnimationDuration = 0;
	        }
	        // if cssAnimaion false -> duration off

	        // svgIcon on
	        var svgIcon = '';
	        if (iconType === 'standard') {
	            svgIcon = notiflixIndicatorSvgStandard(newLoadingSettings.svgSize, newLoadingSettings.svgColor);
	        } else if (iconType === 'hourglass') {
	            svgIcon = notiflixIndicatorSvgHourglass(newLoadingSettings.svgSize, newLoadingSettings.svgColor);
	        } else if (iconType === 'circle') {
	            svgIcon = notiflixIndicatorSvgCircle(newLoadingSettings.svgSize, newLoadingSettings.svgColor);
	        } else if (iconType === 'arrows') {
	            svgIcon = notiflixIndicatorSvgArrows(newLoadingSettings.svgSize, newLoadingSettings.svgColor);
	        } else if (iconType === 'dots') {
	            svgIcon = notiflixIndicatorSvgDots(newLoadingSettings.svgSize, newLoadingSettings.svgColor);
	        } else if (iconType === 'pulse') {
	            svgIcon = notiflixIndicatorSvgPulse(newLoadingSettings.svgSize, newLoadingSettings.svgColor);
	        } else if (iconType === 'custom' && newLoadingSettings.customSvgUrl !== null) {
	            svgIcon = '<img class="custom-loading-icon" width="' + newLoadingSettings.svgSize + '" height="' + newLoadingSettings.svgSize + '" src="' + newLoadingSettings.customSvgUrl + '" alt="Notiflix">';
	        } else if (iconType === 'custom' && newLoadingSettings.customSvgUrl == null) {
	            notiflixConsoleError('Notiflix Error', 'You have to set a static SVG url to "customSvgUrl" option to use Loading Custom.');
	            return false;
	        } else if (iconType === 'notiflix') {
	            svgIcon = notiflixIndicatorSvgNotiflix(newLoadingSettings.svgSize, '#f8f8f8', '#32c682');
	        }
	        var svgPosTop = 0;
	        if (message.length > 0) {
	            svgPosTop = '-' + Math.round(intSvgSize - (intSvgSize / 4)).toString() + 'px';
	        }
	        var svgIconHTML = '<div style="top:' + svgPosTop + '; width:' + newLoadingSettings.svgSize + '; height:' + newLoadingSettings.svgSize + ';" class="' + newLoadingSettings.className + '-icon' + (message.length > 0 ? ' with-message' : '') + '">' + svgIcon + '</div>';
	        // svgIcon off

	        // loading wrap on
	        var docBody = document.body;
	        var ntflxLoadingWrap = document.createElement('div');
	        ntflxLoadingWrap.id = loadingSettings.ID;
	        ntflxLoadingWrap.className = newLoadingSettings.className + (newLoadingSettings.cssAnimation ? ' with-animation' : '') + (newLoadingSettings.clickToClose ? ' click-to-close' : '');
	        ntflxLoadingWrap.style.zIndex = newLoadingSettings.zindex;
	        ntflxLoadingWrap.style.background = newLoadingSettings.backgroundColor;
	        ntflxLoadingWrap.style.animationDuration = newLoadingSettings.cssAnimationDuration + 'ms';
	        ntflxLoadingWrap.style.fontFamily = '"' + newLoadingSettings.fontFamily + '"' + ', sans-serif';

	        // rtl on
	        if (newLoadingSettings.rtl) {
	            ntflxLoadingWrap.setAttribute('dir', 'rtl');
	            ntflxLoadingWrap.classList.add('rtl-on');
	        }
	        // rtl off

	        // append on
	        ntflxLoadingWrap.innerHTML = svgIconHTML + messageHTML;

	        // if there is no loading element
	        if (!document.getElementById(ntflxLoadingWrap.id)) {
	            // append
	            docBody.appendChild(ntflxLoadingWrap);

	            // if click to close
	            if (newLoadingSettings.clickToClose) {
	                var loadingWrapElm = document.getElementById(ntflxLoadingWrap.id);
	                loadingWrapElm.addEventListener('click', function () {
	                    ntflxLoadingWrap.classList.add('remove');
	                    var timeout = setTimeout(function () {
	                        if (ntflxLoadingWrap.parentNode !== null) {
	                            ntflxLoadingWrap.parentNode.removeChild(ntflxLoadingWrap);
	                            clearTimeout(timeout);
	                        }
	                    }, newLoadingSettings.cssAnimationDuration);
	                });
	            }
	        }
	        // append off

	    }
	    // remove loading
	    else {
	        // if there is a loading element
	        if (document.getElementById(loadingSettings.ID)) {
	            var loadingElm = document.getElementById(loadingSettings.ID);
	            var timeout = setTimeout(function () {
	                loadingElm.classList.add('remove');
	                var timeout2 = setTimeout(function () {
	                    if (loadingElm.parentNode !== null) {
	                        loadingElm.parentNode.removeChild(loadingElm);
	                        clearTimeout(timeout2);
	                    }
	                }, newLoadingSettings.cssAnimationDuration);
	                clearTimeout(timeout);
	            }, theDelay);
	        }
	    }
	};
	// Notiflix: Loading Single off

	// Notiflix: Loading Change Message on
	var NotiflixLoadingChange = function (newMessage) {
	    // check the new message
	    if (!newMessage) {
	        newMessage = '';
	    }
	    // if has any loading
	    if (document.getElementById(loadingSettings.ID)) {
	        // if there is a new message
	        if (newMessage.length > 0) {
	            // max length on
	            if (newMessage.length > newLoadingSettings.messageMaxLength) {
	                newMessage = notiflixPlaintext(newMessage).toString().substring(0, newLoadingSettings.messageMaxLength) + '...';
	            } else {
	                newMessage = notiflixPlaintext(newMessage).toString();
	            }
	            // max length off

	            // there is a message element
	            var oldMessageElm = document.getElementById(loadingSettings.ID).getElementsByTagName('p')[0];
	            if (oldMessageElm) {
	                oldMessageElm.innerHTML = newMessage; // change the message
	            }
	            // there is no message element
	            else {
	                // create a new message element on
	                var newMessageHTML = document.createElement('p');
	                newMessageHTML.id = newLoadingSettings.messageID;
	                newMessageHTML.className = 'loading-message new';
	                newMessageHTML.style.color = newLoadingSettings.messageColor;
	                newMessageHTML.style.fontSize = newLoadingSettings.messageFontSize;
	                var intSvgSize = parseInt(newLoadingSettings.svgSize);
	                var messagePosTop = Math.round(intSvgSize - (intSvgSize / 4)).toString() + 'px';
	                newMessageHTML.style.top = messagePosTop;
	                var messageHeight = (parseInt(newLoadingSettings.messageFontSize) * 1.4).toString() + 'px';
	                newMessageHTML.style.height = messageHeight;
	                newMessageHTML.innerHTML = newMessage;
	                var messageWrap = document.getElementById(loadingSettings.ID);
	                messageWrap.appendChild(newMessageHTML);
	                // create a new message element off

	                // vertical align svg on
	                var svgDivElm = document.getElementById(loadingSettings.ID).getElementsByTagName('div')[0];
	                var svgNewPosTop = '-' + Math.round(intSvgSize - (intSvgSize / 4)).toString() + 'px';
	                svgDivElm.style.top = svgNewPosTop;
	                // vertical align svg off
	            }
	        }
	        // if no message
	        else {
	            notiflixConsoleError('Notiflix Error', 'Where is the new message?');
	        }
	    }
	};
	// Notiflix: Loading Change Message off


	// Notiflix: Block or Unblock Element on
	var notiflixBlockElementCounter = 0;
	var NotiflixBlockUnblockElement = function (block, selector, iconType, message, theDelay) {

	    // check typeof selector on
	    if (typeof selector !== 'string') {
	        notiflixConsoleError('Notiflix Error', 'The selector must be a String.');
	        return false;
	    }
	    // check typeof selector off

	    // check the delay on
	    if (typeof theDelay !== 'number') {
	        theDelay = 0;
	    }
	    // check the delay off

	    // check the selector on
	    var getSelector = document.querySelectorAll(selector);
	    if (getSelector.length > 0) {

	        // if not initialized pretend like init on
	        if (!newBlockSettings) {
	            Notiflix.Block.Init({});
	        }
	        // if not initialized pretend like init off

	        // check the message on
	        if (!message || (message && typeof message !== 'string')) {
	            message = undefined;
	        }
	        // check the message off

	    } else {
	        notiflixConsoleError('Notiflix Error', 'You called the "Notiflix.Block..." function with "' + selector + '" selector, but there is no such element(s) on the document.');
	        return false;
	    }
	    // check the selector off

	    // if cssAnimaion false => duration on
	    if (!newBlockSettings.cssAnimation) {
	        newBlockSettings.cssAnimationDuration = 0;
	    }
	    // if cssAnimaion false => duration off

	    // check the class name on
	    var blockClassName = 'notiflix-block';
	    if (newBlockSettings.className && typeof newBlockSettings.className === 'string') {
	        blockClassName = newBlockSettings.className.trim();
	    }
	    // check the class name off

	    // check query limit on
	    var getQueryLimit = (typeof newBlockSettings.querySelectorLimit === 'number' ? newBlockSettings.querySelectorLimit : 200);
	    var checkQueryLimit = (getSelector.length >= getQueryLimit ? getQueryLimit : getSelector.length);
	    // check query limit off

	    // block
	    if (block) {

	        // add element(s) and style on
	        for (var i = 0; i < checkQueryLimit; i++) {
	            var eachSelector = getSelector[i];

	            // check block element exist on
	            var eachBlockElement = eachSelector.querySelectorAll('[id^=' + blockSettings.ID + ']');
	            if (eachBlockElement.length < 1) {

	                // check the icon on
	                var icon = '';
	                if (iconType) {
	                    if (iconType === 'hourglass') {
	                        icon = notiflixIndicatorSvgHourglass(newBlockSettings.svgSize, newBlockSettings.svgColor);
	                    } else if (iconType === 'circle') {
	                        icon = notiflixIndicatorSvgCircle(newBlockSettings.svgSize, newBlockSettings.svgColor);
	                    } else if (iconType === 'arrows') {
	                        icon = notiflixIndicatorSvgArrows(newBlockSettings.svgSize, newBlockSettings.svgColor);
	                    } else if (iconType === 'dots') {
	                        icon = notiflixIndicatorSvgDots(newBlockSettings.svgSize, newBlockSettings.svgColor);
	                    } else if (iconType === 'pulse') {
	                        icon = notiflixIndicatorSvgPulse(newBlockSettings.svgSize, newBlockSettings.svgColor);
	                    } else {
	                        icon = notiflixIndicatorSvgStandard(newBlockSettings.svgSize, newBlockSettings.svgColor);
	                    }
	                }
	                var intSvgSize = parseInt(newBlockSettings.svgSize);
	                var posRatio = Math.round(intSvgSize - (intSvgSize / 5)).toString() + 'px';
	                var svgPosTop = (message && message.length > 0 ? '-' + posRatio : 0);
	                var iconElement = '<span class="' + blockClassName + '-icon" style="width:' + newBlockSettings.svgSize + ';height:' + newBlockSettings.svgSize + ';top:' + svgPosTop + ';">' + icon + '</span>';
	                // check the icon off

	                // check the message on
	                var messageElement = '';
	                var messageHeight = 0;
	                if (message) {
	                    if (message.length > newBlockSettings.messageMaxLength) {
	                        message = notiflixPlaintext(message).toString().substring(0, newBlockSettings.messageMaxLength) + '...';
	                    } else {
	                        message = notiflixPlaintext(message).toString();
	                    }
	                    messageHeight = Math.round(parseInt(newBlockSettings.messageFontSize) * 1.4).toString() + 'px';
	                    messageElement = '<span style="top:' + posRatio + ';height:' + messageHeight + ';font-family:' + newBlockSettings.fontFamily + ', sans-serif;font-size:' + newBlockSettings.messageFontSize + ';color:' + newBlockSettings.messageColor + ';" class="' + blockClassName + '-message">' + message + '</span>';
	                }
	                // check the message off

	                // block element on
	                notiflixBlockElementCounter++;
	                var notiflixBlockWrap = document.createElement('div');
	                notiflixBlockWrap.id = blockSettings.ID + '-' + notiflixBlockElementCounter;
	                notiflixBlockWrap.className = blockClassName + '-wrap' + (newBlockSettings.cssAnimation ? ' with-animation' : '');
	                notiflixBlockWrap.style.position = newBlockSettings.position;
	                notiflixBlockWrap.style.zIndex = newBlockSettings.zindex;
	                notiflixBlockWrap.style.background = newBlockSettings.backgroundColor;
	                notiflixBlockWrap.style.animationDuration = newBlockSettings.cssAnimationDuration + 'ms';
	                notiflixBlockWrap.style.fontFamily = '"' + newBlockSettings.fontFamily + '"' + ', sans-serif';
	                // block element off

	                // block element rtl on
	                if (newBlockSettings.rtl) {
	                    notiflixBlockWrap.setAttribute('dir', 'rtl');
	                    notiflixBlockWrap.classList.add('rtl-on');
	                }
	                // block element rtl off

	                // block element data on
	                notiflixBlockWrap.innerHTML = iconElement + messageElement;
	                // block element data off

	                // append block element on
	                var eachSelectorPos = getComputedStyle(eachSelector).getPropertyValue('position');
	                eachSelectorPos = eachSelectorPos && typeof eachSelectorPos === 'string' ? eachSelectorPos.toLowerCase() : 'relative';

	                // selector internal style on
	                var eachSelectorIdOrClass = '';
	                if (eachSelector.getAttribute('id')) {
	                    eachSelectorIdOrClass = '#' + eachSelector.getAttribute('id');
	                } else if (eachSelector.classList[0]) {
	                    eachSelectorIdOrClass = '.' + eachSelector.classList[0];
	                }

	                var positions = ['absolute', 'relative', 'fixed', 'sticky'];
	                if (positions.indexOf(eachSelectorPos) <= -1) {
	                    var minHeight = Math.round((parseInt(messageHeight) + intSvgSize) * 1.5).toString() + 'px';
	                    var style = '<style id="Style-' + blockSettings.ID + '-' + notiflixBlockElementCounter + '">' +
	                        eachSelectorIdOrClass + '.' + blockClassName + '-position{position:relative!important;min-height:' + minHeight + ';}' +
	                        '</style>';
	                    var styleRange = document.createRange();
	                    styleRange.selectNode(document.head);
	                    var styleFragment = styleRange.createContextualFragment(style);
	                    document.head.appendChild(styleFragment);
	                    eachSelector.classList.add(blockClassName + '-position');
	                }
	                // selector internal style off

	                // append
	                eachSelector.appendChild(notiflixBlockWrap);
	                // append block element off
	            }
	            // check block element exist off
	        }
	        // add element(s) and style off
	    }
	    // unblock/remove
	    else {

	        // Step 3 => Remove each block element on
	        var removeBlockElements = function (eachOne) {
	            var timeout = setTimeout(function () {
	                // remove element
	                eachOne.remove();

	                // remove this selector internal style
	                var eachOneId = eachOne.getAttribute('id');
	                var eachOneStyle = document.getElementById('Style-' + eachOneId);
	                if (eachOneStyle) {
	                    eachOneStyle.remove();
	                }

	                // clear timeout
	                clearTimeout(timeout);
	            }, newBlockSettings.cssAnimationDuration);
	        }
	        // Step 3 => Remove each block element off

	        // Step 2A => Remove each block element on
	        var removeClassBlockElements = function (eachBlockElement) {
	            // if elements exist
	            if (eachBlockElement && eachBlockElement.length > 0) {
	                for (var i = 0; i < eachBlockElement.length; i++) {
	                    var eachOne = eachBlockElement[i];
	                    if (eachOne) {
	                        // add remove class
	                        eachOne.classList.add('remove');
	                        // remove block elements
	                        removeBlockElements(eachOne);
	                    }
	                }
	            }
	            // not exist
	            else {
	                notiflixConsoleLog('Notiflix Info', '"Notiflix.Block.Remove();" function called with "' + selector + '" selector, but this selector does not have a "Notiflix.Block..." element to remove.');
	            }
	        }
	        // Step 2A => Remove each block element on

	        // Step 2B => Remove each selector class name on
	        var removeEachSelectorClassName = function (eachSelector) {
	            var timeout = setTimeout(function () {
	                // remove class name
	                var positionClass = blockClassName + '-position';
	                eachSelector.classList.remove(positionClass);

	                // clear timeout
	                clearTimeout(timeout);
	            }, newBlockSettings.cssAnimationDuration + 300);
	        }
	        // Step 2B => Remove each selector class name off

	        // Step 1 => Remove selector class name on
	        var selectorTimeout = setTimeout(function () {
	            for (var i = 0; i < checkQueryLimit; i++) {
	                var eachSelector = getSelector[i];

	                // remove each selector class name
	                removeEachSelectorClassName(eachSelector);

	                // remove each block element
	                eachBlockElement = eachSelector.querySelectorAll('[id^=' + blockSettings.ID + ']');
	                removeClassBlockElements(eachBlockElement);
	            }
	            // clear timeout
	            clearTimeout(selectorTimeout);
	        }, theDelay);
	        // Step 1 => Remove selector class name off
	    }
	};
	// Notiflix: Block or Unblock Element off

	// Notiflix: Indicator SVG standard on
	var notiflixIndicatorSvgStandard = function (width, color) {
	    if (!width) { width = '60px'; }
	    if (!color) { color = '#32c682'; }
	    var standard = '<svg stroke="' + color + '" width="' + width + '" height="' + width + '" viewBox="0 0 38 38" style="transform:scale(0.8);" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g transform="translate(1 1)" stroke-width="2"><circle stroke-opacity=".25" cx="18" cy="18" r="18"/><path d="M36 18c0-9.94-8.06-18-18-18"><animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite"/></path></g></g></svg>';
	    return standard;
	};
	// Notiflix: Indicator SVG standard off

	// Notiflix: Indicator SVG hourglass on
	var notiflixIndicatorSvgHourglass = function (width, color) {
	    if (!width) { width = '60px'; }
	    if (!color) { color = '#32c682'; }
	    var hourglass = '<svg id="NXLoadingHourglass" fill="' + color + '" width="' + width + '" height="' + width + '" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" version="1.1" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" viewBox="0 0 200 200"><style>@-webkit-keyframes NXhourglass5-animation{0%{-webkit-transform: scale(1, 1);transform: scale(1, 1);}16.67%{-webkit-transform: scale(1, 0.8);transform: scale(1, 0.8);}33.33%{-webkit-transform: scale(0.88, 0.6);transform: scale(0.88, 0.6);}37.50%{-webkit-transform: scale(0.85, 0.55);transform: scale(0.85, 0.55);}41.67%{-webkit-transform: scale(0.8, 0.5);transform: scale(0.8, 0.5);}45.83%{-webkit-transform: scale(0.75, 0.45);transform: scale(0.75, 0.45);}50%{-webkit-transform: scale(0.7, 0.4);transform: scale(0.7, 0.4);}54.17%{-webkit-transform: scale(0.6, 0.35);transform: scale(0.6, 0.35);}58.33%{-webkit-transform: scale(0.5, 0.3);transform: scale(0.5, 0.3);}83.33%{-webkit-transform: scale(0.2, 0);transform: scale(0.2, 0);}100%{-webkit-transform: scale(0.2, 0);transform: scale(0.2, 0);}}@keyframes NXhourglass5-animation{0%{-webkit-transform: scale(1, 1);transform: scale(1, 1);}16.67%{-webkit-transform: scale(1, 0.8);transform: scale(1, 0.8);}33.33%{-webkit-transform: scale(0.88, 0.6);transform: scale(0.88, 0.6);}37.50%{-webkit-transform: scale(0.85, 0.55);transform: scale(0.85, 0.55);}41.67%{-webkit-transform: scale(0.8, 0.5);transform: scale(0.8, 0.5);}45.83%{-webkit-transform: scale(0.75, 0.45);transform: scale(0.75, 0.45);}50%{-webkit-transform: scale(0.7, 0.4);transform: scale(0.7, 0.4);}54.17%{-webkit-transform: scale(0.6, 0.35);transform: scale(0.6, 0.35);}58.33%{-webkit-transform: scale(0.5, 0.3);transform: scale(0.5, 0.3);}83.33%{-webkit-transform: scale(0.2, 0);transform: scale(0.2, 0);}100%{-webkit-transform: scale(0.2, 0);transform: scale(0.2, 0);}}@-webkit-keyframes NXhourglass3-animation{0%{-webkit-transform: scale(1, 0.02);transform: scale(1, 0.02);}79.17%{-webkit-transform: scale(1, 1);transform: scale(1, 1);}100%{-webkit-transform: scale(1, 1);transform: scale(1, 1);}}@keyframes NXhourglass3-animation{0%{-webkit-transform: scale(1, 0.02);transform: scale(1, 0.02);}79.17%{-webkit-transform: scale(1, 1);transform: scale(1, 1);}100%{-webkit-transform: scale(1, 1);transform: scale(1, 1);}}@-webkit-keyframes NXhourglass1-animation{0%{-webkit-transform: rotate(0deg);transform: rotate(0deg);}83.33%{-webkit-transform: rotate(0deg);transform: rotate(0deg);}100%{-webkit-transform: rotate(180deg);transform: rotate(180deg);}}@keyframes NXhourglass1-animation{0%{-webkit-transform: rotate(0deg);transform: rotate(0deg);}83.33%{-webkit-transform: rotate(0deg);transform: rotate(0deg);}100%{-webkit-transform: rotate(180deg);transform: rotate(180deg);}}#NXLoadingHourglass *{-webkit-animation-duration: 1.2s;animation-duration: 1.2s;-webkit-animation-iteration-count: infinite;animation-iteration-count: infinite;-webkit-animation-timing-function: cubic-bezier(0, 0, 1, 1);animation-timing-function: cubic-bezier(0, 0, 1, 1);}#NXhourglass7{fill: inherit;}#NXhourglass1{-webkit-animation-name: NXhourglass1-animation;animation-name: NXhourglass1-animation;-webkit-transform-origin: 50% 50%;transform-origin: 50% 50%;transform-box: fill-box;}#NXhourglass3{-webkit-animation-name: NXhourglass3-animation;animation-name: NXhourglass3-animation;-webkit-animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);animation-timing-function: cubic-bezier(0.42, 0, 0.58, 1);-webkit-transform-origin: 50% 100%;transform-origin: 50% 100%;transform-box: fill-box;}#NXhourglass5{-webkit-animation-name: NXhourglass5-animation;animation-name: NXhourglass5-animation;-webkit-transform-origin: 50% 100%;transform-origin: 50% 100%;transform-box: fill-box;}g#NXhourglass5,#NXhourglass3{fill: inherit;opacity: .4;}</style><g id="NXhourglass1" data-animator-group="true" data-animator-type="1"><g id="NXhourglass2"><g id="NXhourglass3" data-animator-group="true" data-animator-type="2"><polygon points="100,100 65.62,132.08 65.62,163.22 134.38,163.22 134.38,132.08 " id="NXhourglass4"/></g><g id="NXhourglass5" data-animator-group="true" data-animator-type="2"><polygon points="100,100 65.62,67.92 65.62,36.78 134.38,36.78 134.38,67.92" id="NXhourglass6"/></g> <path d="M51.14 38.89l8.33 0 0 14.93c0,15.1 8.29,28.99 23.34,39.1 1.88,1.25 3.04,3.97 3.04,7.08 0,3.11 -1.16,5.83 -3.04,7.09 -15.05,10.1 -23.34,23.99 -23.34,39.09l0 14.93 -8.33 0c-2.68,0 -4.86,2.18 -4.86,4.86 0,2.69 2.18,4.86 4.86,4.86l97.72 0c2.68,0 4.86,-2.17 4.86,-4.86 0,-2.68 -2.18,-4.86 -4.86,-4.86l-8.33 0 0 -14.93c0,-15.1 -8.29,-28.99 -23.34,-39.09 -1.88,-1.26 -3.04,-3.98 -3.04,-7.09 0,-3.11 1.16,-5.83 3.04,-7.08 15.05,-10.11 23.34,-24 23.34,-39.1l0 -14.93 8.33 0c2.68,0 4.86,-2.18 4.86,-4.86 0,-2.69 -2.18,-4.86 -4.86,-4.86l-97.72 0c-2.68,0 -4.86,2.17 -4.86,4.86 0,2.68 2.18,4.86 4.86,4.86zm79.67 14.93c0,15.87 -11.93,26.25 -19.04,31.03 -4.6,3.08 -7.34,8.75 -7.34,15.15 0,6.41 2.74,12.07 7.34,15.15 7.11,4.78 19.04,15.16 19.04,31.03l0 14.93 -61.62 0 0 -14.93c0,-15.87 11.93,-26.25 19.04,-31.02 4.6,-3.09 7.34,-8.75 7.34,-15.16 0,-6.4 -2.74,-12.07 -7.34,-15.15 -7.11,-4.78 -19.04,-15.16 -19.04,-31.03l0 -14.93 61.62 0 0 14.93z" id="NXhourglass7"/></g></g></svg>';
	    return hourglass;
	};
	// Notiflix: Indicator SVG hourglass off

	// Notiflix: Indicator SVG circle on
	var notiflixIndicatorSvgCircle = function (width, color) {
	    if (!width) { width = '60px'; }
	    if (!color) { color = '#32c682'; }
	    var circle = '<svg id="NXLoadingCircle" width="' + width + '" height="' + width + '" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="25 25 50 50" xml:space="preserve" version="1.1"><style>#NXLoadingCircle{-webkit-animation: rotate 2s linear infinite; animation: rotate 2s linear infinite; height: ' + width + '; -webkit-transform-origin: center center; -ms-transform-origin: center center; transform-origin: center center; width: ' + width + '; position: absolute; top: 0; left: 0; margin: auto;}.notiflix-loader-circle-path{stroke-dasharray: 150,200; stroke-dashoffset: -10; -webkit-animation: dash 1.5s ease-in-out infinite, color 1.5s ease-in-out infinite; animation: dash 1.5s ease-in-out infinite, color 1.5s ease-in-out infinite; stroke-linecap: round;}@-webkit-keyframes rotate{100%{-webkit-transform: rotate(360deg); transform: rotate(360deg);}}@keyframes rotate{100%{-webkit-transform: rotate(360deg); transform: rotate(360deg);}}@-webkit-keyframes dash{0%{stroke-dasharray: 1,200; stroke-dashoffset: 0;}50%{stroke-dasharray: 89,200; stroke-dashoffset: -35;}100%{stroke-dasharray: 89,200; stroke-dashoffset: -124;}}@keyframes dash{0%{stroke-dasharray: 1,200; stroke-dashoffset: 0;}50%{stroke-dasharray: 89,200; stroke-dashoffset: -35;}100%{stroke-dasharray: 89,200; stroke-dashoffset: -124;}}</style><circle class="notiflix-loader-circle-path" cx="50" cy="50" r="20" fill="none" stroke="' + color + '" stroke-width="2"/></svg>';
	    return circle;
	};
	// Notiflix: Indicator SVG circle off

	// Notiflix: Indicator SVG arrows on
	var notiflixIndicatorSvgArrows = function (width, color) {
	    if (!width) { width = '60px'; }
	    if (!color) { color = '#32c682'; }
	    var arrows = '<svg id="NXLoadingArrows" fill="' + color + '" width="' + width + '" height="' + width + '" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 128 128" xml:space="preserve"><g><path fill="inherit" fill-opacity="1" d="M109.25 55.5h-36l12-12a29.54 29.54 0 0 0-49.53 12H18.75A46.04 46.04 0 0 1 96.9 31.84l12.35-12.34v36zm-90.5 17h36l-12 12a29.54 29.54 0 0 0 49.53-12h16.97A46.04 46.04 0 0 1 31.1 96.16L18.74 108.5v-36z" /><animateTransform attributeName="transform" type="rotate" from="0 64 64" to="360 64 64" dur="1.5s" repeatCount="indefinite"></animateTransform></g></svg>';
	    return arrows;
	};
	// Notiflix: Indicator SVG arrows off

	// Notiflix: Indicator SVG dots on
	var notiflixIndicatorSvgDots = function (width, color) {
	    if (!width) { width = '60px'; }
	    if (!color) { color = '#32c682'; }
	    var dots = '<svg id="NXLoadingDots" fill="' + color + '" width="' + width + '" height="' + width + '" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid"><g transform="translate(25 50)"><circle cx="0" cy="0" r="9" fill="inherit" transform="scale(0.239 0.239)"><animateTransform attributeName="transform" type="scale" begin="-0.266s" calcMode="spline" keySplines="0.3 0 0.7 1;0.3 0 0.7 1" values="0;1;0" keyTimes="0;0.5;1" dur="0.8s" repeatCount="indefinite"/></circle></g><g transform="translate(50 50)"> <circle cx="0" cy="0" r="9" fill="inherit" transform="scale(0.00152 0.00152)"><animateTransform attributeName="transform" type="scale" begin="-0.133s" calcMode="spline" keySplines="0.3 0 0.7 1;0.3 0 0.7 1" values="0;1;0" keyTimes="0;0.5;1" dur="0.8s" repeatCount="indefinite"/></circle></g><g transform="translate(75 50)"><circle cx="0" cy="0" r="9" fill="inherit" transform="scale(0.299 0.299)"><animateTransform attributeName="transform" type="scale" begin="0s" calcMode="spline" keySplines="0.3 0 0.7 1;0.3 0 0.7 1" values="0;1;0" keyTimes="0;0.5;1" dur="0.8s" repeatCount="indefinite"/></circle></g></svg>';
	    return dots;
	};
	// Notiflix: Indicator SVG dots off

	// Notiflix: Indicator SVG pulse on
	var notiflixIndicatorSvgPulse = function (width, color) {
	    if (!width) { width = '60px'; }
	    if (!color) { color = '#32c682'; }
	    var pulse = '<svg stroke="' + color + '" width="' + width + '" height="' + width + '" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd" stroke-width="2"><circle cx="22" cy="22" r="1"><animate attributeName="r" begin="0s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite"/><animate attributeName="stroke-opacity" begin="0s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite"/></circle><circle cx="22" cy="22" r="1"><animate attributeName="r" begin="-0.9s" dur="1.8s" values="1; 20" calcMode="spline" keyTimes="0; 1" keySplines="0.165, 0.84, 0.44, 1" repeatCount="indefinite"/><animate attributeName="stroke-opacity" begin="-0.9s" dur="1.8s" values="1; 0" calcMode="spline" keyTimes="0; 1" keySplines="0.3, 0.61, 0.355, 1" repeatCount="indefinite"/></circle></g></svg>';
	    return pulse;
	};
	// Notiflix: Indicator SVG pulse off

	// Notiflix: Indicator SVG notiflix on
	var notiflixIndicatorSvgNotiflix = function (width, white, green) {
	    if (!width) { width = '60px'; }
	    if (!white) { white = '#f8f8f8'; }
	    if (!green) { green = '#32c682'; }
	    var notiflixIcon = '<svg id="NXLoadingNotiflixLib" xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="' + width + '" height="' + width + '" version="1.1" style="shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" viewBox="0 0 200 200" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><style type="text/css">.line{stroke:' + white + ';stroke-width:12;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:22;}.line{fill:none;}.dot{fill:' + green + ';stroke:' + green + ';stroke-width:12;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:22;}.n{stroke-dasharray: 500;stroke-dashoffset: 0;animation-name: notiflix-n;animation-timing-function: linear;animation-duration: 2.5s;animation-delay:0s;animation-iteration-count: infinite;animation-direction: normal;}@keyframes notiflix-n{0%{stroke-dashoffset: 1000;}100%{stroke-dashoffset: 0;}}.x2,.x1{stroke-dasharray: 500;stroke-dashoffset: 0;animation-name: notiflix-x;animation-timing-function: linear;animation-duration: 2.5s;animation-delay:.2s;animation-iteration-count: infinite;animation-direction: normal;}@keyframes notiflix-x{0%{stroke-dashoffset: 1000;}100%{stroke-dashoffset: 0;}}.dot{animation-name: notiflix-dot;animation-timing-function: ease-in-out;animation-duration: 1.25s;animation-iteration-count: infinite;animation-direction: normal;}@keyframes notiflix-dot{0%{stroke-width: 0;}50%{stroke-width: 12;}100%{stroke-width: 0;}}</style></defs><g><path class="dot" d="M47.97 135.05c3.59,0 6.5,2.91 6.5,6.5 0,3.59 -2.91,6.5 -6.5,6.5 -3.59,0 -6.5,-2.91 -6.5,-6.5 0,-3.59 2.91,-6.5 6.5,-6.5z"/><path class="line n" d="M10.14 144.76l0 -0.22 0 -0.96 0 -56.03c0,-5.68 -4.54,-41.36 37.83,-41.36 42.36,0 37.82,35.68 37.82,41.36l0 57.21"/><path class="line x1" d="M115.06 144.49c24.98,-32.68 49.96,-65.35 74.94,-98.03"/><path class="line x2" d="M114.89 46.6c25.09,32.58 50.19,65.17 75.29,97.75"/></g></svg>';
	    return notiflixIcon;
	};
	// Notiflix: Indicator SVG notiflix off

	exports(MOD_NAME,pearOper);
})

