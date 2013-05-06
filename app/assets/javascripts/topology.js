/*
PRELOAD ALL IMAGES
*/

var images = {'menu':['/assets/new.svg', '/assets/open.svg','/assets/save.svg', '/assets/hand.svg','/assets/arrow2.svg',  '/assets/duplicate.svg', '/assets/trash.svg', '/assets/json.png'],
              'nodes':['/assets/workstation.svg', '/assets/workstation_green.svg','/assets/workstation_red.svg'],
              'switches':['/assets/switch.svg'],
              'routers':['/assets/router.svg']
};

function loadImages(sources, callback) {
  var images = {};
  var loadedImages = 0;
  var numImages = 0;
  $.each(sources, function(key, value){
    numImages+=value.length;
  });

  $.each(sources, function(key, val){
     images[key] = [];
    for (i=0;i<val.length;i++){
      images[key][i] = new Image();
      images[key][i].onload = function(){
        if (++loadedImages >= numImages) { 
         
          callback(images); 
        }
      };
      images[key][i].src = sources[key][i]; 
    }
  });
} 

/* ARROW OBJECT
 ------------------
 a = new Arrow(from x, from y, to x, to y);
 
 arrow starting coordinates
 a.x1
 a.y1

 arrow ending coordinates
 a.x2
 a.y2

 arrowhead styles 
 a.style
   0 - simple > end
   1 - simple triangle end

 where to add arrowheads
 a.ends
   0 - no ends
   1 - target end
   2 - start end
   3 - both ends

 the height of the arrow head
 a.tip

 the angle of the arrowhead half
 a.angle

 if the arrow should be draggable (by default false, and is recommended to stay so until further dev) 
 a.draggable

 if the element should be edited
 a.editable

 arrow drawing function, needs the context to draw to
 a.draw(ctx);

 show a form to edit parameters in the specified element
 a.show_form(el) 

 to check if a point is over the line (or close enough to be considered that)
 a.hover(x,y)

 by Tiia Tänav 2013

*/
function Arrow(x1, y1, x2, y2){
 // when creating object, save the coordinates
 this.x1= typeof(x1)!='undefined'? x1:0 ;
 this.y1=typeof(y1)!='undefined'? y1:0 ;;
 this.x2=typeof(x2)!='undefined'? x2:100 ;
 this.y2=typeof(y2)!='undefined'? y2:100 ;
 // calculate angle based on initialize coordinates, the value will be recalculated when drawing because the user can still move the points
 this.angle = Math.atan2(this.y2-this.y1, this.x2-this.x1);

 // default values 
 this.style = 0;
 this.ends = 0; 
 this.tip = 15;
 this.headAngle = Math.PI/8; 
 this.color="black";
 this.line=1;
 this.draggable = false;
 this.editable = true;
 this.sections={ "styleSection":true, "endSection":true};

 this.name="dev0";
 this.from=null;
 this.to=null;

/*
  draw the arrow and its TODO! label
*/

this.draw = draw;
function draw(ctx){

   // if the arrow is tied to objects calculate the new coordinates before drawing!
   if (this.from!=null && this.to!=null){
    this.connect();
   }
  
   var prev = [ctx.strokeStyle, ctx.lineWidth, ctx.fillStyle]; // save previous
   ctx.strokeStyle = this.color; // use this object color
   ctx.lineWidth = this.line;   
   ctx.fillStyle = this.color;   

   // drawing the arrow
   drawLine(this, ctx);
   calcEnd(this, ctx);

   ctx.strokeStyle = prev[0]; // use this object color
   ctx.lineWidth = prev[1]; 
   ctx.fillStyle = prev[2];
}

this.connect=connect;
 function connect(){
   var line = this.line;
   var ends = this.ends;
   var obj2 = this.to;
   var obj1 = this.from;
   // calculate coordinates on the objects edge
   if (ends==0){
    var from = calcEdge(obj1, obj2);
    var to = calcEdge(obj2, obj1);
   } else if (ends==1){
    var from = calcEdge(obj1, obj2);
    var to = calcEdge(obj2, obj1, line);
   } else if (ends==2){
    var from = calcEdge(obj1, obj2, line);
    var to = calcEdge(obj2, obj1);
   } else {
    var from = calcEdge(obj1, obj2, line);
    var to = calcEdge(obj2, obj1, line);
   }
   this.x1=Math.floor(from.x1);
   this.y1=Math.floor(from.y1);
   this.x2=Math.floor(to.x1);
   this.y2=Math.floor(to.y1);
 }

 function calcEdge(obj1, obj2, line){
    line=typeof(line)!='undefined'? line:0;
    // calculate center
    var x1 = obj1.x+(obj1.width*(obj1.scale/100))/2;
    var y1 = obj1.y+(obj1.height*(obj1.scale/100))/2;
    var x2 = obj2.x+(obj2.width*(obj1.scale/100))/2;
    var y2 = obj2.y+(obj2.height*(obj1.scale/100))/2;
    // make faux arrow
   var a = new Arrow(x1, y1, x2, y2);
   
    // define half diagonals
   var d1 = new Arrow(x1,y1, obj1.x, obj1.y);
   var d2 = new Arrow(x1,y1, obj1.x+(obj1.width*(obj1.scale/100)), obj1.y);
    var border = Math.ceil(obj1.border/2);
    var padding = border + line;
    // calculate new starting point based on the sector the arrow falls into
   if (a.angle > d1.angle && a.angle < d2.angle){
     //console.log("top");
     a.y1 = y1 - (obj1.height*(obj1.scale/100)) / 2 - padding;
     a.x1 = x1 + Math.tan(a.angle + Math.PI/2) * ((obj1.height*(obj1.scale/100)) / 2);
     // ensuring smooth x coordinate
     var rate = Math.abs(Math.PI/2 - Math.abs(a.angle)) / (Math.PI / 2 - Math.abs(d2.angle));
     if ( Math.abs(a.angle) < Math.PI/2 ) // right half of the top side 
      a.x1 += padding * rate; 
     else               // left half of the top side
      a.x1 -= padding * rate;

   } else if (Math.abs(a.angle) >= Math.abs(d1.angle)){
     //console.log("left");
     a.x1 = x1 - (obj1.width*(obj1.scale/100)) / 2 - padding;
     a.y1 = y1 - Math.tan(a.angle) * ((obj1.width*(obj1.scale/100)) / 2);
     // ensuring smooth y coordinate
     var rate = (Math.PI - Math.abs(a.angle)) / (Math.PI - Math.abs(d1.angle));
     if ( a.angle > 0 ) // lower half of the left side 
      a.y1 += padding * rate; 
     else               // upper half of the left side
      a.y1 -= padding * rate;

   } else if (Math.abs(a.angle) <= Math.abs(d2.angle)){
     //console.log("right");
     a.x1 = x1 + (obj1.width*(obj1.scale/100)) / 2 + padding;
     a.y1 = y1 + Math.tan(a.angle) * ((obj1.width*(obj1.scale/100)) / 2);
      // ensuring smooth y coordinate
     var rate = Math.abs(a.angle) / Math.abs(d2.angle);
     if ( a.angle > 0 ) // lower half of the right side 
      a.y1 += padding * rate; 
     else               // upper half of the right side
      a.y1 -= padding * rate;

   } else {
     //console.log("bottom");
     a.y1 = y1 + (obj1.height*(obj1.scale/100)) / 2 + padding;
     a.x1 = x1 - Math.tan(a.angle - Math.PI / 2) * ((obj1.height*(obj1.scale/100)) / 2);
     // ensuring smooth x coordinate
     var rate = Math.abs(Math.PI / 2 - Math.abs(a.angle)) / (Math.PI / 2 - Math.abs(d2.angle));
     if ( a.angle < Math.PI / 2 ) // right half of the bottom side 
      a.x1 += padding * rate; 
     else               // left half of the bottom side
      a.x1 -= padding * rate;
   }
   return a;
   }


function drawLine(a, ctx){
 // drawing the line
 ctx.beginPath();
 ctx.moveTo(a.x1, a.y1);
 ctx.lineTo(a.x2, a.y2);
 ctx.stroke();

}

function calcEnd(a, ctx){
 // calculate the angle of the line 
 a.angle = Math.atan2(a.y2-a.y1, a.x2-a.x1); 
 // h is the line length of a side of the arrow head 
 var h = Math.abs(a.tip/Math.cos(a.headAngle));

 // draw the ends based on points
 if (a.ends==0){
  // no ends
 }
 else if (a.ends==1){
  // destination
  drawEnd(a, ctx, h, 1);
 }else if (a.ends==2){
  // start
  drawEnd(a, ctx, h,0);
 }else {
  //both
   drawEnd(a, ctx, h, 1);
   drawEnd(a, ctx, h, 0);
 }

}

function drawEnd(a, ctx, h, e){
  // start 0, end 1, one needs PI other doesnt
  if (e==0){
   var Pi=0;
   var x = a.x1;
   var y = a.y1;
  } else { 
   var Pi=Math.PI;
   var x = a.x2;
   var y = a.y2;
  }

  var angle1=a.angle+Pi+a.headAngle; 
  var topx=x+Math.cos(angle1)*h; 
  var topy=y+Math.sin(angle1)*h;
  var angle2=a.angle+Pi-a.headAngle; 
  var botx=x+Math.cos(angle2)*h; 
  var boty=y+Math.sin(angle2)*h;

  drawArrowhead(ctx, topx, topy, x, y, botx, boty, a.style);
}

function drawArrowhead(ctx, x1, y1, x2, y2, x3, y3, style){
  ctx.beginPath();

  if (style==0){ // line arrow
   ctx.moveTo(x1,y1);
   ctx.lineTo(x2,y2);
   ctx.lineTo(x3,y3);
   ctx.stroke();
  } else if (style==1){ // simple filled
   ctx.moveTo(x1,y1);
   ctx.lineTo(x2,y2);
   ctx.lineTo(x3,y3);
   ctx.closePath();
   ctx.fill();
   ctx.stroke();
  } 

 }

/*
  show the form inside the given element
*/

 this.show_form=show_form;
function show_form(el, index){
   el.innerHTML="";
   // to track the id
   html.addInput(el,'hidden','id',index);
   html.addInput(el,'hidden','type',"arrows");

   var styleSection = html.addSection(el,'styleSection','Style properties');
   var endSection = html.addSection(el,'endSection','Connection properties');
   
   html.breakLine(styleSection);
   html.addLabel(styleSection,'color','Color');
   html.addInput(styleSection,'color','color',this.color);
   html.breakLine(styleSection);
   html.addLabel(styleSection,'line','Line width');
   html.addInput(styleSection,'number','line',this.line, 10);
   html.breakLine(styleSection);
   html.addLabel(styleSection,'ends', "Arrow ends");
   html.addSelect(styleSection, 'ends', this.ends, ['none','target','start','both'])
   html.breakLine(styleSection);
   html.addLabel(styleSection,'style', "Arrow style");
   html.addSelect(styleSection, 'style', this.style, ['default','filled triangle'])
   html.breakLine(styleSection);
   html.addLabel(styleSection,'tip','Arrow height');
   html.addInput(styleSection,'number','tip',this.tip, 50);  
   html.breakLine(styleSection);
   html.addLabel(styleSection,'headAngle','Arrow agle');
   html.addInput(styleSection,'number','headAngle',this.headAngle.toFixed(2), Math.PI.toFixed(2), 0, 0.01); 
   
   options = app.getOptionsForSelect();
   var forFrom={};
   var forTo={};
   /*only different kinds of elements can be connected*/
   if (this.from instanceof Node){
    forTo={'routers':options['routers'], "switches":options['switches']};
    forFrom={'nodes':options['nodes']};
   } else {
    forTo={'nodes':options['nodes']};
    forFrom={'routers':options['routers'], "switches":options['switches']};
   }
   html.addLabel(endSection,'from', "From");
   html.addNodeSelect(endSection,'from', this.from, forFrom);
   html.breakLine(endSection);
   html.addLabel(endSection,'to', "To");
   html.addNodeSelect(endSection,'to', this.to, forTo);

}

/*
  are the given coordinates on this arrow?
*/
 this.hover = hover;
 function hover(x,y){
    var min = 6+this.line/2;
    var h = 100;
   // to get the point distance from the start
   var dx1=Math.floor(this.x1-x);
   var dy1=Math.floor(this.y1-y);
   var a2=dx1*dx1+dy1*dy1;
   var a=Math.sqrt(a2);
   // to get the point distance from the end
   var dx2=Math.floor(this.x2-x);
   var dy2=Math.floor(this.y2-y);
   var b2=dx2*dx2+dy2*dy2;
   var b=Math.sqrt(b2);
   // the arrow length
   var dx=Math.floor(this.x1-this.x2);
   var dy=Math.floor(this.y1-this.y2);
   var c2=dx*dx+dy*dy;
   var c=Math.sqrt(c2);
   
   h = (a*b)/c;
   var alpha = Math.asin(h/b);
   var beta = Math.asin(h/a);

   // check that the mouse is not over the connected nodes
   var bool=!(this.to.hover(x,y) || this.from.hover(x,y));
   // to get the angle between the arrow and point
   tmp_a = new Arrow(this.x1,this.y1,x,y);
   alpha2 = Math.abs(this.angle)-Math.abs(tmp_a.angle);
   // calculate distance 
   h=Math.abs(a*Math.sin(alpha2));
 
   // TODO! this will work on the extended arrow, need to limit it! ie with angles
   // return if the mouse is outside nodes and close enough to the arrow
   return h<min && bool && (beta>0 && alpha>0);

 }


  this.toJSONstring=toJSON;
 function toJSON(){
    var ignore = ['angle', 'draggable','editable', "x1", "y1", "x2","y2", "sections", 'name'];
    tmp="{ ";//\"type\" : \"Arrow\", \"id\" : "+app.getIndexOf(this)+", ";
    for(var prop in this) {
      if(this.hasOwnProperty(prop)){         
          if (typeof this[prop] != "function" && ignore.indexOf(prop) < 0){
              if (prop=="to" || prop=="from"){
                var inf=app.getIndexOf(this[prop]);
                tmp+="\n   \""+prop+"\" : \""+inf[0]+"-"+inf[1]+"\", ";
              } else if (typeof this[prop]=="number" || typeof this[prop]=="boolean"){
                if (prop=="headAngle") {
                  tmp+="\n   \""+prop+"\" : "+this[prop].toFixed(3)+", ";
                }else {
                    tmp+="\n   \""+prop+"\" : "+this[prop]+", ";
                  }
              } else {
                tmp+="\n   \""+prop+"\" : \""+this[prop]+"\", ";
              }
          } 
      }   
   }
   tmp = tmp.slice(0, -2);
   return tmp+"\n}";
 }

 this.fromJSON=fromJSON;
 function fromJSON(json){
    for(var prop in json) {
      if(this.hasOwnProperty(prop)){         
          if (typeof this[prop] != "function"){
            if (prop=="to" || prop=="from"){
                inf=json[prop].split('-');
                this[prop]=app.getShape(inf[0], inf[1]);
              } else {
                this[prop]=json[prop];
              }
          } 
      }   
   }

 }

}

/* 
NODE OBJECT

 n1 = new Node(x, y, name, state);

 draw the node, needs the context
 n1.draw(ctx)

 show a form to edit parameters in the specified element
 n1.show_form(el) 

 to check if a point is over the node
 n1.hover(x,y)

 to make a clone of the node (returns new)
 copy = n1.copy();

 to export the object in JSON
 json = n1.toJSONstring()

 to set instance values based on JSON
 new.fromJSON(jsonSource);

*/

function Node(x, y, name, state){
 
 // properties needed for drawing
 this.x =  typeof(x)!='undefined'? x:1;
 this.y =  typeof(y)!='undefined'? y:1;
 this.state =  typeof(state)!='undefined'? state:0;

 this.height = 62;
 this.width = 80;
 this.scale = 100;
 this.color = "black";
 this.border = 0; // can add borders if need be

 this.draggable = true; 
 this.editable = true;

 this.name = typeof(name)!='undefined'? name:"newNode"; 
 this.cpu = 1;
 this.memory = 524288;
 this.current_memory = 524288;
 this.memory_unit="KiB"; 

 this.disks = [{"device":"disk", 
                "type":"file", 
                "driverName":"qemu", 
                "driverType":"qcow2", 
                "source":"image location",
                "targetBus":"virtio",
                "targetDev":"vda"
              }];
 // features
 this.pae=true;
 this.acpi=true;
 this.apic=true;
 this.hap=true;
 this.privnet=false;
 this.hyperv=false;

this.networks = new Array(); // routers and switches
this.bridges = new Array(); // bridges on the host, allowing direct connection

this.sections={ "styleSection":true, "nodeSection":true, 
                "featureSection":true, "diskSection":true, 
                "networkSection":true,  "bridgeSection":true};

this.defaults={"disks":{"device":"disk", 
                "type":"file", 
                "driverName":"qemu", 
                "driverType":"qcow2", 
                "source":"image location",
                "targetBus":"virtio",
                "targetDev":"vda"
              },
              "networks":{"name":"internal", "dev":"int", "mac":""},
              "bridges":{"name":"bridge", "dev":"br", "mac":""},
              "devs" : {"virtio":"vd", "ide":"hd", "scsi":"sd", "xen":"xvd", "usb":"sd", "sata":"sd"}
            };
 this.draw=draw;
 function draw(ctx){
    var x = this.x;
    var y = this.y;
    var width = this.width*(this.scale/100);
    var height = this.height*(this.scale/100);

   var prev = [ctx.strokeStyle, ctx.lineWidth, ctx.fillStyle]; // save previous
   
   ctx.strokeStyle = this.color; // use this object color
   ctx.lineWidth = this.border;   
   ctx.fillStyle = this.color;
   
   if (this.border>0){
      // draw the object with outlines
      ctx.strokeRect(this.x, this.y, width, height);
   } 
   // add the name
   if (typeof(this.name)!="undefined"){
      ctx.font="12px Arial"
      ctx.textAlign = "center"; 
      ctx.textBaseline = "top"; 
      ctx.fillText(this.name, x+width/2, y+height+this.border/2);
   }
    
    var ex = images.nodes[this.state];
    ctx.drawImage(ex, x, y, width, height);

   ctx.strokeStyle = prev[0]; // restore previous
   ctx.lineWidth = prev[1];
   ctx.fillStyle = prev[2];
   /*for (i=0;i< this.neighbors.length; i++) {
     a = this.arrow(this.neighbors[i]);
     a.draw(ctx);
   }*/
 } 
 this.copy=copy;
 function copy(){
   var newobj = new Node(this.x, this.y, this.name+" (copy)");

   for(var prop in newobj) {
      if(newobj.hasOwnProperty(prop)){         
          if (typeof newobj[prop] != "function" && prop!="name"){
              newobj[prop]=this[prop];
          } 
      }   
   }
   // TODO: add properties assignment when properties are set

   return newobj;

 }
/*
  show the form inside the given element
*/

 this.show_form=show_form;
function show_form(el, index){
    alpha=["a", "b", "c", "d", "e", "f", "g", "h"];
    el.innerHTML="";
   // to track the id
   html.addInput(el,'hidden','id',index);
   html.addInput(el,'hidden','type',"nodes");

   var styleSection = html.addSection(el,'styleSection', 'Style properties');
   var nodeSection = html.addSection(el,'nodeSection', 'Node properties');

   var featureSection = html.addSection(el,'featureSection', 'Node Features');
  
   html.addLabel(styleSection, 'scale','Scale');
   html.addInput(styleSection,'range','scale',this.scale, 100, 25, 1);
   html.breakLine(styleSection);
  
   html.addLabel(styleSection,'color','Color');
   html.addInput(styleSection,'color','color',this.color);
   html.breakLine(styleSection);
   html.addLabel(styleSection,'border','Border width');
   html.addInput(styleSection,'number','border',this.border, 10,0);

   // validate name, to not contain spaces and to be unique
  
   html.addLabel(nodeSection, 'name','Name');
   html.addInput(nodeSection,'text','name',this.name);
   html.breakLine(nodeSection);
   var names = app.getNames(["routers", "switches", "nodes"]);
   count=0;
   for (i=0; i<names.length; i++){
    if (names[i]==this.name) count++;
   }
   if (count>1){
    html.errorNotice(nodeSection, "Name in use, choose another one");
    html.breakLine(nodeSection);
   }
   // there should not be whitespace in the names
   if (this.name.indexOf(' ') >= 0){
    html.errorNotice(nodeSection, "Names should not contain whitespaces");
    html.breakLine(nodeSection);
   }
   html.addLabel(nodeSection, 'cpu','CPUs');
   html.addInput(nodeSection,'number','cpu',this.cpu, 4, 1);
   html.breakLine(nodeSection);
   html.addLabel(nodeSection, 'memory','Max memory');
   html.addInput(nodeSection,'text','memory',this.memory);
   html.addTextSelect(nodeSection,'memory_unit',this.memory_unit, 
                      ["b", "KB", "KiB", "MB", "MiB", "GB", "GiB", "TB", "TiB"]);
   html.breakLine(nodeSection);
   // validate memory
   if (this.memory<this.current_memory) this.current_memory=this.memory;
   html.addLabel(nodeSection, 'current_memory','Current memory');
   html.addInput(nodeSection,'number','current_memory',this.current_memory, this.memory, 1);
   html.breakLine(nodeSection);

   var diskSection = html.addSection(nodeSection,'diskSection', 'Disks');
   var networkSection = html.addSection(nodeSection,'networkSection', 'Networks');
   var bridgeSection = html.addSection(nodeSection,'bridgeSection', 'Bridges');
   var i=0;
  
    for(i=0;i<this.disks.length;i++){
      html.addLabel(diskSection, 'device','Device');
      html.addTextSelect(diskSection,'disks-device',this.disks[i].device, 
                          [  "floppy", "disk", "cdrom", "lun"], i);
      html.breakLine(diskSection);

      html.addLabel(diskSection, 'type','Device type');
      html.addTextSelect(diskSection,'disks-type',this.disks[i].type, 
                          [ "file", "block", "dir", "network"], i);
      html.breakLine(diskSection);

      html.addLabel(diskSection, 'driverName','Driver name');
      html.addTextSelect(diskSection,'disks-driverName',this.disks[i].driverName, 
        [ "qemu"], i);
      html.breakLine(diskSection);

      html.addLabel(diskSection, 'driverType','Driver type');
      html.addTextSelect(diskSection,'disks-driverType',this.disks[i].driverType, 
        [ "raw", "bochs", "qcow2", "qed"], i);
      html.breakLine(diskSection);

      html.addLabel(diskSection, 'source','Image');
      html.addSubInput(diskSection,'text','disks-source',this.disks[i].source, i );
      html.breakLine(diskSection);

      html.addLabel(diskSection, 'targetBus','Target bus');
      html.addTextSelect(diskSection,'disks-targetBus',this.disks[i].targetBus, 
        ["ide", "scsi", "virtio", "xen", "usb", "sata"], i);
      html.breakLine(diskSection);

      // set target dev according to the target bus + letter
      this.disks[i].targetDev = this.defaults['devs'][ this.disks[i].targetBus ] + alpha[i];
      html.addLabel(diskSection, 'targetDev','Target dev is <b>'+this.disks[i].targetDev+"</b>");
      html.breakLine(diskSection);

      html.removeThis(diskSection, "disks", i);
      html.breakLine(diskSection);
      html.hrLine(diskSection);
    } 
    html.addAnother(diskSection, "disks");
    html.breakLine(diskSection);

/* network name, target dev (how to name the network on the guest)*/

  this.networks=app.getArrows(this);
    for(i=0;i<this.networks.length;i++){
      if (this.networks[i].to==this){
        other=this.networks[i].from;
      } else {
        other=this.networks[i].to;
      }
    
      html.addLabel(networkSection, 'name','connected to network: <b>'+other.name+'</b>');
      html.breakLine(networkSection);
      html.addLabel(networkSection, 'dev','Target dev');
      html.changeValue(networkSection, this.networks[i], 'name', this.networks[i].name, 'text');
      html.breakLine(networkSection);
     /* html.removeThis(networkSection, "networks", i);
      html.breakLine(networkSection);*/
      html.hrLine(networkSection);
    }
    html.addLabel(networkSection, 'info','Add networks by connecting the node to routers or switches.');
      html.breakLine(networkSection);

/* bridge name, mac address, target dev */
    for(i=0;i<this.bridges.length;i++){
        html.addLabel(bridgeSection, 'name','Bridge name');
        html.addSubInput(bridgeSection,'text','bridges-name', this.bridges[i].name, i);
        html.breakLine(bridgeSection);
        html.addLabel(bridgeSection, 'dev','Target dev');
        html.addSubInput(bridgeSection,'text','bridges-dev',this.bridges[i].dev, i );
        html.breakLine(bridgeSection);
        html.removeThis(bridgeSection, "bridges", i);
        html.breakLine(bridgeSection);
        html.hrLine(bridgeSection);
    }
    html.addAnother(bridgeSection, "bridges");
    html.breakLine(bridgeSection);


   html.addLabel(featureSection, 'pae','pae enabled?');
   html.addBool(featureSection,'pae',this.pae);
   html.breakLine(featureSection);
   html.addLabel(featureSection, 'acpi','acpi enabled?');
   html.addBool(featureSection,'acpi',this.acpi);
   html.breakLine(featureSection);
   html.addLabel(featureSection, 'apic','apic enabled?');
   html.addBool(featureSection,'apic',this.apic);
   html.breakLine(featureSection);
   html.addLabel(featureSection, 'hap','hap enabled?');
   html.addBool(featureSection,'hap',this.hap);
   html.breakLine(featureSection);
   html.addLabel(featureSection, 'privnet','privnet enabled?');
   html.addBool(featureSection,'privnet',this.privnet);
   html.breakLine(featureSection);
   html.addLabel(featureSection, 'hyperv','hyperv enabled?');
   html.addBool(featureSection,'hyperv',this.hyperv);
   html.breakLine(featureSection);

}

/*
  are the given coordinates on this node?
*/

 this.hover = hover;
  function hover(x,y){
   dx = x - this.x;
   dy = y - this.y;
 
    return (dx>=0 && dx<=this.width*(this.scale/100) && dy>=0 && dy<=this.height*(this.scale/100));
 }

/*
  convert this to JSON sting
*/
 this.toJSONstring=toJSONstring;
 function toJSONstring(){
      /* TODO! networks should be converted!
      this is the last chance to change anything */
      var networks=app.getArrows(this);
      this.networks=[];
      for (i=0;i<networks.length;i++){
        if (networks[i].to==this){
          this.networks.push({'name':networks[i].from.name, 'dev':networks[i].name});
        } else {
          this.networks.push({'name':networks[i].to.name, 'dev':networks[i].name});
        }
      }
    // some properites are supposed to be not exported as they should stay constant
    var ignore=["width", 'height', 'draggable','editable', 'sections', 'defaults' ];
    tmp="{  ";//\"type\" : \"Node\", \"id\" : "+app.getIndexOf(this)+", ";
    for(var prop in this) {
      if(this.hasOwnProperty(prop)){         
          if (typeof this[prop] != "function" && ignore.indexOf(prop) < 0){
              if(typeof this[prop]=="number" || typeof this[prop]=="boolean"){
                tmp+="\n   \""+prop+"\" : "+this[prop]+", ";
              } else if (typeof this[prop]=="object"){

                tmp+="\n   \""+prop+"\" : ["+toJSON(this[prop]).slice(0, -2)+"], ";
              }else {
                tmp+="\n   \""+prop+"\" : \""+this[prop]+"\", ";
              }
          } 
      }   
   }
   tmp = tmp.slice(0, -2);
   return tmp+"\n}";
 }

function toJSON(obj){
  var tmp="";
  for(var prop in obj) {
      if(obj.hasOwnProperty(prop)){ 
          if (typeof obj[prop]=="object"){
                tmp+="\n {"+toJSON(obj[prop]).slice(0, -2)+"}, ";
          } else if (typeof obj[prop] != "function"){
              if(typeof obj[prop]=="number" || typeof obj[prop]=="boolean"){
                tmp+="\n   \""+prop+"\" : "+obj[prop]+", ";
              }  else {
                tmp+="\n   \""+prop+"\" : \""+obj[prop]+"\", ";
              }
          } 
      }   
   }
   tmp = tmp.slice(0, -2);
   return tmp+"\n, ";
}

/*
  import info from JSON obj
*/
 this.fromJSON=fromJSON;
 function fromJSON(json){
    for(var prop in json) {
      if(this.hasOwnProperty(prop)){         
          if (typeof this[prop] != "function"){
              this[prop]=json[prop];
          } 
      }   
   }
 }

   
}


/* 
SWITCH OBJECT

 s1 = new Switch(x, y, name);

 draw the switch, needs the context
 s1.draw(ctx)

 show a form to edit parameters in the specified element
 s1.show_form(el) 

 to check if a point is over the node
 s1.hover(x,y)

 to make a clone of the switch (returns new)
 copy = s1.copy();

 to export the object in JSON
 json = s1.toJSONstring()

 to set instance values based on JSON
 new.fromJSON(jsonSource);

*/

function Switch(x, y, name){
 
 // properties needed for drawing
 this.x =  typeof(x)!='undefined'? x:1;
 this.y =  typeof(y)!='undefined'? y:1;

 this.name = typeof(name)!='undefined'? name:"newSwitch"; 
 this.bridgeName = "internal0";
 this.ip = "10.x.0.0";
 this.netmask = "255.255.255.0";
 this.dhcp = false;
 this.dhcpFrom = "10.x.0.100";
 this.dhcpTo = "10.x.0.200";

 this.height = 45;
 this.width = 80;
 this.scale = 100;
 this.color = "black";
 this.border = 0; // can add borders if need be
 
 this.draggable = true; 
 this.editable = true;


this.sections={ "styleSection":true, "switchSection":true, 
                "dhcpSection":true};

 this.draw=draw;
 function draw(ctx){
    var x=this.x;
    var y=this.y;
    var width=this.width*(this.scale/100);
    var height=this.height*(this.scale/100);

   var prev = [ctx.strokeStyle, ctx.lineWidth, ctx.fillStyle]; // save previous
   
   ctx.strokeStyle = this.color; // use this object color
   ctx.lineWidth = this.border;   
   ctx.fillStyle = this.color;
   
   if (this.border>0){
      // draw the object with outlines
      ctx.strokeRect(this.x, this.y, width, height);
   } 
   // add the name
   if (typeof(this.name)!="undefined"){
      ctx.font="12px Arial"
      ctx.textAlign = "center"; 
      ctx.textBaseline = "top"; 
      ctx.fillText(this.name, x+width/2, y+height+this.border/2);
   }
    
    var ex = images.switches[0];
    ctx.drawImage(ex, x, y, width, height);

   ctx.strokeStyle = prev[0]; // restore previous
   ctx.lineWidth = prev[1];
   ctx.fillStyle = prev[2];
 } 
 this.copy=copy;
 function copy(){
   var newobj = new Switch(this.x, this.y, this.name+" (copy)");

   for(var prop in newobj) {
      if(newobj.hasOwnProperty(prop)){         
          if (typeof newobj[prop] != "function" && prop!="name"){
              newobj[prop]=this[prop];
          } 
      }   
   }
   // TODO: add properties assignment when properties are set

   return newobj;

 }
/*
  show the form inside the given element
*/

 this.show_form=show_form;
function show_form(el, index){
    el.innerHTML="";
   // to track the id
   html.addInput(el,'hidden','id',index);
   html.addInput(el,'hidden','type',"switches");

   var styleSection = html.addSection(el,'styleSection', 'Style properties');
   var switchSection = html.addSection(el,'switchSection', 'Switch properties');
   var dhcpSection = html.addSection(el,'dhcpSection', 'DHCP properties');
  
   html.addLabel(styleSection, 'scale','Scale');
   html.addInput(styleSection,'range','scale',this.scale,100,25,1);
   html.breakLine(styleSection);
   html.addLabel(styleSection,'color','Color');
   html.addInput(styleSection,'color','color',this.color);
   html.breakLine(styleSection);
   html.addLabel(styleSection,'border','Border width');
   html.addInput(styleSection,'number','border',this.border, 10,0);
 

   html.addLabel(switchSection, 'name','Name');
   html.addInput(switchSection,'text','name',this.name);
   html.breakLine(switchSection);
   var names = app.getNames(["routers", "switches", "nodes"]);
   count=0;
   for (i=0; i<names.length; i++){
    if (names[i]==this.name) count++;
   }
   if (count>1){
    html.errorNotice(switchSection, "Name in use, choose another one");
    html.breakLine(switchSection);
   }
   // there should not be whitespace in the names
   if (this.name.indexOf(' ') >= 0){
    html.errorNotice(switchSection, "Names should not contain whitespaces");
    html.breakLine(switchSection);
   }
   html.addLabel(switchSection, 'bridgeName','Bridge name');
   html.addInput(switchSection,'text','bridgeName',this.bridgeName);
   html.breakLine(switchSection);
   html.addLabel(switchSection, 'ip','IP address');
   html.addIP(switchSection,'ip',this.ip);
   html.breakLine(switchSection);
   html.addLabel(switchSection, 'netmask','Netmask');
   html.addIP(switchSection,'netmask',this.netmask);
   html.breakLine(switchSection);
   html.addLabel(dhcpSection, 'dhcp','DHCP enabled?');
   html.addBool(dhcpSection,'dhcp',this.dhcp);
   html.breakLine(dhcpSection);
   if (this.dhcp){
    html.addLabel(dhcpSection, 'dhcpFrom','From');
    html.addIP(dhcpSection,'dhcpFrom',this.dhcpFrom);
    html.breakLine(dhcpSection);
    html.addLabel(dhcpSection, 'dhcpTo','To');
    html.addIP(dhcpSection,'dhcpTo',this.dhcpTo);
    html.breakLine(dhcpSection);
   }
}

/*
  are the given coordinates on this node?
*/

 this.hover = hover;
  function hover(x,y){
   dx = x - this.x;
   dy = y - this.y;
 
    return (dx>=0 && dx<=this.width*(this.scale/100) && dy>=0 && dy<=this.height*(this.scale/100));
 }

/*
  convert this to JSON sting
*/
 this.toJSONstring=toJSONstring;
 function toJSONstring(){
    // some properites are supposed to be not exported as they should stay constant
    var ignore=["width", 'height', 'draggable','editable', 'sections'];
    if (!this.dhcp) {
      // if no dhcp is set to flase, then dont export the ip ranges
      ignore.push("dhcpFrom");
      ignore.push("dhcpTo");
    }
    tmp="{";//\"type\" : \"Node\", \"id\" : "+app.getIndexOf(this)+", ";
    for(var prop in this) {
      if(this.hasOwnProperty(prop)){         
          if (typeof this[prop] != "function" && ignore.indexOf(prop) < 0){
              if(typeof this[prop]=="number" || typeof this[prop]=="boolean"){
                tmp+="\n   \""+prop+"\" : "+this[prop]+", ";
              } else {
                tmp+="\n   \""+prop+"\" : \""+this[prop]+"\", ";
              }
          } 
      }   
   }
   tmp = tmp.slice(0, -2);
   return tmp+"\n}";
 }
/*
  import info from JSON obj
*/
 this.fromJSON=fromJSON;
 function fromJSON(json){
    for(var prop in json) {
      if(this.hasOwnProperty(prop)){         
          if (typeof this[prop] != "function"){
              this[prop]=json[prop];
          } 
      }   
   }
 }

   
}

/* 
ROUTER OBJECT

 r1 = new Router(x, y, name);

 draw the switch, needs the context
 r1.draw(ctx)

 show a form to edit parameters in the specified element
 r1.show_form(el) 

 to check if a point is over the node
 r1.hover(x,y)

 to make a clone of the switch (returns new)
 copy = r1.copy();

 to export the object in JSON
 json = r1.toJSONstring()

 to set instance values based on JSON
 new.fromJSON(jsonSource);

*/

function Router(x, y, name){
 
 // properties needed for drawing
 this.x =  typeof(x)!='undefined'? x:1;
 this.y =  typeof(y)!='undefined'? y:1;
 
 this.name = typeof(name)!='undefined'? name:"newRouter"; 
 this.bridgeName = "nat0";
 this.ip = "10.0.x.0";
 this.netmask = "255.255.255.0";
 this.dhcp = true;
 this.dhcpFrom = "10.0.x.100";
 this.dhcpTo = "10.0.x.200";

 this.height = 49;
 this.width = 80;
 this.scale = 100;
 this.color = "black";
 this.border = 0; // can add borders if need be
 
 this.draggable = true; 
 this.editable = true;
 this.sections={ "styleSection":true, "routerSection":true, 
                "dhcpSection":true};

 this.draw=draw;
 function draw(ctx){
    var x=this.x;
    var y=this.y;
    var width=this.width*(this.scale/100);
    var height=this.height*(this.scale/100);

   var prev = [ctx.strokeStyle, ctx.lineWidth, ctx.fillStyle]; // save previous
   
   ctx.strokeStyle = this.color; // use this object color
   ctx.lineWidth = this.border;   
   ctx.fillStyle = this.color;
   
   if (this.border>0){
      // draw the object with outlines
      ctx.strokeRect(this.x, this.y, width, height);
   } 
   // add the name
   if (typeof(this.name)!="undefined"){
      ctx.font="12px Arial"
      ctx.textAlign = "center"; 
      ctx.textBaseline = "top"; 
      ctx.fillText(this.name, x+width/2, y+height+this.border/2);
   }
    
    var ex = images.routers[0];
    ctx.drawImage(ex, x, y, width, height);

   ctx.strokeStyle = prev[0]; // restore previous
   ctx.lineWidth = prev[1];
   ctx.fillStyle = prev[2];
 } 

 this.copy=copy;
 function copy(){
   var newobj = new Router(this.x, this.y, this.name+" (copy)");

   for(var prop in newobj) {
      if(newobj.hasOwnProperty(prop)){         
          if (typeof newobj[prop] != "function" && prop!="name"){
              newobj[prop]=this[prop];
          } 
      }   
   }
   // TODO: add properties assignment when properties are set

   return newobj;

 }
/*
  show the form inside the given element
*/

 this.show_form=show_form;
function show_form(el, index){
    el.innerHTML="";
   // to track the id
   html.addInput(el,'hidden','id',index);
   html.addInput(el,'hidden','type',"routers");

   var styleSection = html.addSection(el,'styleSection', 'Style properties');
   var routerSection = html.addSection(el,'routerSection', 'Router properties');
   var dhcpSection = html.addSection(el,'dhcpSection', 'DHCP properties');
  
   html.addLabel(styleSection, 'scale','Scale');
   html.addInput(styleSection,'range','scale',this.scale,100,25,1);
   html.breakLine(styleSection);
   html.addLabel(styleSection,'color','Color');
   html.addInput(styleSection,'color','color',this.color);
   html.breakLine(styleSection);
   html.addLabel(styleSection,'border','Border width');
   html.addInput(styleSection,'number','border',this.border, 10,0);

   html.addLabel(routerSection, 'name','Name');
   html.addInput(routerSection,'text','name',this.name);
   html.breakLine(routerSection);
   var names = app.getNames(["routers", "switches", "nodes"]);
   count=0;
   for (i=0; i<names.length; i++){
    if (names[i]==this.name) count++;
   }
   if (count>1){
    html.errorNotice(routerSection, "Name in use, choose another one");
    html.breakLine(routerSection);
   }
   // there should not be whitespace in the names
   if (this.name.indexOf(' ') >= 0){
    html.errorNotice(routerSection, "Names should not contain whitespaces");
    html.breakLine(routerSection);
   }
   html.addLabel(routerSection, 'bridgeName','Bridge name');
   html.addInput(routerSection,'text','bridgeName',this.bridgeName);
   html.breakLine(routerSection);
   html.addLabel(routerSection, 'ip','IP address');
   html.addIP(routerSection,'ip',this.ip);
   html.breakLine(routerSection);
   html.addLabel(routerSection, 'netmask','Netmask');
   html.addIP(routerSection,'netmask',this.netmask);
   html.breakLine(routerSection);
    html.addLabel(dhcpSection, 'dhcp','DHCP enabled?');
   html.addBool(dhcpSection,'dhcp',this.dhcp);
   html.breakLine(dhcpSection);
   if (this.dhcp){
    html.addLabel(dhcpSection, 'dhcpFrom','From');
    html.addIP(dhcpSection,'dhcpFrom',this.dhcpFrom);
    html.breakLine(dhcpSection);
    html.addLabel(dhcpSection, 'dhcpTo','To');
    html.addIP(dhcpSection,'dhcpTo',this.dhcpTo);
    html.breakLine(dhcpSection);
   }
}

/*
  are the given coordinates on this node?
*/

 this.hover = hover;
  function hover(x,y){
   dx = x - this.x;
   dy = y - this.y;
   
    return (dx>=0 && dx<=this.width*(this.scale/100) && dy>=0 && dy<=this.height*(this.scale/100));
 }

/*
  convert this to JSON sting
*/
 this.toJSONstring=toJSONstring;
 function toJSONstring(){
    // some properites are supposed to be not exported as they should stay constant
    var ignore=["width", 'height', 'draggable','editable', 'sections'];
    if (!this.dhcp) {
      // if no dhcp is set to flase, then dont export the ip ranges
      ignore.push("dhcpFrom");
      ignore.push("dhcpTo");
    }
    tmp="{";//\"type\" : \"Node\", \"id\" : "+app.getIndexOf(this)+", ";
    for(var prop in this) {
      if(this.hasOwnProperty(prop)){         
          if (typeof this[prop] != "function" && ignore.indexOf(prop) < 0){
              if(typeof this[prop]=="number" || typeof this[prop]=="boolean"){
                tmp+="\n   \""+prop+"\" : "+this[prop]+", ";
              } else {
                tmp+="\n   \""+prop+"\" : \""+this[prop]+"\", ";
              }
          } 
      }   
   }
   tmp = tmp.slice(0, -2);
   return tmp+"\n}";
 }
/*
  import info from JSON obj
*/
 this.fromJSON=fromJSON;
 function fromJSON(json){
    for(var prop in json) {
      if(this.hasOwnProperty(prop)){         
          if (typeof this[prop] != "function"){
              this[prop]=json[prop];
          } 
      }   
   }
 }

   
}

/*
The menu object

consists of menuitems: new, new node, new router, new switch, connect, duplicate, delete

has a draw function, for drawing the menu icons

*/

function Menu(){
 
 this.items={ 'newPage':{
    'text':'Clear page', 
    'type':"click",
    'active':false,
    'x':0, 
    'y':0, 
    'img':images.menu[0],
    'width':35,
    'height':35,
    'click': function() {
       app.removeAll();
    },
    'draw':function(ctx){
      draw(this, ctx);
    },
    'hover': function(x,y){
      dx = x - this.x;
      dy = y - this.y;
      
       return (dx>=0 && dx<=this.width && dy>=0 && dy<=this.height);
    }

  },'open':{
    'text':'Open saved schema', 
    'type':"click",
    'active':false,
    'x':35, 
    'y':0, 
    'img':images.menu[1],
    'width':35,
    'height':35,
    'click': function() {
       app.load();
    },
    'draw':function(ctx){
      draw(this, ctx);
    },
    'hover': function(x,y){
      dx = x - this.x;
      dy = y - this.y;
       return (dx>=0 && dx<=this.width && dy>=0 && dy<=this.height);
    }

  },
  'save':{
    'text':'Save to database', 
    'type':"click",
    'active':false,
    'x':70, 
    'y':0, 
    'img':images.menu[2],
    'width':35,
    'height':35,
    'click': function() {
      var holder = document.getElementById(app.targetElement);
      holder.innerHTML="";
      var saveSection = html.addSection(holder,'saveSection', 'Save Schema', false);
  
      var p = document.createElement("p");
      p.innerHTML=""
      saveSection.appendChild(p);
  
      var name = document.createElement("input");
      name.setAttribute("type","text");
      name.setAttribute("id", "schemaName");
      name.setAttribute("placeholder", "Schema name here");

      saveSection.appendChild(name);

      html.breakLine(saveSection);

      var submit = document.createElement("button");
      submit.onclick=function(){app.save(true);};
      submit.innerHTML="Save";
      saveSection.appendChild(submit);

      // add a change button that is hidden by default
      var change = document.createElement("button");
      change.onclick=function(){app.save(false);};
      change.innerHTML="Update";
      change.style.display="none";
      saveSection.appendChild(change);

      if (app.schemaName!="") {
        change.style.display="inline-block";
        name.setAttribute("value", app.schemaName);
        submit.innerHTML="Save as";
      }

      var info = document.createElement("p");
      info.setAttribute("id","saveInfo");

      saveSection.appendChild(info);
    },
    'draw':function(ctx){
      draw(this, ctx);
    },
    'hover': function(x,y){
      dx = x - this.x;
      dy = y - this.y;
      
       return (dx>=0 && dx<=this.width && dy>=0 && dy<=this.height);
    }

  },
  'hand':{
    'text':'Move elements', 
    'type':"click",
    'active':false,
    'x':105, 
    'y':0, 
    'img':images.menu[3],
    'width':35,
    'height':35,
    'click': function() {
       
    },
    'draw':function(ctx){
      draw(this, ctx);
    },
    'hover': function(x,y){
      dx = x - this.x;
      dy = y - this.y;
      
       return (dx>=0 && dx<=this.width && dy>=0 && dy<=this.height);
    }
  },
  'newNode':{
    'text':'Drag your mouse where you want to add a new Node', 
    'type':"drag",
    'active':false,
    'x':140, 
    'y':7, 
    'img':images.nodes[0],
    'width':35,
    'height':27,
    'click': function(x,y) {
       this.drop(x,y);
    },
    'drop':function(x,y){
       tmp = new Node(Math.floor(x), Math.floor(y));
       app.add(tmp);
    },
    'draw':function(ctx){
      draw(this, ctx);
    },
    'hover': function(x,y){
      dx = x - this.x;
      dy = y - this.y;
      
       return (dx>=0 && dx<=this.width && dy>=0 && dy<=this.height);
    }

  },
  'newRouter':{
    'text':'Drag your mouse where you want to add a new Router', 
    'type':"drag",
    'active':false,
    'x':175, 
    'y':14, 
    'img':images.routers[0],
    'width':35,
    'height':21,
    'click': function(x,y) {
       this.drop(x,y);
    },
    'drop':function(x,y){
       tmp = new Router(Math.floor(x), Math.floor(y));
       app.add(tmp);
    },
    'draw':function(ctx){
      draw(this, ctx);
    },
    'hover': function(x,y){
      dx = x - this.x;
      dy = y - this.y;
    
       return (dx>=0 && dx<=this.width && dy>=0 && dy<=this.height);
    }

  }, 
  'newSwitch':{
    'text':'Drag your mouse where you want to add a new Switch', 
    'type':"drag",
    'active':false,
    'x':210, 
    'y':15, 
    'img':images.switches[0],
    'width':35,
    'height':20,
    'click': function(x,y) {
       this.drop(x,y);
    },
    'drop':function(x,y){
       tmp = new Switch(Math.floor(x), Math.floor(y));
       app.add(tmp);
    },
    'draw':function(ctx){
      draw(this, ctx);
    },
    'hover': function(x,y){
      dx = x - this.x;
      dy = y - this.y;
      
       return (dx>=0 && dx<=this.width && dy>=0 && dy<=this.height);
    }
  }, 
  'connect':{
    'text':'Select two items to connect. NB! Can not connect elements of same type', 
    'type':"select2",
    'active':false,
    'x':245, 
    'y':0, 
    'img':images.menu[4],
    'width':35,
    'height':35,
    'click': function() {
       // toggle the activness of the button
       this.active=!this.active;
       
    },
    'drop':function(from, to){
       tmp = new Arrow(0, 0, 0,0);
       tmp.from = from;
       tmp.to = to;
       app.add(tmp);
    },
    'draw':function(ctx){
      draw(this, ctx);
    },
    'hover': function(x,y){
      dx = x - this.x;
      dy = y - this.y;
     
       return (dx>=0 && dx<=this.width && dy>=0 && dy<=this.height);
    }
  }, 
  'duplicate':{
    'text':'Drag items to duplicate', 
    'type':"drag1",
    'active':false,
    'x':280, 
    'y':0, 
    'img':images.menu[5],
    'width':35,
    'height':35,
    'click': function() {
       // toggle the activness of the button
       this.active = !this.active;
       
    },
    'drop':function(obj, x, y){
        nobj = obj.copy();
        nobj.x = Math.floor(x);
        nobj.y = Math.floor(y);
        app.add(nobj);
    },
    'draw':function(ctx){
      draw(this, ctx);
    },
    'hover': function(x,y){
      dx = x - this.x;
      dy = y - this.y;
     
       return (dx>=0 && dx<=this.width && dy>=0 && dy<=this.height);
    }

  },
  'delete':{
    'text':'Select items to delete', 
    'type':"select1",
    'active':false,
    'x':315, 
    'y':0, 
    'img':images.menu[6],
    'width':35,
    'height':35,
    'click': function() {
       // toggle the activness of the button
       this.active = !this.active;
       
    },
    'drop':function(obj){
       app.remove(obj);
    },
    'draw':function(ctx){
      draw(this, ctx);
    },
    'hover': function(x,y){
      dx = x - this.x;
      dy = y - this.y;
       return (dx>=0 && dx<=this.width && dy>=0 && dy<=this.height);
    }

  }, 'json':{
    'text':'Export JSON', 
    'type':"click",
    'active':false,
    'x':350, 
    'y':0, 
    'img':images.menu[7],
    'width':35,
    'height':35,
    'click': function() {
       app.exportJSON();
    },
    'draw':function(ctx){
      draw(this, ctx);
    },
    'hover': function(x,y){
      dx = x - this.x;
      dy = y - this.y;
     
       return (dx>=0 && dx<=this.width && dy>=0 && dy<=this.height);
    }

  }
 }
 

 function draw(item, ctx){
   // TODO: menu highlighting broken!
      var x = item.x;
      var y = item.y;
      var height = item.height;
      var width = item.width;

      var prev = ctx.fillStyle; // save previous
      ctx.fillStyle = 'grey'; // use this object color
      if (item.active){
        // draw background
        ctx.fillRect(item.x, item.y, item.width, item.height);
      }

      var ex = item.img;
      ctx.drawImage(ex, x, y, width, height);
    ctx.fillStyle = prev; // restore previous
 }

}
/*

   HTML adding helper

   to add a breakline in the parent
   html.breakLine(parent)

   to create a collapsable section div element inside the parent 
   html.addSection(parent, id, title)

   to add different kinds of input elements to the parent element
   html.addInput(parent, type, id, value, [max], [min], [step])

   to add a label for a element inside the parent element
   html.addLabel(parent, id, text)

   to add a select box based on a [opt1, opt2, opt3, ..] options array into the parent element
   html.addSelect(parent, id, value, options)

   to add a select box, that chooses between node objects (ie for arrow to and from parameters) 
   where options is a array of [id, name] arrays 
   html.addNodeSelect(parent, id, value, options)

*/


function HTML() {

this.breakLine=breakLine;
function breakLine(el){
  el.appendChild(document.createElement('br'));
}
this.hrLine=hrLine;
function hrLine(el){
  el.appendChild(document.createElement('hr'));
}
this.errorNotice=errorNotice;
function errorNotice(el, notice){
  var error=document.createElement("span");
  error.innerHTML=notice;
  error.style.color="red";
  el.appendChild(error);
}

this.addSection=addSection;
function addSection(el, id, titleText, dynamic){
  dynamic = typeof(dynamic) != 'undefined'? dynamic:true;
   // make a link to expand/collapse
  var tog=document.createElement('div');
  tog.setAttribute('class','right');

  if(dynamic){
    key=document.getElementById('id').value;
    typ=document.getElementById('type').value;
    temp=app.getShape(typ, parseInt(key));
   
    if (temp.sections[id]){
      tog.innerHTML = "Collapse";
    } else {
      tog.innerHTML = "Expand";
    }
  } else {
    tog.innerHTML = "Collapse";
  }
  tog.style.padding = "3px";
  tog.style.cursor = "pointer";
  tog.onclick=function(){
    // actions to perform based on element text
    if (tog.innerHTML=="Collapse"){
      tog.nextElementSibling.nextElementSibling.style.display='none';
      tog.innerHTML="Expand";
      if(dynamic) temp.sections[id]=false;
    } else {
      tog.nextElementSibling.nextElementSibling.style.display='block';
      tog.innerHTML="Collapse";
      if(dynamic) temp.sections[id]=true;
    }
  };
    // make the header title area
  var title=document.createElement('div');
  title.setAttribute('class','appSectionTitle');
  title.innerHTML = titleText;

  // make a div for the elements
  var element=document.createElement('div');
  if (dynamic && !temp.sections[id]){
    element.style.display="none";
  } 
  element.setAttribute("id", id);
  element.setAttribute("class", "appSection");
  element.style.clear = "right";

  // append elements 
  el.appendChild(tog);
  el.appendChild(title);
  el.appendChild(element);

  // return the div so that elements can be added into it
  return element;

}

this.addInput=addInput;
 function addInput(el, type, id, value, max, min, step) {
    min = typeof(min) != 'undefined'? min:1;
    max = typeof(max) != 'undefined'? max:200;
    step = typeof(step) != 'undefined'? step:1;
    //Create an input type dynamically.
    var element = document.createElement("input");
    //Assign different attributes to the element.
    element.setAttribute("type", type);
    element.setAttribute("value", value);
    element.setAttribute("id", id);
    if (type=="number" || type=="range") {
         element.setAttribute("min", min);
         element.setAttribute("max", max);         
         element.setAttribute("step", step);
      }
    // change value when input value changes
    element.onchange = function() { // alert(element.value);
      key=document.getElementById('id').value;
      typ=document.getElementById('type').value;
      temp=app.getShape(typ, parseInt(key));
     
      if (type=="number" || type=="range") {
        temp[id]=parseFloat(element.value);
      } else {
        temp[id]=element.value;
        temp.show_form(el.parentElement, key); 
      }
      // redraw the canvas to show changes
      
      app.redraw();
     };

    //Append the element in page (in span).
    el.appendChild(element);
 
}

this.addSelect=addSelect;
 function addSelect(el, id, value, options) {
    var element = document.createElement("select");
    //Assign different attributes to the element.
    element.setAttribute("value", value);
    element.setAttribute("id", id);
    
    var i=0;
    for (i=0;i<options.length;i++){
      var opt = document.createElement("option");
      opt.setAttribute("value", i);
      if (i==value)
        opt.setAttribute('selected', 'selected');
      opt.innerHTML=options[i];

      element.appendChild(opt);
    }

    element.onchange = function(){ //alert(element.options[element.selectedIndex].value);
     key=document.getElementById('id').value;
      typ=document.getElementById('type').value;
      temp=app.getShape(typ, parseInt(key));
     
     temp[id]=parseFloat(element.options[element.selectedIndex].value);
      // redraw the canvas to show changes
      temp.show_form(el.parentElement, key); 
      app.redraw();
    };

    el.appendChild(element);
}

this.changeValue=changeValue;
function changeValue(el, object, key, value, type){
  type = typeof(type) != 'undefined'? type:"text";
  var element=document.createElement('input');
  element.setAttribute("type", type);
  element.setAttribute("value", value);
  element.onchange = function() { // alert(element.value);
    index=document.getElementById('id').value;
    typ=document.getElementById('type').value;
    temp=app.getShape(typ, parseInt(index));

    if (type=="number" || type=="range") {
       object[key]=parseFloat(element.value);
    } else {
      object[key]=element.value;  
    }
     temp.show_form(el.parentElement.parentElement, index); 
      // redraw the canvas to show changes
      app.redraw();
  };
 
  el.appendChild(element);

}

this.addNodeSelect=addNodeSelect;
 function addNodeSelect(el, id, value, options) {
    var element = document.createElement("select");
    //Assign different attributes to the element.
    var index=app.getIndexOf(value);
    element.setAttribute("value", index[1]);
    element.setAttribute("id", id);
    
    
    $.each(options, function(key,val){
      var group = document.createElement("optgroup");
      group.setAttribute("label", "--"+key+"--");
      var i = 0;
      for (i = 0; i < val.length; i++){
         var opt = document.createElement("option");
         var id = val[i][0];
         opt.setAttribute("title", key);
         opt.setAttribute("value", id);
         if ( app.getShape(key, parseInt(id)) == value )
           opt.setAttribute('selected', 'selected');
         opt.innerHTML=val[i][1];
         group.appendChild(opt);
       }
       element.appendChild(group);
    });
    

    element.onchange = function(){ //alert(element.options[element.selectedIndex].value);
      key=document.getElementById('id').value;
      typ=document.getElementById('type').value;
      temp=app.getShape(typ, parseInt(key));
      var selected=element.options[element.selectedIndex];
      temp[id]=app.getShape(selected.title, parseInt(selected.value));
      // redraw the canvas to show changes
      temp.show_form(el.parentElement, key); 
      app.redraw();
     
    };

    el.appendChild(element);
}

this.addLabel=addLabel;
function addLabel(el,id,text){
  var element = document.createElement('label');
  element.setAttribute('for',id)
  element.innerHTML=text+" ";
  //append the element
  el.appendChild(element);
}

this.addBool=addBool;
function addBool(el, id, value){
  var element = document.createElement("input");
  element.setAttribute("type", "checkbox");
  if (value) element.setAttribute("checked","checked");
  element.onchange = function() { // alert(element.value);
      key=document.getElementById('id').value;
      typ=document.getElementById('type').value;
      temp=app.getShape(typ, parseInt(key));
      temp[id]=element.checked;

      temp.show_form(el.parentElement, key);     
     };
  el.appendChild(element);
}

this.addIP=addIP;
function addIP(el, id, value){
  var ip=value.split(".");
 
  var i = 0;
  for (i = 0; i < 4; i++){
    var element = document.createElement("input");
    
    //Assign different attributes to the element.
    element.setAttribute("value", ip[i]);
    element.setAttribute("type", "text");
    element.setAttribute("size",3);
    element.setAttribute("maxlength",3);
    element.setAttribute("id", id+'-'+i);

    //element.onkeyup = changed();
    element.onchange = function() {
      key=document.getElementById('id').value;
      typ=document.getElementById('type').value;
      temp=app.getShape(typ, parseInt(key));

      var newvalue ="";
      var j = 0;
      var nr = 0;
      for (j = 0; j < 4; j++ ){
       
        var tmp = document.getElementById(id+'-'+j);
        if (tmp == this) nr = j;
        tmp.value=parseInt(tmp.value);
        if (tmp.value>255) tmp.value=255;
        if (tmp.value.toString()=="NaN") tmp.value=0;
        newvalue += tmp.value+".";
      } 
     
      if (nr<3 && this.value.length>2) {
        
        var next = document.getElementById(id+"-"+(nr+1));
        next.value="";
        next.focus();
      } 
      temp[id] = newvalue.slice(0,-1); 
    };

    
    el.appendChild(element); 
    if (i<3){
      var dot=document.createElement("span");
      dot.setAttribute("class", "dot");
      dot.innerHTML=".";
      el.appendChild(dot);
    }
  }

   // el.appendChild(element);

}

this.addTextSelect=addTextSelect;
function addTextSelect(el, id, value, options, index) {
 index = typeof(index) != 'undefined'? index:"";

 var element = document.createElement("select");
    //Assign different attributes to the element.
    element.setAttribute("value", value);
    element.setAttribute("id", id+""+index);
   
    var i=0;
    for (i=0;i<options.length;i++){
      var val = options[i];
      var opt = document.createElement("option");
      opt.setAttribute("value", val);
      if (val==value)
        opt.setAttribute('selected', 'selected');
      opt.innerHTML=val;
      element.appendChild(opt);
    }

    element.onchange = function(){ //alert(element.options[element.selectedIndex].value);
     key=document.getElementById('id').value;
      typ=document.getElementById('type').value;
      var inf=id.split('-');
     
      temp=app.getShape(typ, parseInt(key));
      if (inf.length > 1){  
        temp[inf[0]][index][inf[1]]=element.options[element.selectedIndex].value;
        temp.show_form(el.parentElement.parentElement, key); 
      } else { 
        temp[id]=element.options[element.selectedIndex].value;
        temp.show_form(el.parentElement, key); 
      }// redraw the canvas to show changes
      app.redraw();

    };

    el.appendChild(element);
}
this.addSubInput=addSubInput;
 function addSubInput(el, type, id, value, index, max, min, step) {
    min = typeof(min) != 'undefined'? min:1;
    max = typeof(max) != 'undefined'? max:200;
    step = typeof(step) != 'undefined'? step:1;
    //Create an input type dynamically.
    var element = document.createElement("input");
    //Assign different attributes to the element.
    element.setAttribute("type", type);
    element.setAttribute("value", value);
    element.setAttribute("id", id+""+index);
    if (type=="number" || type=="range") {
         element.setAttribute("min", min);
         element.setAttribute("max", max);         
         element.setAttribute("step", step);
      }
    // change value when input value changes
    element.onchange = function() { // alert(element.value);
      key=document.getElementById('id').value;
      typ=document.getElementById('type').value;
      temp=app.getShape(typ, parseInt(key));
  
      var inf=id.split("-");
      if (type=="number") {
        temp[inf[0]][index][inf[1]]=parseFloat(element.value);
      } else {
        temp[inf[0]][index][inf[1]]=element.value;
      }
      temp.show_form(el.parentElement.parentElement, key); 
     };

    //Append the element in page (in span).
    el.appendChild(element);
 
}

this.addAnother = addAnother;
function addAnother(el, what){
  var button = document.createElement('button');
  button.innerHTML="Add "+what;
  button.onclick=function(){
    key=document.getElementById('id').value;
    typ=document.getElementById('type').value;
    temp=app.getShape(typ, parseInt(key));
    //make a independent clone of the default
    var def=temp.defaults[what];
    var inf={};
    for(var prop in def) {
      if(def.hasOwnProperty(prop)){         
        inf[prop]=def[prop]; 
      }   
   }
    temp[what].push(inf);
    temp.show_form(el.parentElement.parentElement, key); 
    
  }
  el.appendChild(button);
}

this.removeThis = removeThis;
function removeThis(el, what, index){
    var button = document.createElement('button');
  button.innerHTML="Remove";
  button.onclick=function(){
    var r=confirm("Warning, removing "+what+"!")
    if (r==true){
      key=document.getElementById('id').value;
      typ=document.getElementById('type').value;
      temp=app.getShape(typ, parseInt(key));
      temp[what].splice(index,1);
      temp.show_form(el.parentElement.parentElement, key); 
    } 
  }
  el.appendChild(button);
}

}
 html = new HTML();