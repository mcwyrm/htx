
import * as THREE from 'three';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

let group;
let container;
const particlesData = [];
let camera, scene, renderer;
let positions, colors;
let particles;
let pointCloud;
let particlePositions;
let attractiveSpot, attractiveSpotTimer, attractiveSpotIsActive;

const maxSwarmSize = 1000;
let swarmSize = 50;
const r = 1200;
const rHalf = r / 2;

const effectController = {
    swarmSize: swarmSize,
    maxVelocity : 5,
    boidSpace: 5
};

init();

function initGUI() {

    const gui = new GUI();

    gui.add(effectController, 'maxVelocity', 0, 20, 1);                
    gui.add(effectController, 'boidSpace', 0, 50, 1);
    gui.add(effectController, 'swarmSize', 0, 1000, 1 ).onChange( function ( value ) {
        swarmSize = value;
        particles.setDrawRange( 0, swarmSize );
    } );
}

function init() {

    initGUI();

    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 4000 );
    camera.position.setZ(2000);
    camera.position.setY(500);

    scene = new THREE.Scene();
    group = new THREE.Group();
    scene.add( group );

    const helper = new THREE.BoxHelper( new THREE.Mesh( new THREE.BoxGeometry( r, r, r ) ) );
    helper.material.color.setHex( 0x474747 );
    helper.material.blending = THREE.AdditiveBlending;
    helper.material.transparent = true;
    group.add( helper );

    positions = new Float32Array( maxSwarmSize * 3 );
    colors = new Float32Array( maxSwarmSize * 3 );

    const pMaterial = new THREE.PointsMaterial( {
        color: 0xFFFFFF,
        size: 3,
        blending: THREE.AdditiveBlending,
        transparent: true,
        sizeAttenuation: false
    } );

    particles = new THREE.BufferGeometry();
    particlePositions = new Float32Array( maxSwarmSize * 3 );

    for ( let i = 0; i < maxSwarmSize; i ++ ) {

        const randomPosition = GetRandomPoint();
        particlePositions[ i * 3 ] = randomPosition.x;
        particlePositions[ i * 3 + 1 ] =  randomPosition.y;
        particlePositions[ i * 3 + 2 ] =  randomPosition.z;

        // add it to the geometry
        particlesData.push( {						
            position: randomPosition,
            velocity: new THREE.Vector3( 0, 0, 0),
            isPerching: false,
            perchTimer: 0
        } );
    }

    attractiveSpot =  NewAttractiveSpot();
    attractiveSpotTimer = Math.random() * 200;
    attractiveSpotIsActive = true;

    particles.setDrawRange( 0, swarmSize );
    particles.setAttribute( 'position', new THREE.BufferAttribute( particlePositions, 3 ).setUsage( THREE.DynamicDrawUsage ) );

    // create the particle system
    pointCloud = new THREE.Points( particles, pMaterial );
    group.add( pointCloud );

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ).setUsage( THREE.DynamicDrawUsage ) );
    geometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3 ).setUsage( THREE.DynamicDrawUsage ) );

    geometry.computeBoundingSphere();

    geometry.setDrawRange( 0, 0 );

    //

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    container.appendChild( renderer.domElement );

    const controls = new OrbitControls(camera, container);
    controls.update();

    //

    window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    for ( let i = 0; i < swarmSize; i ++ ) {

        // get the particle
        const subject = particlesData[ i ];
        if(subject.isPerching){
            subject.perchTimer--;
            subject.isPerching = subject.perchTimer > 0;
        }
        else{
            const restOfSwarm = GetAllOtherBoids(i);

            let dVelocity = new THREE.Vector3( 0, 0, 0);

            dVelocity = dVelocity.add(Rule_TowardsSwarm(subject, restOfSwarm))
                                    .add(Rule_AvoidBoids(subject, restOfSwarm))
                                    .add(Rule_Boundry(subject, restOfSwarm))
                                    .add(Rule_AttractiveSpot(subject, restOfSwarm));

            subject.velocity = subject.velocity.add(dVelocity);

            subject.velocity.clampLength(0, effectController.maxVelocity);        

            subject.position.add(subject.velocity);

            if(subject.position.z <= 0){
                subject.position.z = 0;                
                subject.isPerching = true;
                subject.perchTimer = Math.random() * 10;
            
            }
            particlePositions[ i * 3 ] += subject.velocity.x;
            particlePositions[ i * 3 + 1 ] += subject.velocity.y;
            particlePositions[ i * 3 + 2 ] += subject.velocity.z;
            
            pointCloud.geometry.attributes.position.needsUpdate = true;
        }
    }

    render();


}

function UpdateAttractiveSpot(){
    attractiveSpotTimer --;
    if(attractiveSpotTimer <= 0){
        attractiveSpotTimer = Math.random() * 20;
        attractiveSpotIsActive = !attractiveSpotIsActive;
        attractiveSpot =  NewAttractiveSpot();
    }
}

function render() {
    renderer.render( scene, camera );
}

function GetAllOtherBoids(subjectIndex){    
    let restOfSwarm = [];
    for (let swarmIndex = 0; swarmIndex < swarmSize; swarmIndex++)
    {
        if (swarmIndex != subjectIndex){
            restOfSwarm.push(particlesData[swarmIndex]);
        }
    }
    return restOfSwarm;
}

function Rule_AttractiveSpot(subject, restOfSwarm){    
    if(attractiveSpotIsActive){
        let attractivePosition = new THREE.Vector3(attractiveSpot.x, attractiveSpot.y, attractiveSpot.z);
        const attractiveSpotVector = attractivePosition.sub(subject.position).divideScalar(10);
        return attractiveSpotVector;
    }
    else{
        return new THREE.Vector3(0,0,0);
    }
}

function Rule_TowardsSwarm(subject, restOfSwarm){
    let swarmPosition = new THREE.Vector3( 0, 0, 0);
    for (const otherBoid of restOfSwarm){
        swarmPosition = swarmPosition.add(otherBoid.position); 
    }
    swarmPosition = swarmPosition.divideScalar(restOfSwarm.length)
                                    .sub(subject.position)
                                    .divideScalar(100);                                             
    return swarmPosition;
}

function Rule_AvoidBoids(subject, restOfSwarm){
    let avoidVector = new THREE.Vector3( 0, 0, 0);
    for (const otherBoid of restOfSwarm){
        if(subject.position.distanceTo(otherBoid.position) < effectController.boidSpace){
            avoidVector = avoidVector.add(subject.position.clone().sub(otherBoid.position));
        }
    }
    return avoidVector;
}

function Rule_Boundry(subject, restOfSwarm){
    let dVelocity = new THREE.Vector3(0,0,0);

    if(subject.position.x < 0){
        dVelocity.setX(5)
    }
    else if (subject.position.x > rHalf){
        dVelocity.setX(-5);
    }
    
    if(subject.position.y < 0){
        dVelocity.setY(5)
    }
    else if (subject.position.y > rHalf){
        dVelocity.setY(-5);
    }
    
    if(subject.position.z < 5){
        dVelocity.setZ(5)
    }
    else if (subject.position.z > rHalf){
        dVelocity.setZ(-5);
    }
    return dVelocity;    
}

function GetRandomPoint(){
    return new THREE.Vector3( Math.random() * r / 2, Math.random() * r / 2, Math.random() * r / 2);
}

function NewAttractiveSpot(){
    const normal = new THREE.Vector3(0, 1, 0);
    return new THREE.Vector3( Math.random() * r / 2, Math.random() * r / 2, Math.random() * r / 2).projectOnPlane(normal);
}
