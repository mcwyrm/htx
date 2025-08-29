import * as POISSON from 'poisson-process';
import * as THREE from 'three';

let boxSize = 1200;
const particlesData = [];
let foodSpots, foodSpotTimer;

export const swarmController = {
        swarmSize: 500,
        maxVelocity : 5,
        boidSpace: 30,
        swarmVisibility: 200,
        foodVisibility: 600,
        perchDuration: 300,
        maximum: {
            swarmSize: 1000,
            maxVelocity : 50,
            boidSpace: 50,
            swarmVisibility: boxSize ?? 2000,
            foodVisibility: boxSize ?? 2000,
            perchDuration: 1000,
        },
        minimum: {
            swarmSize: 5,
            maxVelocity : 1,
            boidSpace: 0,
            swarmVisibility: 10,
            foodVisibility: 10,
            perchDuration: 1,
        }
};

export function setBoxSize(size){
    boxSize = size ?? 1200;
}

export function getParticlePositions(){
    return particlesData.slice(0, swarmController.maximum.swarmSize).map((boid) => boid.position);
}

export function updateSwarm(){
    for ( let subjectIndex = 0; subjectIndex < swarmController.swarmSize; subjectIndex ++ ) {
        updateParticlePosition(subjectIndex);
    }
    ExpireFoodSpots();
}

export function initSwarm(){    
    for ( let i = 0; i < swarmController.maximum.swarmSize; i ++ ) {
        const randomPosition = GetRandomPoint();
        particlesData.push( {
            position: randomPosition,
            velocity: new THREE.Vector3( 0, 0, 0),
            isPerching: false,
            perchTimer: 0
        } );
    }

    foodSpots =  [];
    foodSpotTimer = 0;
    var foodSpotProcess = POISSON.create(1500, NewFoodSpot);
    foodSpotProcess.start();
}

function updateParticlePosition(index){
    const subject = particlesData[ index ];

    if(subject.isPerching){
        subject.perchTimer--;
        subject.isPerching = subject.perchTimer > 0;
    }
    else{
        const restOfSwarm = GetAllOtherBoids(index);
        let dVelocity = new THREE.Vector3( 0, 0, 0);

        dVelocity = dVelocity.add(Rule_TowardsSwarm(subject, restOfSwarm))
                             .add(Rule_AvoidBoids(subject, restOfSwarm))
                             .add(Rule_Boundry(subject, restOfSwarm))
                             .add(Rule_MatchVelocity(subject, restOfSwarm))
                             .add(Rule_Noise(subject, restOfSwarm))
                             .add(Rule_FoodSpots(subject, restOfSwarm));

        subject.velocity = subject.velocity.add(dVelocity);
        subject.velocity.clampLength(0, swarmController.maxVelocity);
        subject.position.add(subject.velocity);
        setIsPerching(subject);
        return subject.position.clone();
    }
}

function Rule_FoodSpots(subject, restOfSwarm){
    let foodSpotVector = new THREE.Vector3(0,0,0);
    if(foodSpots.length > 0){
        let closestFoodSpot = {
            distance: subject.position.distanceTo(foodSpots[0].position),
            position: foodSpots[0].position
        };
        for(const foodSpot of foodSpots)
        {
            if(subject.position.distanceTo(foodSpot) < closestFoodSpot.distance)
            {
                closestFoodSpot = {
                    distance: subject.position.distanceTo(foodSpot.position),
                    position: foodSpot.position
                };
            }
        }
        if(closestFoodSpot.distance < swarmController.foodVisibility){
            foodSpotVector.add(closestFoodSpot.position.clone().sub(subject.position));
        }
    }
    return foodSpotVector;
}

function Rule_TowardsSwarm(subject, restOfSwarm){
    let swarmPosition = new THREE.Vector3( 0, 0, 0);
    if(restOfSwarm.length > 0){
        for (const otherBoid of restOfSwarm){
            swarmPosition = swarmPosition.add(otherBoid.position); 
        }
        swarmPosition = swarmPosition.divideScalar(restOfSwarm.length)
                                    .sub(subject.position)
                                    .divideScalar(50);
    }
    return swarmPosition;
}

function Rule_AvoidBoids(subject, restOfSwarm){
    let avoidVector = new THREE.Vector3( 0, 0, 0);
    let boidCount = 0;
    for (const otherBoid of restOfSwarm){
        if(subject.position.distanceTo(otherBoid.position) < swarmController.boidSpace){
            avoidVector = avoidVector.add(subject.position.clone().sub(otherBoid.position));
            boidCount++;
        }
    }
    if(boidCount >0){
        avoidVector.divideScalar(boidCount);
    }
    return avoidVector;
}

function Rule_MatchVelocity(subject, restOfSwarm){
    let swarmVelocity = new THREE.Vector3( 0, 0, 0);
    if(restOfSwarm.length > 0){
            for (const otherBoid of restOfSwarm){
            swarmVelocity = swarmVelocity.add(otherBoid.velocity); 
        }
        swarmVelocity = swarmVelocity.divideScalar(restOfSwarm.length)
                                     .sub(subject.velocity)
                                     .divideScalar(5);
    }
    return swarmVelocity;
}

function Rule_Noise(subject, restOfSwarm){
    return new THREE.Vector3(0,0,0).random().randomDirection();
}

function Rule_Boundry(subject, restOfSwarm){
    let dVelocity = new THREE.Vector3(0,0,0);

    if(subject.position.x <= 0){
        dVelocity.setX(5)
    }
    else if (subject.position.x >= boxSize){
        dVelocity.setX(-5);
    }

    if(subject.position.y <= 0){
        dVelocity.setY(50)
        }
    else if (subject.position.y >= boxSize){
        dVelocity.setY(-50);
    }

    if(subject.position.z <= 5){
        dVelocity.setZ(5)
    }
    else if (subject.position.z >= boxSize){
        dVelocity.setZ(-5);
    }

    return dVelocity;
}

function GetRandomPoint(){
    return new THREE.Vector3( Math.random() * boxSize, Math.random() * boxSize, Math.random() * boxSize);
}

function ExpireFoodSpots(){
    foodSpotTimer++;
    if(foodSpots.length > 0)
    {
        foodSpots = foodSpots.sort(function(a,b){ return a.expiration - b.expiration});
        while(foodSpots.length = 0 || foodSpots[0].expiration <= foodSpotTimer)
        {
            foodSpots.shift();
        }
    }
}

function NewFoodSpot(){
    const normal = new THREE.Vector3(0, 1, 0);
    foodSpots.push({
        position: new THREE.Vector3( Math.random() * boxSize, Math.random() * boxSize, Math.random() * boxSize).projectOnPlane(normal),
        expiration: foodSpotTimer + Math.random() * 500 + 500
    });
}

function setIsPerching(subject){
    if(subject.position.y <= 0){
        subject.position.y = 0;
        subject.isPerching = true;
        subject.perchTimer = Math.random() * swarmController.perchDuration;
    }
}

function GetAllOtherBoids(subjectIndex){    
    let restOfSwarm = [];
    for (let swarmIndex = 0; swarmIndex < swarmController.swarmSize; swarmIndex++)
    {
        if (swarmIndex != subjectIndex && particlesData[subjectIndex].position.distanceTo(particlesData[swarmIndex].position) <= swarmController.swarmVisibility){
            restOfSwarm.push(particlesData[swarmIndex]);
        }
    }
    return restOfSwarm;
}