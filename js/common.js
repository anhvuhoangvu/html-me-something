/* ====================================================================
   getCSSProp
   Cross-browsers css property values extractor
   Fails in Safari < 1.2 if CSS is defined in an *external* stylesheet
   ==================================================================== */

function getCSSProp(element, prop) {
  if (element.style[prop]) {
    // inline style property
    return element.style[prop];
  } else if (element.currentStyle) {
    // external stylesheet for Explorer
    return element.currentStyle[prop];
  } else if (document.defaultView && document.defaultView.getComputedStyle) {
    // external stylesheet for Mozilla and Safari 1.3+
    prop = prop.replace(/([A-Z])/g,"-$1");
    prop = prop.toLowerCase();
    return document.defaultView.getComputedStyle(element,"").getPropertyValue(prop);
  } else {
    // Safari 1.2
    return null;
  }
}

/* addEvent */
function addEvent(elm, evType, fn, useCapture) {
	if (elm.addEventListener) { 
	elm.addEventListener(evType, fn, useCapture); 
		return true; 
	}
	else if (elm.attachEvent) { 
	var r = elm.attachEvent('on' + evType, fn); 
	EventCache.add(elm, evType, fn);
		return r; 
	}
	else {
		elm['on' + evType] = fn;
	}
}
var EventCache = function(){
	var listEvents = [];
	return {
		listEvents : listEvents,	
		add : function(node, sEventName, fHandler, bCapture){
			listEvents.push(arguments);
		},	
		flush : function(){
			var i, item;
			for(i = listEvents.length - 1; i >= 0; i = i - 1){
				item = listEvents[i];				
				if(item[0].removeEventListener){
					item[0].removeEventListener(item[1], item[2], item[3]);
				};				
				/* From this point on we need the event names to be prefixed with */
				if(item[1].substring(0, 2) != "on"){
					item[1] = "on" + item[1];
				};				
				if(item[0].detachEvent){
					item[0].detachEvent(item[1], item[2]);
				};				
				item[0][item[1]] = null;
			};
		}
	};
}();

/* ====================================================================
   document.getElementsBySelector
   Version 0.4 - Simon Willison, March 25th 2003
   ==================================================================== */

function getAllChildren(e) {
  // Returns all children of element. Workaround required for IE5/Windows. Ugh.
  return e.all ? e.all : e.getElementsByTagName('*');
}
document.getElementsBySelector = function(selector) {
  // Attempt to fail gracefully in lesser browsers
  if (!document.getElementsByTagName) {
    return new Array();
  }
  
  //declare vars
  var tokens, token, currentContext, bits, tagName, found, foundCount, elements, i, h, j, k;
  
  // Split selector in to tokens
  tokens = selector.split(' ');
  currentContext = new Array(document);
  for (i = 0; i < tokens.length; i++) {
    token = tokens[i].replace(/^\s+/,'').replace(/\s+$/,'');;
    if (token.indexOf('#') > -1) {
      // Token is an ID selector
      bits = token.split('#');
      tagName = bits[0];
      id = bits[1];
      var element = document.getElementById(id);
      if (tagName && element.nodeName.toLowerCase() != tagName) {
        // tag with that ID not found, return false
        return new Array();
      }
      // Set currentContext to contain just this element
      currentContext = new Array(element);
      continue; // Skip to next token
    }
    if (token.indexOf('.') > -1) {
      // Token contains a class selector
      bits = token.split('.');
      tagName = bits[0];
      var className = bits[1];
      if (!tagName) {
        tagName = '*';
      }
      // Get elements matching tag, filter them for class selector
      found = new Array;
      foundCount = 0;
      for (h = 0; h < currentContext.length; h++) {
        if (tagName == '*') {
            elements = getAllChildren(currentContext[h]);
        } else {
            elements = currentContext[h].getElementsByTagName(tagName);
        }
        for (j = 0; j < elements.length; j++) {
          found[foundCount++] = elements[j];
        }
      }
      currentContext = new Array;
      currentContextIndex = 0;
      for (k = 0; k < found.length; k++) {
        if (found[k].className && found[k].className.match(new RegExp('\\b'+className+'\\b'))) {
          currentContext[currentContextIndex++] = found[k];
        }
      }
      continue; // Skip to next token
    }
    // Code to deal with attribute selectors
    if (token.match(/^(\w*)\[(\w+)([=~\|\^\$\*]?)=?"?([^\]"]*)"?\]$/)) {
      tagName = RegExp.$1;
      var attrName = RegExp.$2;
      var attrOperator = RegExp.$3;
      var attrValue = RegExp.$4;
      if (!tagName) {
        tagName = '*';
      }
      // Grab all of the tagName elements within current context
      found = new Array;
      foundCount = 0;
      for (h = 0; h < currentContext.length; h++) {
        if (tagName == '*') {
            elements = getAllChildren(currentContext[h]);
        } else {
            elements = currentContext[h].getElementsByTagName(tagName);
        }
        for (j = 0; j < elements.length; j++) {
          found[foundCount++] = elements[j];
        }
      }
      currentContext = new Array;
      currentContextIndex = 0;
      var checkFunction; // This function will be used to filter the elements
      switch (attrOperator) {
        case '=': // Equality
          checkFunction = function(e) { return (e.getAttribute(attrName) == attrValue); };
          break;
        case '~': // Match one of space seperated words 
          checkFunction = function(e) { return (e.getAttribute(attrName).match(new RegExp('\\b'+attrValue+'\\b'))); };
          break;
        case '|': // Match start with value followed by optional hyphen
          checkFunction = function(e) { return (e.getAttribute(attrName).match(new RegExp('^'+attrValue+'-?'))); };
          break;
        case '^': // Match starts with value
          checkFunction = function(e) { return (e.getAttribute(attrName).indexOf(attrValue) == 0); };
          break;
        case '$': // Match ends with value - fails with "Warning" in Opera 7
          checkFunction = function(e) { return (e.getAttribute(attrName).lastIndexOf(attrValue) == e.getAttribute(attrName).length - attrValue.length); };
          break;
        case '*': // Match ends with value
          checkFunction = function(e) { return (e.getAttribute(attrName).indexOf(attrValue) > -1); };
          break;
        default :
          // Just test for existence of attribute
          checkFunction = function(e) { return e.getAttribute(attrName); };
      }
      currentContext = new Array;
      currentContextIndex = 0;
      for (k = 0; k < found.length; k++) {
        if (checkFunction(found[k])) {
          currentContext[currentContextIndex++] = found[k];
        }
      }
      // alert('Attribute Selector: '+tagName+' '+attrName+' '+attrOperator+' '+attrValue);
      continue; // Skip to next token
    }
    // If we get here, token is JUST an element (not a class or ID selector)
    tagName = token;
    found = new Array;
    foundCount = 0;
    for (h = 0; h < currentContext.length; h++) {
      elements = currentContext[h].getElementsByTagName(tagName);
      for (j = 0; j < elements.length; j++) {
        found[foundCount++] = elements[j];
      }
    }
    currentContext = found;
  }
  return currentContext;
}

/* Rounded images */
var Box = new Object();
Box =	{
	round : function() {
		if (!document.getElementsByTagName || !document.getElementById){ 
			return; 
		}
		var imgs = document.getElementsBySelector("img.rounded");
		// loop through all img tags
		for (var i=0; i<imgs.length; i++){
			var img = imgs[i];				
			var wrapper = document.createElement('div');  	// Create the outer-most div (wrapper)
  			wrapper.className = 'roundimgwrapper';          // Give it a classname
   			wrapper.style.width = img.width+'px';     		// give wrapper the same width as the current img
   			img.parentNode.replaceChild(wrapper, img); 		// swap the wrapper for the image (we'll put it back later)
			for(var j = 1; 4 >= j;  j++) {
				var curve = document.createElement('span');
				curve.className	= 'curve'+j;
				wrapper.appendChild(curve);
				/* position - get round an ie bug */
				if (j == 3 || j == 4 ) {
					curve.style.top = (img.height-12)+"px";
				}	
			}
   			wrapper.appendChild(img); // And glue the img back in after the DIVs
		}
	}
}

/* SIFR */
function do_sIFR() {
	if (typeof sIFR == "function") {
		sIFR.replaceElement(named({sSelector:"h2", sFlashSrc:"/_assets/swf/trajanbold.swf", sColor: "#6681DE", sLinkColor:"#000000", sBgColor:"#ffffff", sHoverColor:"#000000", nPaddingTop:0, nPaddingBottom:0, sWmode:"transparent", sFlashVars:"textalign=left&offsetTop=0"}));
	}
}

addEvent(window,'load',Box.round, false);
addEvent(window,'load',do_sIFR, false);
addEvent(window,'load',initLightbox, false);

/* Stop memory leaks */
addEvent(window,'unload',EventCache.flush, false);


