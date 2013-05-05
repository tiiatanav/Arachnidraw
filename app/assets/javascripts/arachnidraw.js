window.onload = function() {
	// only load functionality when there is a proper placeholder present
	var div = document.getElementById("AppHolder");
	if (div != null) {
		var prop=document.createElement("div");	
		prop.setAttribute("id", "formHolder");
		prop.innerHTML="<div class=\"appSectionTitle\">Properties area</div><p>Hint: Double click on a element to see its properties</p>"
		div.appendChild(prop);
	
		var c = document.createElement("canvas");	
		c.setAttribute("id", "myCanvas");
		c.setAttribute("width", div.clientWidth - prop.offsetWidth-5);
		c.setAttribute("height", 500);
		div.appendChild(c);
	
   loadImages(images, windowLoadHandler);
	}
};

window.onresize = function(event) {
   canvas = document.getElementById('myCanvas');
   if (canvas!=null){
   	var div = document.getElementById("AppHolder");
   	var prop=document.getElementById("formHolder");
   	canvas.setAttribute("width", div.clientWidth - prop.offsetWidth-2);
   	app.redraw();
   }
}

//window.addEventListener("load", windowLoadHandler, false);
function windowLoadHandler(img) {
	
	images = img;
	app = new canvasApp();

}

function canvasApp() {	
var c=document.getElementById("myCanvas");
var ctx=c.getContext("2d");

var menu=new Menu();

this.c=c;
this.ctx=ctx;

init();

	
var shapes;
var being_dragged; // dragged element
var being_used; // active menuitem
var being_clicked; // last clicked element 
var being_dbl; // double clicked element
var dragging;
var mouseX;
var mouseY;
var dragHoldX;
var dragHoldY;
var timer;
var targetX;
var targetY;
var easeAmount;
var bgColor;
var textColor;
var menuHeight=40;
this.targetElement='formHolder';
var targetElement = this.targetElement;
var save_uri = "schemas.json";
this.schemaId="";
this.schemaName="";


this.save=save;
function save(create){
	if (this.schemaId=="" || create){ // create a new schema
		$.post(save_uri, {"schema":{"name": $("#schemaName").val(), "json": makeJSON()}})
		.done(function(data) {
			$("#saveInfo").html("Save was successful").css("color","green");		
		}).fail(function(data) { 
			$("#saveInfo").html("Name in use, pick another one.").css("color","red");
		});
	} else { // update existing schema
		$.ajax({ 
			url: save_uri.replace(".json","/"+this.schemaId+".json"), 
			type: 'PUT', 
			data: {"schema":{"name": $("#schemaName").val(), "json": makeJSON()}} 
		}).done(function() {$("#saveInfo").html("Update was successful").css("color","green"); })
			.fail(function() {$("#saveInfo").html("Update failed.").css("color","red"); });
	}
	// hide message after a few seconds
	setTimeout(function(){
		$("#saveInfo").html("");
	},5000);
	
}

this.load=load;
function load(){
	var app = this;
	var holder = document.getElementById(targetElement);
	holder.innerHTML="";
	var loadSection = html.addSection(holder,'loadSection', 'Open Schema', false);
	html.breakLine(loadSection);
	$.get(save_uri, {},
		function(data){
			$.each(data, function(key, val){
				//console.log("open:",val.id, val.name);
				var span = document.createElement("span");
				span.innerHTML=val.name;
				span.setAttribute("class", "loadSchema");
				span.onclick=function(){
					importJSON(val.json);
					app.schemaName=val.name;
					app.schemaId=val.id;
					$(".loadedSchema").removeClass("loadedSchema");
					this.setAttribute("class", "loadSchema loadedSchema");
				}
				loadSection.appendChild(span);
				//html.breakLine(loadSection);
			});
			  
		});
}

this.validate=validate;
function validate(json){
	console.log(json);
	var i;
	/*
TODO! validate json
	*/

 /* validate arrow ends  */
 for (i=0; i<json['arrows'].length-1; i++){
	var to = json['arrows'][i].to.split('-');
	var from = json['arrows'][i].from.split('-');
	//console.log(to, from);
	var nets=["routers", "switches"];
	if ( nets.indexOf(to[0])>=0 ) to[0]="network";
	if ( nets.indexOf(from[0])>=0 ) from[0]="network";
	// the elements are of different kind, it is ok to make the arrow
	if (from[0]==to[0]){
		// remove this arrow
		json['arrows'].splice(i, 1);
	}
 }
 console.log("new", json);
 return json;
}

this.makeJSON=makeJSON;
function makeJSON(){
	var app = this;
	
	var nodes = "\"nodes\": [  ";
	var arrows = "\n\"arrows\": [  ";
	var routers = "\n\"routers\": [  ";
	var switches = "\n\"switches\": [  ";
	
	var txt = "{ ";
	
	var i = 0;
	$.each(shapes, function(key,val){
		for (i=0; i < val.length; i++) {
			if (val[i] instanceof Arrow){
  				arrows+="\n"+val[i].toJSONstring()+", ";
  			} else if (val[i] instanceof Node){
  				nodes+="\n"+val[i].toJSONstring()+", ";
  			} else if (val[i] instanceof Switch){
  				switches+="\n"+val[i].toJSONstring()+", ";
  			} else if (val[i] instanceof Router){
  				routers+="\n"+val[i].toJSONstring()+", ";
  			}
		}
	});

	
  	txt += nodes.slice(0, -2)+"], "+routers.slice(0,-2)+"], "+switches.slice(0,-2)+"], "+arrows.slice(0,-2)+"]}";
  	return txt;
}

this.exportJSON=exportJSON;
function exportJSON(){
	
	txt=makeJSON();
	var el = document.getElementById(targetElement);
	el.innerHTML = "";

	var jsonSection = html.addSection(el,'jsonSection', 'Export/Import JSON', false);

	var element = document.createElement("button");
    //Assign different attributes to the element.
    element.innerHTML = "Import";
    element.setAttribute("id", "importJSON");
    // change value when input value changes
    element.onclick = function() {
     app.importJSON(area.value);
    };
    //Append the element in page (in span).
    jsonSection.appendChild(element);

	html.breakLine(jsonSection);

	var area = document.createElement("textarea");
	area.setAttribute("id", "JSON");
	area.setAttribute('style',"display:block; width:95%; margin:auto; min-height:430px;");
	area.innerHTML = txt;
 	jsonSection.appendChild(area);
}

this.importJSON=importJSON;
function importJSON(text){
 shapes = {"nodes":[], "arrows":[], "routers":[], "switches":[]};
 var json=validate(JSON.parse(text));

 $.each(json, function(key,val){
	for (i=0; i < val.length; i++) {
		var add;
		if (key=="arrows"){
			add = new Arrow();
			add.fromJSON(val[i])
  			shapes.arrows.push(add);
  		} else if (key=="nodes"){
  			add = new Node();
  			add.fromJSON(val[i]);
  			shapes.nodes.push(add);	
  		} else if (key=="switches"){
  			add = new Switch();
  			add.fromJSON(val[i]);
  			shapes.switches.push(add);	
  		} else if (key=="routers"){
  			add = new Router();
  			add.fromJSON(val[i]);
  			shapes.routers.push(add);	
  		}

	}
});
drawScreen();
 
}


this.add = add;
function add(obj){
 if (obj instanceof Arrow){
 	shapes.arrows.push(obj);
 }else if(obj instanceof Node){
 	shapes.nodes.push(obj);
 }else if(obj instanceof Router){
 	shapes.routers.push(obj);
 }else if(obj instanceof Switch){
 	shapes.switches.push(obj);
 }
 drawScreen();
}

this.remove = remove;
function remove(obj){
 var objects;
 if (obj instanceof Arrow){
 	objects = shapes.arrows;
 }else if(obj instanceof Node){
 	objects = shapes.nodes;
 } else if (obj instanceof Router){
 	objects = shapes.routers;
 } else if (obj instanceof Switch){
 	objects = shapes.switches;
 }
 var i = 0;
  for (i = 0; i < objects.length; i++){
  	if (objects[i]==obj) objects.splice(i,1);
  }
 drawScreen();
}

this.removeAll=removeAll;
function removeAll(){
	var r=confirm("Warning, removing all items!")
	if (r==true){
		shapes = {"nodes":[], "arrows":[], "routers":[], "switches":[]};
		document.getElementById(targetElement).innerHTML="";
   } 
   	this.schemaName="";
   	this.schemaId="";
 	drawScreen();
}

this.getNode=getNode;
function getNode(id){
  return shapes.nodes[id];	
}
this.getArrow=getArrow;
function getArrow(id){
  return shapes.arrows[id];	
}

this.getShape=getShape;
function getShape(type,id) {
	return shapes[type][id];
}

this.getShapes=getShapes;
function getShapes(){
	return shapes;
}

this.getNames=getNames;
function getNames(types) {
	var i;
	var names=[];
	for (i = 0; i < types.length; i++){
  		var objects=shapes[types[i]];
  		$.each(objects, function(key,val){
  			names.push(val.name);
  		});
  	}
  	return names;
}

this.getIndexOf=getIndexOf;
function getIndexOf(el){
 var index=[];
 var objects;
 if (el instanceof Arrow){
 	objects = shapes.arrows;
 	index.push('arrows');
 }else if(el instanceof Node){
 	objects = shapes.nodes;
 	index.push('nodes');
 }else if(el instanceof Router){
 	objects = shapes.routers;
 	index.push('routers');
 }else if(el instanceof Switch){
 	objects = shapes.switches;
 	index.push('switches');
 }
  var i = 0;
  for (i = 0; i < objects.length; i++){
  	if (objects[i]==el)  index.push(i);
  }
  return index;
}

this.getOptionsForSelect=getOptionsForSelect;
function getOptionsForSelect(){
   var a={"nodes":[], "routers":[], "switches":[]};
   var i=0;
   	$.each(shapes, function(key,val){
   	if (key!="arrows"){
   		for (i=0; i < val.length; i++) {
   	   		tmp=[];
   	   		tmp.push(i);
   	   		tmp.push(val[i].name);
   	   		a[key].push(tmp);
   	   }
   	}
   });


   return a;
}

this.redraw=drawScreen;
	
function init() {
	easeAmount = 0.20;
	bgColor = "#ffffff";
	textColor="#000000";
	shapes = {"nodes":[], "arrows":[], "routers":[], "switches":[]};

	drawScreen();

	c.addEventListener("mousedown", mouseDownListener, false);
	c.addEventListener('dblclick', dblclickListener,false);
}

function dblclickListener(evt){
	//getting mouse position correctly 
	var bRect = c.getBoundingClientRect();
	mouseX = (evt.clientX - bRect.left)*(c.width/bRect.width);
	mouseY = (evt.clientY - bRect.top)*(c.height/bRect.height);
			
	//find which shape was clicked
	$.each(shapes, function(key,val){
		for (i=0; i < val.length; i++) {		
			if	(val[i].editable && val[i].hover(mouseX, mouseY)) {
				//the following variable will be reset if this loop repeats with another successful hit:
				being_dbl=val[i];
				being_dbl.show_form(document.getElementById(targetElement), i);
			}
		}
	});
	
}
	
function mouseDownListener(evt) {
	var i;
	
	//getting mouse position correctly 
	var bRect = c.getBoundingClientRect();
	mouseX = (evt.clientX - bRect.left)*(c.width/bRect.width);
	mouseY = (evt.clientY - bRect.top)*(c.height/bRect.height);
			
	//find which shape was clicked
	$.each(shapes, function(key,val){
		for (i=0; i < val.length; i++) {
			if	(val[i].hover(mouseX, mouseY)) {
				//the following variable will be reset if this loop repeats with another successful hit:
				being_clicked=val[i];
			}
			if	(val[i].draggable && val[i].hover(mouseX, mouseY)) {
				dragging = true;
				//the following variable will be reset if this loop repeats with another successful hit:
				being_dragged=val[i];
				// clear the timer so that there is no moving conflicts
				clearInterval(timer);
			}
		}
	});
	if (dragging && being_used==null) {
		window.addEventListener("mousemove", mouseMoveListener, false);
				
		//shape to drag is remembered in a variable:
		dragHoldX = mouseX - being_dragged.x;
		dragHoldY = mouseY - being_dragged.y;
		
		//The "target" position is where the object should be if it were to move there instantaneously. But we will
		//set up the code so that this target position is approached gradually, producing a smooth motion.
		targetX = mouseX - dragHoldX;
		targetY = mouseY - dragHoldY;
		
		//start timer
		timer = setInterval(onTimerTick, 1000/30);
	} else if (mouseY < menuHeight){
		// the object being dragged was on the menu
		for(var prop in menu.items) {
          if(menu.items.hasOwnProperty(prop)){
          	
  		   	if (menu.items[prop].hover(mouseX, mouseY)){
  		    	
  		    	being_used = menu.items[prop];
  		    	dragging = true;
  		    } 
  	      } 	
       }
       if (dragging){
  	     	for(var prop in menu.items) {
    	      if(menu.items.hasOwnProperty(prop)){
		  	   	if (menu.items[prop]!=being_used){
		  	    	//not clicking this, make inactive
  			    	menu.items[prop].active=false;
  		   			//menu.items[prop].draw(ctx);	
  		   		}
  	    	  }  	
       		}
       } else {
       	being_used = null;
       }
       drawScreen();
       if (being_used && !being_used.active){
   	  	   	// display guiding text
   	  	   	ctx.fillStyle = textColor;
   	  	   	ctx.font = "12px Arial"
   	    	ctx.textAlign = "left"; 
   	    	ctx.textBaseline = "bottom"; 
   	    	ctx.fillText(being_used.text, 10, bRect.height );
  		}
	} else {
		dragging=true;
		
	}
	c.removeEventListener("mousedown", mouseDownListener, false);
	window.addEventListener("mouseup", mouseUpListener, false);
	
	//code below prevents the mouse down from having an effect on the main browser window:
	if (evt.preventDefault) {
		evt.preventDefault();
	} //standard
	else if (evt.returnValue) {
		evt.returnValue = false;
	} //older IE
	return false;
}

function onTimerTick() {
	/*
	The code below moves this shape only a portion of the distance towards the current "target" position, and 
	because this code is being executed inside a function called by a timer, the object will continue to
	move closer and closer to the target position.
	The amount to move towards the target position is set in the parameter 'easeAmount', which should range between
	0 and 1. The target position is set by the mouse position as it is dragging.		
	*/

	being_dragged.x = being_dragged.x + easeAmount*(targetX - being_dragged.x);
	being_dragged.y = being_dragged.y + easeAmount*(targetY - being_dragged.y);
	//stop the timer when the target position is reached (close enough)
	if ((!dragging)&&(Math.abs(being_dragged.x - targetX) < 1) && (Math.abs(being_dragged.y - targetY) < 1)) {
		being_dragged.x = Math.floor(targetX);
		being_dragged.y = Math.floor(targetY);
		//stop timer:
		clearInterval(timer);
	}
	drawScreen();
}

function mouseUpListener(evt) {
	c.addEventListener("mousedown", mouseDownListener, false);
	window.removeEventListener("mouseup", mouseUpListener, false);
	if (dragging) { 
		dragging = false;
		window.removeEventListener("mousemove", mouseMoveListener, false);
		menuHelper(evt);
		drawScreen();
       if (being_used && being_used.active){
   	  	   	// display guiding text
   	  	   	ctx.fillStyle = textColor;
   	  	   	ctx.font = "12px Arial"
   	    	ctx.textAlign = "left"; 
   	    	ctx.textBaseline = "bottom"; 
   	    	var bRect = c.getBoundingClientRect();
   	    	ctx.fillText(being_used.text, 10, bRect.height );
  		}
	}
}

function menuHelper(evt){
	//getting mouse position correctly 
	var bRect = c.getBoundingClientRect();
	mouseX = (evt.clientX - bRect.left)*(c.width/bRect.width);
	mouseY = (evt.clientY - bRect.top)*(c.height/bRect.height);
	// working with menu items
	
	if (being_used){
		if (being_used.type=="click"){
			// the single click buttons
			being_used.click();
			being_used=null;

		} else if (being_used.type=="drag"){
			// positioning and acting based on the mouse position
			if (mouseY < menuHeight){
					being_used.click(mouseX,menuHeight);
			} else {
					being_used.drop(mouseX, mouseY);
			}
			// unset menuitem once done
			being_used=null;
		} else if(being_used.type=="drag1"){
			// activate and wait for an item to be dragged
			if (being_used.hover(mouseX, mouseY)) {
				being_used.click();
				being_used.draw(ctx);
				if (!being_used.active) {
					// unset menuitem once done
					being_used=null;
				}
				// forget last dragged
				being_dragged=null;
			} else if (being_used.active && being_dragged!=null){
				being_used.drop(being_dragged, mouseX,mouseY);
				being_dragged=null;
			}

		} else if(being_used.type=="select1"){
			// activate and wait until some element is selected
			if (being_used.hover(mouseX, mouseY)) {
				being_used.click();
				being_used.draw(ctx);
				if (!being_used.active) {
					// unset menuitem once done
					being_used=null;
				} 
				// forget the last clicked element
				being_clicked=null;
				
			} else if (being_used.active && being_clicked!=null){
				being_used.drop(being_clicked);
				being_clicked=null;
			}

		} else if(being_used.type=="select2"){
			// activate/deactivate when still over the menuitem wait until 2 elements are selected
			if (being_used.hover(mouseX, mouseY)) {
				being_used.click();
				being_used.nodes=[];
				being_used.draw(ctx);
				if (!being_used.active) {
					// unset menuitem once done
					being_used=null;
				} 
				// forget last element that was dragged
				being_dragged=null;

			} else if (being_used.active && being_dragged!=null){
				if(being_used.nodes.length<1 || being_used.nodes.length>1){
					// create a holder for the nodes with the currently selected object
					// if there is no node holder OR when there are already 2 nodes selected
					being_used.nodes=[being_dragged];
					being_dragged=null;
				} else if (being_dragged!=being_used.nodes[0]){
					/*
				 		chek for no same-type connections
					*/
					var from=getIndexOf(being_used.nodes[0]);
					var to=getIndexOf(being_dragged);
					// routers and switches are both network elements
					var nets=["routers", "switches"];
					if ( nets.indexOf(to[0])>=0 ) to[0]="network";
					if ( nets.indexOf(from[0])>=0 ) from[0]="network";
					// the elements are of different kind
					if (from[0]!=to[0]){ 
						//there is one node, add this one and connect them
						being_used.nodes.push(being_dragged);
						being_used.drop(being_used.nodes[0],being_used.nodes[1]);
						being_used.nodes=[];
					}
					being_dragged=null;
				} else {
					// the user clicked on the same thing, unselect
					being_used.nodes=[];
					being_dragged=null;
				}
				drawScreen();
			
			}

		}
		
	}

}



function mouseMoveListener(evt) {
	var posX;
	var posY; 
	var shape = [being_dragged.width, being_dragged.height];
	var minX = 0;
	var maxX = c.width - shape[0]; // substract the width
	var minY = menuHeight+(being_dragged.border/2);
	var maxY = c.height - shape[1]; // substract the height
	//getting mouse position correctly 
	var bRect = c.getBoundingClientRect();
	mouseX = (evt.clientX - bRect.left)*(c.width/bRect.width);
	mouseY = (evt.clientY - bRect.top)*(c.height/bRect.height);
	
	//clamp x and y positions to prevent object from dragging outside of canvas
	posX = mouseX - dragHoldX;
	posX = (posX < minX) ? minX : ((posX > maxX) ? maxX : posX);
	posY = mouseY - dragHoldY;
	posY = (posY < minY) ? minY : ((posY > maxY) ? maxY : posY);
	
	targetX = posX;
	targetY = posY;
}
	

function drawShapes() {
	var i;

	if (being_used && being_used.active && being_used.nodes){
        	ctx.fillStyle="grey";
        	for (i=0;i<being_used.nodes.length; i++){
        		var a=being_used.nodes[i];
        		ctx.fillRect(a.x, a.y, a.width*(a.scale/100),a.height*(a.scale/100));
        	}
    }
    $.each(shapes, function(key,val){
    	for (i=0; i < val.length; i++) {
			val[i].draw(ctx);
		}
    });
	 // static menu
	for(var prop in menu.items) {
      if(menu.items.hasOwnProperty(prop)){
  		  menu.items[prop].draw(ctx);
  	  } 	
    }
	
}
	
function drawScreen() {
	//bg
	ctx.fillStyle = bgColor;
	ctx.clearRect(0, 0, c.width, c.height);
   
	drawShapes();		
}
}
