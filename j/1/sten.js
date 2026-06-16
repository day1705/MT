// 23:21 14.11.2023 (c) BorisScript
// tiny canvas based javascript 3D engine
// 22:45 03.06.2026 solid model render

window.onload = function () {	
  // load cad model
  var t = new LoadCAD(text);
  var vts = t.GetVertices();
  var cad = t.GetFaces();
  var canvas = document.getElementById('cnv');
  // init render
  const render_option = 0;
  const background = 1;
  const wireframe = 0;
  var r = new Render(canvas, cad, render_option, background, wireframe);
  // First render
  r.render();

  // Events
  var mousedown = false;
  var mx = 0;
  var my = 0;
  var bLeft =  false;
  var bRight = false;

  canvas.addEventListener('mousedown', initMove);
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', stopMove);
  document.addEventListener('wheel', Wheel);
  document.addEventListener('contextmenu', preventContextMenu);


  function preventContextMenu(e){
    e.preventDefault();
  }
  
  // Initialize the movement
  function initMove(evt) {
    mousedown = true;
    r.SetClientXY(evt);
    bLeft =  evt.which == 1 || bLeft;
    bRight = evt.which == 3 || bRight;
  }

  function move(evt) {
    // rotate
    if (mousedown && !bLeft && bRight) {
      r.rotate(evt, vts);
    }
    // pan
    if (mousedown && bLeft && bRight) {
      r.pan(evt, vts);
    }
    // zoom
    if (mousedown && bLeft && !bRight) {
      r.zoom(evt, vts, false);
    }
  }

  function stopMove() {
    mousedown = bLeft = bRight = false;
  }

  function Wheel(evt) {
    r.zoom(evt, vts, true);
  }
  
};

 
class LoadCAD {
  constructor(s) {
    this.model = s;
    this.vts = [];
    this.fcs = [];
    this.eds = [];
    this.ParseCAD();
  }

  ParseCAD () {
    var ar1 = this.model.split('$');
    this.model = {};
    var v3,v4,f5,f6,c1;
    for(var i=0; i<ar1.length; i++) {
      if(ar1[i].slice(0,1) == 'v') {    // vertices
        v4 = ar1[i].split(' ');
        v3 = new Vertex(v4[1],v4[2],v4[3]);
        this.vts.push(v3);
      }
      if(ar1[i].slice(0,1) == 'f') {    // faces
        f5 = ar1[i].split(' ');
        c1 = new Color(f5[2],f5[3],f5[4]);
        var av = [];
        for(var j=5; j<f5.length; j++) {
          av.push(this.vts[f5[j]]); // todo
        }
        this.fcs.push(new Face(c1, av)); // c1: face color; av: vertex array per one face; f6: set single face
      }
      if(ar1[i].slice(0,1) == 'e') {    // edges
        f5 = ar1[i].split(' ');
        c1 = new Color(f5[2],f5[3],f5[4]);
        var ae = [];
        for(var j=5; j<f5.length; j++) {
          ae.push(this.vts[f5[j]]); // todo
        }
        this.eds.push(new Edge(c1, ae)); // c1: edge color; ae: vertex array per multiple edge
      }
    }
  }

  // SetTriad() {
  // for(var i=0; i<this.vts.length; i++) {
  // this.vts[i].triad = true;
  // }      
  // }

  GetFaces() {
    return this.fcs;
  }

  GetEdges() {
    return this.eds;
  }

  GetVertices() {
    return this.vts;
  }
} // end LoadCAD

class Edge {
  constructor(color, vertices) {
	this.color = color; // rgb
	this.vertices = vertices; // edge points
	this.is_front = true;
	this.z_order = new Vertex(0,0,0);
  }
}

class Face {
  constructor(color, vertices) {
	this.color = color; // rgb
	this.vertices = vertices; // face points
	this.is_front = true;
	this.z_order = new Vertex(0,0,0);
  }
}

class Color {
	constructor(r, g, b) {
		this.R = parseInt(r);
		this.G = parseInt(g);
		this.B = parseInt(b);
	}
	
	getRGB() {
		return "rgb(" + this.R.toString() + ", " + this.G.toString() + ", " + this.B.toString() + ")";
	}
}


class Render {  // begin render
  constructor(canvas, cads, r_option, map, wireframe) {
  this.cx = canvas.getContext('2d');
  this.cx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
  this.r_opt = r_option; // 1: isFront check; else no Front check
	this.use_map = map;
	this.is_wire = wireframe;
	this.w = canvas.offsetWidth  / 2;
	this.h = canvas.offsetHeight / 2;
	this.objects = cads;
  this.clientXY = new Vertex2D(0,0);
  }

  render () {
    // Clear the previous frame
    this.cx.clearRect(0, 0, this.w * 2, this.h * 2);
    // back-face culling!
    this.#BackFaceCull();
    if(this.use_map)
      this.#map(); // place a map at here
    // For each face in object
    for (var j = 0, n_faces = this.objects.length; j < n_faces; j++) {
      // Current face
      var face = this.objects[j];
      // check the face direction at here!
      if (face.is_front) {
        // Draw the first vertex
        var P = this.#project2D(face.vertices[0]);
        this.cx.fillStyle = face.color.getRGB();
        this.cx.beginPath();
        this.cx.moveTo(P.x + this.w, -P.y + this.h);
        // Draw the other vertices
        for (var k = 1, n_vertices = face.vertices.length; k < n_vertices; k++) {
          P = this.#project2D(face.vertices[k]);
          this.cx.lineTo(P.x + this.w, -P.y + this.h);
        }
      }
      // Close the path and draw the face
      this.cx.closePath();
      this.cx.stroke();
      if(!this.is_wire)
          this.cx.fill();
    }
  }
  
  SetClientXY(e) {
    this.clientXY.x = e.clientX;
    this.clientXY.y = e.clientY;
  }

  zoom(e, vs, bWheel) {
    var inc, delta;
    if (bWheel)
      delta = e.deltaY > 0 ? 1.1 : 0.9;
    else
      delta = e.movementY < 0 ? 1.1 : 0.9;
    for (var i = 0; i < vs.length; i++) {
      vs[i].x *= delta;
      vs[i].y *= delta;
      vs[i].z *= delta;
    }
    this.render();
  }
  
  
  rotate (e, vts){
      var theta = (this.clientXY.x - e.clientX) * Math.PI / 2;
      var phi   = (this.clientXY.y - e.clientY) * Math.PI / 1;

      for (var i = 0; i < vts.length; i++)
        this.#rotate2(vts[i], theta/100, phi/100);

      this.SetClientXY(e);
      this.render();
  }

  #rotate2(M, theta, phi) {
    // Rotation matrix coefficients
    var ct = Math.cos(theta);
    var st = Math.sin(theta);
    var cp = Math.cos(phi);
    var sp = Math.sin(phi);

    var x = M.x;
    var y = M.y;
    var z = M.z;

    M.x = ct * x - st * cp * y + st * sp * z;
    M.y = st * x + ct * cp * y - ct * sp * z;
    M.z = sp * y + cp * z;
  }

  pan(e, vs){
    for (var i = 0; i < vs.length; i++) {
      vs[i].x += e.movementX;
      vs[i].z -= e.movementY;
    }
    this.render();
  }

  #BackFaceCull() {
    var facelist = this.objects;
    for(var i=0; i<facelist.length; i++) {
      var face = facelist[i];
      facelist[i].z_order = this.#faceCenter(facelist[i]);
      if(this.r_opt == 1)
        facelist[i].is_front = this.#IsFrontFace(face);
    }
    facelist.sort(this.#CompareByY);
  }

  #CompareByY(a, b) {
    return a.z_order.y - b.z_order.y;
  }
  
  #IsFrontFace(v3p) {
    var p3 = v3p.vertices;
    var vA = vnorm(new Vertex(p3[1].x-p3[0].x, p3[1].y-p3[0].y, p3[1].z-p3[0].z));
    var vB = vnorm(new Vertex(p3[2].x-p3[1].x, p3[2].y-p3[1].y, p3[2].z-p3[1].z));
    var v3 = new Vertex((vA.y*vB.z)-(vB.y*vA.z), -(vA.x*vB.z)+(vB.x*vA.z), (vA.x*vB.y)-(vA.y*vB.x));
    return (v3.y < 0.0);
  }

  // face gravity center
  #faceCenter(face) {
    var v = new Vertex(0,0,0);
    for (var i = 0; i < face.vertices.length; i++) {
      v = vplus(v,face.vertices[i]);
    }
    v.x /= face.vertices.length;
    v.y /= face.vertices.length;
    v.z /= face.vertices.length;
    return v;
  }

  #project2D(M) {
    return new Vertex2D(M.x, M.z);
  }

  #map() {
    this.cx.fillStyle = "#000000";
    this.cx.fillRect(0,0,800,600);
  }
} // end render

// ''' 3D point
class Vertex {
	constructor(x, y, z) {
	  this.x = parseFloat(x);
	  this.y = parseFloat(y);
	  this.z = parseFloat(z);
	}
}

// ''' 2D point
class Vertex2D {
	constructor(x, y) {
	  this.x = parseFloat(x);
	  this.y = parseFloat(y);
	}
}


// ''' normalize
function vnorm(v) {
  var length = Math.sqrt((v.x * v.x) + (v.y * v.y) + (v.z * v.z));
  if (length != 0)
    return new Vertex(v.x/length, v.y/length, v.z/length);
  else {
	alert("division by zero!");
    return v;
  }
}

// ''' vector sum
function vplus(vA, vB) {
  return new Vertex(vA.x + vB.x, vA.y + vB.y, vA.z + vB.z);
}

// ''' cross product
function vcross(vA, vB) {
  return new Vertex((vA.y*vB.z)-(vB.y*vA.z), -(vA.x*vB.z)+(vB.x*vA.z), (vA.x*vB.y)-(vA.y*vB.x));
}
