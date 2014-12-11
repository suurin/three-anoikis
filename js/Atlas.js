var container, innerWidth, innerHeight;
var camera, controls, scene, renderer, mouse;
var objects = [];
var solselected, solintersected;

var selector_solname = "#info-system",
	selector_constname = "#info-contellation",
	selector_regname = "#info-region",
	selector_class = "#info-class",
	selector_anomaly = "#info-anomaly";

var whClassToColor = {
	1: 0x00e9ff,
	2: 0x00a9ff,
	3: 0x007bff,
	4: 0x0400ff,
	5: 0x7700ff,
	6: 0xff00d0,
	7: 0xff8300,
	8: 0xff0000,
	9: 0x00ff00,
	10: 0xffff00,
	11: 0xff0000,
	12: 0xff0000,
	13: 0xffff77,
	14: 0xffff00,
}

init();
render();

function init()
{
	container = $('.canvas-container');
	innerWidth = container.innerWidth();
	innerHeight = container.innerHeight();

	mouse = new THREE.Vector3();

	camera = new THREE.PerspectiveCamera( 60, innerWidth / innerHeight, 1, 1e10 );
	controls = new THREE.OrbitControls( camera );
	controls.target.set(278.26, 627.51, -956.43);
	camera.position.set(-165.73, 2370.05, 805.17);
	camera.rotation = new THREE.Euler(-0.77, -0.17, -0.17, 'XYZ');
	controls.damping = 0.2;

	scene = new THREE.Scene();

	if(localStorage.getItem("solarSystemsJSON")) {
		solPopulate(JSON.parse(localStorage.getItem("solarSystemsJSON")));

		console.log("-done!");
	}
	else
	{
		$.getJSON("res/mapWHSystems.json", function(data) {
			localStorage.setItem("solarSystemsJSON", JSON.stringify(data));
			solPopulate(data);

			console.log("+done!");
		});
	}
	
	renderer = new THREE.WebGLRenderer( { antialias: false } );
	renderer.setClearColor( 0x000000, 1 );
	renderer.setSize( innerWidth, innerHeight );

	$(renderer.domElement).appendTo('.canvas-container');

	renderer.domElement.addEventListener( 'mousemove', onDocumentMouseMove, true );
	renderer.domElement.addEventListener( 'mousedown', onDocumentMouseDown, true );
	window.addEventListener( 'resize', onWindowResize, false );
	
	$('#system-search').submit(function(ev) {
	    ev.preventDefault();
	    solFind($('#system-search-name').val());
	});

	animate();
}

function solPopulate(data)
{
	for (var i = data.length - 1; i >= 0; i--) {
		var geometry = new THREE.SphereGeometry( 1, 6, 6 );
		var material = new THREE.MeshBasicMaterial({color:whClassToColor[data[i].wormholeClassID]});
		var cube = new THREE.Mesh( geometry, material );

		cube.position.x = 7700 - (data[i].x * 1e-15);
		cube.position.y = (data[i].y * 1e-15);
		cube.position.z = 9400 + (data[i].z * 1e-15);

		cube.solarSystemID = data[i].solarSystemID;
		cube.solarSystemName = data[i].solarSystemName;
		cube.constellationName = data[i].constellationName;
		cube.regionName = data[i].regionName;
		cube.wormholeClassID = data[i].wormholeClassID;
		cube.anomalyName = data[i].anomalyName;

		var systemName = makeTextSprite(data[i].solarSystemName, 0xffffff);
		systemName.visible = false;
		systemName.position.x = -1;
		cube.add(systemName);

		objects.push(cube);
		scene.add(cube);

		console.log("Loaded system " + data[i].solarSystemID + " at " + cube.position.x + " " + cube.position.y + " " + cube.position.z );
	}
}

function solSelect(sol)
{
	camera.position.x = sol.position.x;
	camera.position.y = sol.position.y;
	camera.position.z = sol.position.z + 20;

	controls.target.copy(sol.position);
	for (var i = sol.children.length - 1; i >= 0; i--) {
			sol.children[i].visible = true;
	};

	solselected = sol;
	solTooltip(sol);
}

function solDeselect(sol)
{
	controls.reset();

	for (var i = sol.children.length - 1; i >= 0; i--) {
				sol.children[i].visible = false;
	};

	solselected = null;
	solTooltip(null);
}

function solMouseOver(sol)
{
	if(solselected == sol)
		return;
	if(sol == null)
		return;

	for (var i = sol.children.length - 1; i >= 0; i--) {
				sol.children[i].visible = true;
	};

	solTooltip(sol);
}

function solMouseOut(sol)
{
	if(solselected == sol)
		return;
	if(sol == null)
		return;

	for (var i = sol.children.length - 1; i >= 0; i--) {
				sol.children[i].visible = false;
	};

	solTooltip(solselected);
}

function solTooltip(sol)
{
	if(sol == null)
	{
		$(selector_solname).html("Mouse over a system or click it to view details. Click a system again to reset.");
		$(selector_constname).html('');
		$(selector_regname).html('');
		$(selector_class).html('');
		$(selector_anomaly).html('');

		return;
	}

	$(selector_solname).html("System <b>" + sol.solarSystemName + "</b>");
	$(selector_constname).html("Constellation <b>" + sol.constellationName + "</b>");
	$(selector_regname).html("Region <b>" + sol.regionName + "</b>");
	$(selector_class).html("Class <b>" + sol.wormholeClassID + "</b>");
	
	if(sol.anomalyName != null)
		$(selector_anomaly).html("Anomaly <b>" + sol.anomalyName + "</b>");
	else
		$(selector_anomaly).html('');
}

function solFind(name)
{
	for (var i = scene.children.length - 1; i >= 0; i--) {
		if(scene.children[i].solarSystemName == name)
		{
			if(solselected != null)
				solDeselect(solselected);
			solSelect(scene.children[i]);
			return;
		}
	};

	alert("Nothing found!");
}

function onWindowResize() {
	camera.aspect = innerWidth / innerHeight;
	camera.updateProjectionMatrix();

	innerWidth = container.innerWidth();
	innerHeight = container.innerHeight();

	renderer.setSize( innerWidth, innerHeight );
	render();
}

function onDocumentMouseMove( event ) {
	mouse.set((event.clientX / innerWidth) * 2 - 1, -(event.clientY / innerHeight) * 2 + 1, 0.5);

	var rayvector = mouse.unproject(camera);
	var raycaster = new THREE.Raycaster(camera.position, rayvector.sub(camera.position).normalize());
	var intersects = raycaster.intersectObjects(objects);

	if ( intersects.length > 0 ) {
		solintersected = intersects[0].object;
		solMouseOver(solintersected);

		document.body.style.cursor = 'pointer';
	} else {
		solMouseOut(solintersected);
		solintersected = null;

		document.body.style.cursor = 'auto';
	}
}

function onDocumentMouseDown( event ) {
	if (solintersected) {
		
		if(solintersected == solselected)
		{
			solDeselect(solselected);
			controls.reset();

			return;
		}

		if(solselected != null)
			solDeselect(solselected);

		solSelect(solintersected);
	}
}

function animate() {
	requestAnimationFrame(animate);
	controls.update();

	render();
}

function render() {
	renderer.render( scene, camera );
}

function makeTextSprite(message, color)
{
    var textColor = { r: color >> 16, g: color >> 8, b: color & 0xFF, a: 0xFF };
    var fontsize = 24;
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    	context.font = "Bold " + fontsize + "px Quattrocento Sans";
    var metrics = context.measureText( message );
    var textWidth = metrics.width;

	context.fillStyle = "rgba("+textColor.r+", "+textColor.g+", "+textColor.b+", 1.0)";
    context.fillRect(0,0, metrics.width, 0.25 * fontsize);
    context.fillText( message, 1, fontsize);

    var texture = new THREE.Texture(canvas) 
    texture.needsUpdate = true;

    var spriteMaterial = new THREE.SpriteMaterial( { map: texture, useScreenCoordinates: false } );
    var sprite = new THREE.Sprite( spriteMaterial );
    sprite.scale.set(0.5 * fontsize, 0.25 * fontsize, 0.75 * fontsize);
    return sprite;  
}