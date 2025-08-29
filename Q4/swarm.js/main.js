
import * as THREE from 'three';
import * as SWARM from './swarm.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let group;
let container;
let camera, scene, renderer;
let positions, colors;
let particlesGeometry;
let pointCloud;
let particlePositions;

const swarmController = SWARM.swarmController;
let swarmSize;
const boxSize = 1200;


init();

function initGUI() {

    const gui = new GUI();
    SWARM.setBoxSize(boxSize);
    swarmSize = swarmController.swarmSize;

    gui.add(swarmController, 'perchDuration', swarmController.minimum.perchDuration, swarmController.maximum.perchDuration, 10);
    gui.add(swarmController, 'maxVelocity', swarmController.minimum.maxVelocity, swarmController.maximum.maxVelocity, 1);
    gui.add(swarmController, 'boidSpace', swarmController.minimum.boidSpace, swarmController.maximum.boidSpace, 1);
    gui.add(swarmController, 'swarmVisibility', swarmController.minimum.swarmVisibility, swarmController.maximum.swarmVisibility, 1);
    gui.add(swarmController, 'foodVisibility', swarmController.minimum.foodVisibility, swarmController.maximum.foodVisibility, 1);
    gui.add(swarmController, 'swarmSize', swarmController.minimum.swarmSize, swarmController.maximum.swarmSize, 1).onChange( function ( value ) {
        swarmSize = value;
        particlesGeometry.setDrawRange( 0, swarmSize );
    } );
}

function init() {

    initGUI();

    SWARM.initSwarm();

    init3D();
}


function init3D(){
    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 4000 );
    camera.position.setZ(2000);
    camera.position.setY(500);

    scene = new THREE.Scene();
    group = new THREE.Group();
    scene.add( group );

    const boxGeometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const boxMesh = new THREE.Mesh(boxGeometry);
    boxMesh.position.set(boxSize / 2, boxSize / 2, boxSize / 2);
    const helper = new THREE.BoxHelper( boxMesh );
    helper.material.color.setHex( 0x474747 );
    helper.material.blending = THREE.AdditiveBlending;
    helper.material.transparent = true;
    group.add( helper );

    positions = new Float32Array( swarmController.maximum.swarmSize * 3 );
    colors = new Float32Array( swarmController.maximum.swarmSize * 3 );

    const pMaterial = new THREE.PointsMaterial( {
        color: 0xFFFFFF,
        size: 3,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: false
    } );

    particlesGeometry = new THREE.BufferGeometry();
    particlePositions = new Float32Array( swarmController.maximum.swarmSize * 3 );

    updatePointCloud();

    particlesGeometry.setDrawRange( 0, swarmSize );
    particlesGeometry.setAttribute( 'position', new THREE.BufferAttribute( particlePositions, 3 ).setUsage( THREE.DynamicDrawUsage ) );

    // create the particle system
    pointCloud = new THREE.Points( particlesGeometry, pMaterial );
    group.add( pointCloud );

    //

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    container.appendChild( renderer.domElement );      
    
    const controls = new OrbitControls( camera, container );
    controls.minDistance = 1000;
    controls.maxDistance = 5000;

    //

    window.addEventListener( 'resize', onWindowResize );  
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    SWARM.updateSwarm();
    updatePointCloud();
    render();
}

function render() {
    renderer.render( scene, camera );
}

function updatePointCloud(){

    const particleVectors = SWARM.getParticlePositions();
    for ( let i = 0; i < swarmController.maximum.swarmSize; i ++ ) {
        particlePositions[ i * 3 ] = particleVectors[i].x;
        particlePositions[ i * 3 + 1 ] = particleVectors[i].y;
        particlePositions[ i * 3 + 2 ] = particleVectors[i].z;
    }

    if(pointCloud){
        pointCloud.geometry.attributes.position.needsUpdate = true;
    }
}