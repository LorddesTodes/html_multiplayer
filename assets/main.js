// Importiere spezifische Teile von Three.js
import { 
    Scene, 
    PerspectiveCamera, 
    WebGLRenderer, 
    BoxGeometry, 
    MeshPhongMaterial, 
    Mesh, 
    Vector3,
    Vector2,
    AmbientLight,
    DirectionalLight,
    TextureLoader,
    SpriteMaterial,
    Sprite,
    CanvasTexture,
    Group,
    MeshBasicMaterial,
    Raycaster,
    GridHelper,
    PlaneGeometry,
    PlaneBufferGeometry,
    Plane,
    MeshLambertMaterial,
    MeshStandardMaterial,
    TubeGeometry,
    CatmullRomCurve3,
    LineBasicMaterial,
    BufferGeometry,
    Line,

    WebGLRenderTarget,
    PositionalAudio,
    AudioListener,
    AudioLoader,
    Object3D,
    AudioContext
} from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.min.js';
import * as guiInstance from './gui.js';
import * as util from './utility.js';
import * as controll_util from './controlls.js'
const controlls = new controll_util.controlls()
const utility = new util.Utility(window.location.href);
const run_scene = []

let keySequence = [];
let seque = false
const targetSequence = "puppy_cctv".split("");

let item = {}
item["texture"] = './../resources/textures/blocks/van/dirt.png'
item["amount"] = 2
//tests
// Define a curve for the pipe
const curve = new CatmullRomCurve3([
    new Vector3(-2, 0, 0),
    new Vector3(0, 2, 0),
    new Vector3(2, 0, 0)
]);


// Create a TubeGeometry along the curve
/*
const geometry = new TubeGeometry(curve, 20, 0.1, 8, false);
const material = new MeshStandardMaterial({ color: 0x0077ff, wireframe: false });
const pipe = new Mesh(geometry, material);
run_scene.push(pipe);
//power
const wireMaterial = new LineBasicMaterial({ color: 0xffaa00 });
const wirePoints = [new Vector3(-1, 0, 0), new Vector3(1, 1, 0)];
const wireGeometry = new BufferGeometry().setFromPoints(wirePoints);
const wire = new Line(wireGeometry, wireMaterial);
run_scene.push(wire);*/
//stuff

//const screen_gui = new guiInstance.GUI(250, 200, "default_mc_background_ui");
//const slot1 = screen_gui.addSlot(10, 10, item.texture, item.amount);
//screen_gui.render();

const screen_gui = new guiInstance.GUI(250, 200, "default_mc_background_ui", true);

// Example items for the hotbar
let inventory = [];

// Ensure the hotbar renders and updates
window.onload = () => {
    console.log("Initializing hotbar...");
    screen_gui.set_settings({
        maxSlots: 9,
        maxItemsPerSlot: 64,
        hotbarSize: 400
    })
    screen_gui.updateHotbar('hotbar', inventory);
};
document.addEventListener("wheel", function (event) {
    if (event.deltaY > 0) {
        screen_gui.changeSelectedSlot(1)
    } else {
        screen_gui.changeSelectedSlot(-1)
    }
});

// Debugging clicks
document.getElementById('hotbar').addEventListener('click', () => {
    console.log("Hotbar clicked!");
});


// Setup basic scene, camera, and renderer with anti-aliasing for smooth rendering
const scene = new Scene();  // Erstelle eine neue Szene
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);  // Kamera

const listener = new AudioListener();
camera.add(listener)

const renderer = new WebGLRenderer({ antialias: true });  // Renderer with anti-aliasing
renderer.setSize(window.innerWidth-16, window.innerHeight-16);
document.body.appendChild(renderer.domElement);
const textureLoader = new TextureLoader();
//const raycast = new THREE.Raycaster();
// Add lights
const ambientLight = new AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(10, 10, 10);
scene.add(directionalLight);

run_scene.forEach((v)=>{
    scene.add(v);
})

// Physics world
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);  // Gravity
world.broadphase = new CANNON.SAPBroadphase(world);  // Broadphase collision detection
world.solver.iterations = 10;
    
const collidableObjects = [];
// Create player

function checkCollision(position,size) {
    // Size of the player's bounding box
    const playerSize = {
        x: size.x || 1,
        y: size.y || 2,
        z: size.z || 1
    };

    for (const obj of collidableObjects) {
        // Simple AABB collision check
        if (position.x - playerSize.x < obj.max.x &&
            position.x + playerSize.x > obj.min.x &&
            position.y - playerSize.y < obj.max.y &&
            position.y + playerSize.y > obj.min.y &&
            position.z - playerSize.z < obj.max.z &&
            position.z + playerSize.z > obj.min.z) {
            return true;
        }
    }
    return false;
}

function checkCustomCollision(min,max,size,position) {
    // Size of the player's bounding box
    const playerSize = {
        x: size.x || 1,
        y: size.y || 2,
        z: size.z || 1
    };
    if (position.x - playerSize.x < max.x &&
        position.x + playerSize.x > min.x &&
        position.y - playerSize.y < max.y &&
        position.y + playerSize.y > min.y &&
        position.z - playerSize.z < max.z &&
        position.z + playerSize.z > min.z) {
        return true;
    }
    return false;
}

function check_obj(uuid){
    for(let i = 0; i < collidableObjects.length; i++){
        if(collidableObjects[i].uuid == uuid){
            return true;
        }
    }
    return false;
}

function isOnGround() {
    const groundCheckPosition = new Vector3(
        player.position.x,
        player.position.y - 0.1,  // Check slightly below player
        player.position.z
    );
    return checkCollision(groundCheckPosition,player.scale);
}

function createPlayer(x, y, z, uuid,cam=true) {
    // Create a group to hold both the player mesh and camera
    const playerGroup = new Group();
    scene.add(playerGroup);

    // Create the player mesh
    const geometry = new BoxGeometry(1, 2, 1);
    const material = new MeshPhongMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0 // Make player mesh invisible
    });
    const playerMesh = new Mesh(geometry, material);
    playerGroup.add(playerMesh);

    // Position camera inside the player's "head"
    if(cam){
        camera.position.set(0, 1.7, 0); // Slightly below top of player mesh
        playerGroup.add(camera);

        const audio = new PositionalAudio(listener);
        playerMesh.add(audio);
    }

    // Set initial position
    playerGroup.position.set(x, y, z);
    // Physics body
    const playerShape = new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5));
    const playerBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(x, y, z)
    });
    playerBody.addShape(playerShape);
    world.addBody(playerBody);
    playerGroup.uuid = uuid;
    return playerGroup;
}
let player = createPlayer(0,5,0,utility.token(25))
console.log(player)
// Add block to world
function addBlock(x, y, z, width, height, depth, collision = true, uuid = utility.token(25),texture = 0x00ff00,item="van:air",can_interact=false,can_place_on=true,uses_grid=true,on_interact=()=>{}) {
    if(!seque){
        const geometry = new BoxGeometry(width, height, depth);
        const mat_list = {}
        if(texture>=0x000000&&texture<=0xffffff){
            mat_list["material"] = new MeshBasicMaterial({ color: texture });
        }else{
            let ldtexture = textureLoader.load(texture)
            mat_list["material"] = new MeshPhongMaterial({ map: ldtexture });
        }
        const block = new Mesh(geometry, mat_list["material"]);
        block.position.set(x, y, z);
        scene.add(block);
        const blockShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
        const blockBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(x, y, z)
        });
        blockBody.addShape(blockShape);
        world.addBody(blockBody);
        if(collision&&(!check_obj(uuid))){
            collidableObjects.push({
                min: new Vector3(x - width/2, y - height/2, z - depth/2),
                max: new Vector3(x + width/2, y + height/2, z + depth/2),
                body: blockBody,
                uuid: uuid,
                x: x,
                y: y,
                z: z,
                width: width,
                height: height,
                depth: depth
            });
        }
        block.hex = texture //add a thing so textures work too
        block.collision = collision;
        block.uuid = uuid
        block.item = item
        block.uses_grid = uses_grid
        block.can_place_on = can_place_on
        block.ineract = {can_interact:can_interact,on_interact:on_interact}
        return block
    }
    return {position:{x:0,y:-200,z:0},hex:texture,collision:collision,uuid:uuid,item:item,uses_grid:uses_grid,can_place_on:can_place_on,interact:{can_interact:can_interact,on_interact:on_interact}}
}
    
// Gravity and player control
let velocity = new CANNON.Vec3(0, 0, 0);
const controls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false
};
    

let player_visual = addBlock(0,1,0,1, 2.7+0.8, 1,false,utility.token(25),0xff58f6,"van:player",false,false,false)


function movePlayer() {
    if(!seque){
        const speed = 5;
        const direction = new Vector3();

        // Get forward and right directions from camera rotation
        const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        forward.y = 0;
        forward.normalize();

        const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        right.y = 0;
        right.normalize();

        // Calculate movement direction
        if (controls.forward) direction.add(forward);
        if (controls.backward) direction.sub(forward);
        if (controls.left) direction.sub(right);
        if (controls.right) direction.add(right);

        if (direction.length() > 0) {
            direction.normalize();
        }
        
        // Calculate next position
        const nextX = player.position.x + direction.x * speed * 0.1;
        const nextZ = player.position.z + direction.z * speed * 0.1;
        
        // Apply gravity
        velocity.y += world.gravity.y * 0.1;
        const nextY = player.position.y + velocity.y * 0.1;

        // Check for collisions separately for each axis
        const nextPosition = new Vector3(nextX, player.position.y, player.position.z);
        if (!checkCollision(nextPosition,player.scale)) {
            player.position.x = nextX;
        }

        nextPosition.set(player.position.x, nextY, player.position.z);
        if (!checkCollision(nextPosition,player.scale)) {
            player.position.y = nextY;
        } else if (velocity.y < 0) {
            velocity.y = 0; // Stop falling when hitting ground
        }

        nextPosition.set(player.position.x, player.position.y, nextZ);
        if (!checkCollision(nextPosition,player.scale)) {
            player.position.z = nextZ;
        }

        // Handle jumping
        if (controls.jump && isOnGround()) {
            velocity.y = 10;
        }
        if(player.position.y < -40){
            player.position.x = 0;
            player.position.y = 5;
            player.position.z = 0;
        }
    }
    if(!seque){
        player_visual.position.x = player.position.x;
        player_visual.position.y = player.position.y+0.8
        player_visual.position.z = player.position.z;
    }else{
        player.position.x = 0
        player.position.y = -500
        player.position.z = 0
    }
    updatePosition();
}


let isLocked = false;
let rotationSpeed = 0.002;
let yaw = 0;
let pitch = 0;
    
// Key controls
document.addEventListener('keydown', (event) => {
    if(isLocked){
        if (event.code == controlls.controls["forward"]) controls.forward = true;
        if (event.code == controlls.controls["backward"]) controls.backward = true;
        if (event.code == controlls.controls["left"]) controls.left = true;
        if (event.code == controlls.controls["right"]) controls.right = true;
        if (event.code == controlls.controls["jump"]) controls.jump = true;
    }
});

document.addEventListener('keyup', (event) => {
    //if (event.code === 'ArrowUp') controls.forward = false;
    //if (event.code === 'ArrowDown') controls.backward = false;
    //if (event.code === 'ArrowLeft') controls.left = false;
    //if (event.code === 'ArrowRight') controls.right = false;
    //if (event.code === 'ControlRight') controls.jump = false;

    if (event.code == controlls.controls["forward"]) controls.forward = false;
    if (event.code == controlls.controls["backward"]) controls.backward = false;
    if (event.code == controlls.controls["left"]) controls.left = false;
    if (event.code == controlls.controls["right"]) controls.right = false;
    if (event.code == controlls.controls["jump"]) controls.jump = false;
});
document.addEventListener('click',(e)=>{
    console.log(e.button)
    if (e.button === 0) {

    }
})
    
// Multiplayer setup using Socket.io
const socket = io('http://%%localhost:3000%%');
let isConnected = false;
const secret = utility.token(60)
console.log(secret)
socket.on('starter',(st) => {
    inventory.splice(0,inventory.length)//{id:"van:air",amount:0,slot:i+1}})
    st.forEach((v,i)=>{
        inventory.push(v)
    })
    screen_gui.slots = inventory
    socket.emit('store_my_inv',inventory,secret)
    screen_gui.updateHotbar("hotbar", inventory)
})
socket.on('settings',(settings)=>{
    for (const key in settings) {
        let val = settings[key]
        if(key=="gui"){
            for (const key2 in val) {
                screen_gui.settings[key2] = val[key2]
            }
        }
    }
})
socket.on('my_inv',(inv)=>{
    inventory.forEach((v,i)=>{inventory[0]=undefined})
    console.log(inventory)
    inv.forEach((v,i)=>{
        inventory.push(v)
    })
    screen_gui.slots = inventory
    screen_gui.updateHotbar("hotbar", inventory)
})


socket.on('connect', () => {
    isConnected = true;
    socket.emit('joined', { x: 0, y: 5, z: 0 ,uuid:player.uuid});  // Emit the player's starting position
    socket.emit('get_players')
    socket.emit('cl_blocks_update_req')
    if(false){
        socket.emit('getting_my_inv',secret)
    }else{
        socket.emit('get_startup')
    }
});
const list = ["disconnect","error","exit","close"]
list.forEach((val)=>{
    socket.on(val, (out) => {
        console.log(val)
        console.log(out)
        setTimeout(() => {
            if (!isConnected) {
                location.reload();
            }
        }, 100);
    })
})
setTimeout(() => {
    if (!isConnected) {
        location.reload();
    }
}, 100);
// Handle new players joining
const players = []
socket.on('reset_pl', (data) => {
    socket.emit('joined', { x: player.position.x, y: player.position.y, z: player.position.z ,uuid:player.uuid})
})
socket.on('playerLeft', (playerData) => {
    console.log('player left:', playerData,has_player(playerData.uuid));
    if(has_player(playerData.uuid)) remove_player(playerData.uuid)
    // You can create the new player's visual representation here
});
socket.on('reload_website',(e)=>{
    window.location.reload(true);
})
function remove_player(uuid){
    players.forEach((pl, index) => {
        if(pl.uuid === uuid){ 
            pl.position.x = 0
            pl.position.y = -500000
            pl.position.z = 0
            players.splice(index,1)
        }
    });
    collidableObjects.forEach((co,idx)=>{
        if(co.uuid==uuid){
            let dt = {
                min: new Vector3(0 - co.width/2, -500000 - co.height/2, 0 - co.depth/2),
                max: new Vector3(0 + co.width/2, -500000 + co.height/2, 0 + co.depth/2),
                body: co.blockBody,
                uuid: co.uuid,
                x: 0,
                y: -500000,
                z: 0,
                width: co.width,
                height: co.height,
                depth: co.depth
            }
            collidableObjects[idx] = dt
            collidableObjects.splice(idx,1)
        }
    })
}
function has_player(uuid){
    let st = false
    players.forEach(pl => {
        if(pl.uuid == uuid) {
            st = true
        }
    });
    return st
}

// Handle updates to other players' positions
socket.on('clientpos', (data) => {
    //console.log('Player position update:', data);
    // Update the position of other players (not the local one)
    if (data.uuid != player.uuid && !seque) {
        players.forEach(pl => {
            if(pl.uuid==data.uuid){ 
                pl.position.x=data.x
                pl.position.y=data.y
                pl.position.z=data.z
            }
        });
        collidableObjects.forEach((co,idx)=>{
            if(co.uuid==data.uuid){
                let dt = {
                    min: new Vector3(data.x - co.width/2, data.y - co.height/2, data.z - co.depth/2),
                    max: new Vector3(data.x + co.width/2, data.y + co.height/2, data.z + co.depth/2),
                    body: co.blockBody,
                    uuid: co.uuid,
                    x: data.x,
                    y: data.y,
                    z: data.z,
                    width: co.width,
                    height: co.height,
                    depth: co.depth
                }
                collidableObjects[idx] = dt
            }
        })
        // Update the player's position in the scene (you would add logic to find the player in the scene)
    }
    movePlayer()
});
function updatePosition() {
    try{
        var position = player.position; // Current position of the player
        position.uuid = player.uuid
        socket.emit('clientposnw', position);
    }catch(e){}
}
    
// Create cursor element
const cursor = document.createElement('div');
cursor.classList.add('cursor');
document.body.appendChild(cursor);
    

// Lock mouse on click
document.addEventListener('click', () => {
    document.body.requestPointerLock();
});

// Pointer lock change event
document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === document.body) {
        isLocked = true;
        cursor.style.display = 'none'; // Hide cursor when locked
    } else {
        isLocked = false;
        cursor.style.display = 'block'; // Show cursor when not locked
    }
});
    
// Update camera based on mouse movement


function createTextDisplay(x, y, z, scale, r, g, b, look_at_player = true, text, pitch, yaw) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;

    // Set text properties
    context.fillStyle = `rgb(${r}, ${g}, ${b})`;
    context.font = '48px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // Clear canvas and draw text
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);

    // Set position and scale
    sprite.position.set(x, y, z);
    sprite.scale.set(scale, scale * 0.5, 1);

    // Add to scene
    scene.add(sprite);

    // Set initial rotation if not looking at player
    if (!look_at_player) {
        sprite.rotation.x = pitch;
        sprite.rotation.y = yaw;
    }

    // Update function for the text display
    const update = () => {
        if (look_at_player) {
            sprite.lookAt(player.position);
        }
    };

    return {
        object: sprite,
        update: update
    };
}

// Modified mouse movement handler
document.addEventListener('mousemove', (event) => {
    if (isLocked) {
        yaw -= event.movementX * rotationSpeed;
        pitch -= event.movementY * rotationSpeed;

        // Limit the pitch to prevent over-rotation
        pitch = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, pitch));

        // Update camera rotation
        camera.rotation.order = 'YXZ'; // This order prevents gimbal lock
        camera.rotation.x = pitch;
        camera.rotation.y = yaw;
    }
});

// Update cursor position
function updateCursorPosition() {
    if (!isLocked) {
        cursor.style.left = `${window.innerWidth / 2}px`;
        cursor.style.top = `${window.innerHeight / 2}px`;
    }
}

// Rendering and animation loop
function animate() {
    requestAnimationFrame(animate);
    try {
        if(seque)ccrender()
        if(!seque)updateHighlight()
        movePlayer();
        renderer.render(scene, camera);
        world.step(1 / 60);
        if(!seque)updateCursorPosition();
        if(!seque)updateHighlight()
    } catch(e) {
        console.error(e);
    }
}

//audio
/*window.navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
    const peer = new RTCPeerConnection();

    // Send own audio to other players
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    // Receive other players' audio
    peer.ontrack = event => {
        const incomingAudio = document.createElement("audio");
        incomingAudio.srcObject = event.streams[0];
        incomingAudio.autoplay = true;
        
        // Assign to a 3D positional audio source
        const sound = new PositionalAudio(listener);
        const audioSource = new AudioContext().createMediaStreamSource(event.streams[0]);
        sound.setMediaStreamSource(audioSource);
        sound.setRefDistance(2); // Controls how fast volume fades with distance
        sound.setRolloffFactor(1);
        sound.setMaxDistance(10);
        
        // Attach to the correct player (assuming server sends a player ID)
        socket.on('playerJoined', (playerData) => {
            if(!has_player(playerData.uuid) && !seque && playerData.y > -200) {
                let bpl = addBlock(playerData.x,playerData.y,playerData.z,1,2.7,1,true,playerData.uuid,0x0000ff)
                bpl.audio = sound
                bpl.mesh.add(sound)
                players.push(bpl)
            }
            // You can create the new player's visual representation here
        });

        incomingAudio.play();
    };
    
    // WebRTC signaling through WebSockets
    socket.on("offer", async offer => {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("answer", answer);
    });

    socket.on("answer", async answer => {
        await peer.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on("candidate", candidate => {
        peer.addIceCandidate(new RTCIceCandidate(candidate));
    });

    peer.onicecandidate = event => {
        if (event.candidate) {
            socket.emit("candidate", event.candidate);
        }
    };

    peer.createOffer().then(offer => {
        peer.setLocalDescription(offer);
        socket.emit("offer", offer);
    });

    let ch = setTimeout(checkSeque, 100);
    function checkSeque() {
        if (seque) {
            localStream.getAudioTracks().forEach(track => track.enabled = false);
            clearInterval(ch);
        }
    }
});*/
function play3DSound(x, y, z, filePath, volume=100,max_distance=20,fading_distance=10) {
    const audioLoader = new AudioLoader();
    const sound = new PositionalAudio(listener);

    // Load and play the sound file
    audioLoader.load(filePath, (buffer) => {
        sound.setBuffer(buffer);
        sound.setRefDistance(fading_distance); // Sound starts fading beyond this distance
        sound.setRolloffFactor(1); // Controls how fast sound fades
        sound.setMaxDistance(max_distance); // No sound beyond this distance
        sound.setLoop(false); // Play once
        sound.setVolume(volume/100); // Full volume
        sound.play();
    });

    // Create an invisible object to attach the sound to
    const soundObject = new Object3D();
    soundObject.position.set(x, y, z);
    soundObject.add(sound);
    scene.add(soundObject);
}

//level

function createTestLevel() {
    addBlock(0, -1, 0, 200, 1, 200, true,utility.token(25),0x696969)
    // Some obstacles
    //addBlock(-5, 1, -5, 2, 2, 2, true,utility.token(25),0x00ff00);    // Solid block
    //addBlock(5, 1, 5, 2, 2, 2, false,utility.token(25),0x00ff00);     // Ghost block
    
    // Create some platforms at different heights
    //addBlock(-8, 2, 8, 4, 1, 4, true,utility.token(25),0x00ff00);     // Higher platform
    //addBlock(8, 1, -8, 4, 1, 4, true,utility.token(25),0x00ff00);     // Lower platform
    
    // Add a "ghost" platform you can fall through
    //addBlock(0, -5, 0, 20, 1, 20, false,utility.token(25),0x00ff00);
}
    
// Initialize
//addBlock(0, -1, 0, 10, 1, 10); // Add a ground block
createTestLevel()
// Start the animation loop

socket.on('add_block',(block)=>{
    if(!seque){
        let bl = addBlock(block.x, block.y, block.z, block.width, block.height, block.depth, block.collision, block.uuid, block.hex, block.item, false, block.can_place_on)
        blocks.push(bl)
        let tx = block.item
        let mod = tx.slice(0,tx.lastIndexOf(":"))
        let id = tx.slice(tx.lastIndexOf(":")+1)
        play3DSound(block.x,block.y,block.z,"./../resources/audio/"+mod+"/dig/stone3.ogg")
    }
})
socket.on('remove_block',(block)=>{
    collidableObjects.forEach((val,idx) => {
        if(val.uuid==block.uuid){
            collidableObjects.splice(idx,1)
        }
    });
    blocks.forEach((val,idx) => {
        if(val.uuid==block.uuid){
            scene.remove(blocks[idx]);
            blocks.splice(idx,1)
        }
    });
})
socket.on('blocks_updated',(blks)=>{
    blocks.splice(0,blocks.length)
    if(!seque){
        blks.forEach((val,idx)=>{
            let bl = addBlock(val.x, val.y, val.z, val.width, val.height, val.depth, val.collision, val.uuid, val.hex, val.item, false, val.can_place_on)
            blocks.push(bl)
        })
    }
})

function placable(x,y,z){
    blocks.forEach((c)=>{
        if(c.x==x && c.y==y && c.z==z && c.can_place_on) return true
    })
    return false
}


const blocks = []
const max_dist = 8
// Expand GridHelper to cover the world
const gridSize = 200; // Make it larger to cover more area
const gridDivisions = 200; // Increase divisions for better alignment
const gridHelper = new GridHelper(gridSize, gridDivisions);
gridHelper.position.y = -0.5; // Slightly below ground level to prevent overlap
scene.add(gridHelper);

// Raycaster setup
const raycaster = new Raycaster();

// Block highlighting for placement
const highlightMaterial = new MeshBasicMaterial({ color: 0xffff00, wireframe: true });
const highlightMesh = new Mesh(new BoxGeometry(1, 1, 1), highlightMaterial);
scene.add(highlightMesh);

const from = new Vector2();
from.x = -0.003
from.y = 0.063

function updateHighlight() {
    raycaster.setFromCamera(from, camera);
    raycaster.params.Line.threshold = 0.1
    raycaster.params.Points.threshold = 0.01
    const intersects = raycaster.intersectObjects([...blocks, gridHelper]);
    if (intersects.length > 0) {
        const sp = getSnappedPosition(intersects[0].point).add(new Vector3(0, 0, 0)); // Offset to prevent glitching inside blocks
        //console.log(sp)
        let selected_block = screen_gui.getSelectedSlot()
        let stat = false
        if(selected_block) if(selected_block.id != "van:air") stat = true
        if(player.position.distanceTo(sp) <= max_dist && stat){
            highlightMesh.position.set(sp.x, sp.y, sp.z);
        }else{
            highlightMesh.position.set(0,-1000,0)
        }
    }
}

function getSnappedPosition(intersectionPoint) {
    return new Vector3(
        Math.round(intersectionPoint.x),
        Math.round(intersectionPoint.y), // Allow stacking
        Math.round(intersectionPoint.z)
    );
}
function is_same_blockpos(list,x,y,z){
    let st = false
    list.forEach((v,i)=>{
        if(v.position.x == x && v.position.y == y && v.position.z == z) {
            st = true
            return true
        }
    })
    return st
}

function onRightClick(event) {
    if (event.button !== 2) return; // Only respond to right-click
    
    raycaster.setFromCamera(from, camera);
    const intersects = raycaster.intersectObjects([...blocks, gridHelper]);

    if (intersects.length > 0) {
        const sp = getSnappedPosition(intersects[0].point);
        
        let blsc = { width: 1, height: 1, depth: 1 };
        let min = new Vector3(sp.x - blsc.width / 2, sp.y - blsc.height / 2, sp.z - blsc.depth / 2);
        let max = new Vector3(sp.x + blsc.width / 2, sp.y + blsc.height / 2, sp.z + blsc.depth / 2);
        let pp = { x: player.position.x, y: player.position.y, z: player.position.z };
        let selected_block = screen_gui.getSelectedSlot()
        if(selected_block==null) return
        if (!checkCustomCollision(min, max, player.scale, pp) && player.position.distanceTo(sp) <= max_dist && selected_block.id != "van:air" && !is_same_blockpos(blocks,sp.x,sp.y,sp.z)) {
            let bl = addBlock(sp.x, sp.y, sp.z, blsc.width, blsc.height, blsc.depth, true, utility.token(25), utility.fulltoURL(selected_block.id), selected_block.id,false,true);
            blocks.push(bl);
            let bl_data = {x:sp.x, y:sp.y, z:sp.z, width:blsc.width, height:blsc.height, depth:blsc.depth, collision:bl.collision, uuid:bl.uuid, hex:bl.hex, item:selected_block.id, can_place_on:bl.can_place_on}
            socket.emit('cl_add_block',bl_data)
            screen_gui.removeFromSelected_slot(1)
            inventory = screen_gui.slots
            socket.emit('store_my_inv',inventory,secret)
            let tx = selected_block.id
            let mod = tx.slice(0,tx.lastIndexOf(":"))
            let id = tx.slice(tx.lastIndexOf(":")+1)
            //play3DSound(sp.x,sp.y,sp.z,"./../resources/audio/"+mod+"/dig/stone3.ogg")
        }
    }
}

function onLeftClick(event) {
    if (event.button !== 0) return; // Only respond to left-click
    
    raycaster.setFromCamera(from, camera);
    const intersects = raycaster.intersectObjects(blocks);

    if (intersects.length > 0) {
        const block = intersects[0].object;
        let bluid = block.uuid
        if(player.position.distanceTo(block.position) <= max_dist){
            screen_gui.addItemToHotbar(block.item,1)
            socket.emit('cl_remove_block',{uuid:bluid})
            collidableObjects.forEach((val,idx) => {
                if(val.uuid==bluid){
                    collidableObjects.splice(idx,1)
                }
            });
            scene.remove(block);
            blocks.splice(blocks.indexOf(block), 1);
            inventory = screen_gui.slots
            socket.emit('store_my_inv',inventory,secret)
        }
    }
}
// Change from left-click to remove blocks and right-click to place blocks
window.addEventListener('mousedown', onRightClick);
window.addEventListener('mousedown', onLeftClick);

// 📏 Resize Handling
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// 🎬 Animation Loop
animate();

function startup_cameras(){
    if(seque){
        // CCTV Camera (Secondary Camera)
        const cctvCamera = new PerspectiveCamera(50, 1, 0.1, 100);
        cctvCamera.position.set(0, 3, 0); // Position the CCTV
        cctvCamera.lookAt(player.position);

        // Render Target for CCTV
        const cctvRenderTarget = new WebGLRenderTarget(512, 512);
        const cctvMaterial = new MeshBasicMaterial({ map: cctvRenderTarget.texture });

        // Create CCTV Screen (A Plane to Display the Feed)
        const screenGeometry = new PlaneGeometry(2, 1.5);
        const cctvScreen = new Mesh(screenGeometry, cctvMaterial);
        cctvScreen.position.set(0, 2, 0);
        cctvScreen.rotation.y = -Math.PI / 4;
        scene.add(cctvScreen);
    }
}
function exportCCTV() {
    const width = cctvRenderTarget.width;
    const height = cctvRenderTarget.height;
    const buffer = new Uint8Array(width * height * 4);
    renderer.readRenderTargetPixels(cctvRenderTarget, 0, 0, width, height, buffer);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true; // Enable anti-aliasing

    const imageData = ctx.createImageData(width, height);
    for (let row = 0; row < height; row++) {
        const sourceRow = (height - row - 1) * width * 4;
        const targetRow = row * width * 4;
        imageData.data.set(buffer.subarray(sourceRow, sourceRow + width * 4), targetRow);
    }
    ctx.putImageData(imageData, 0, 0);

    canvas.toBlob((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            socket.emit('cctvFeed', reader.result);
        };
        reader.readAsDataURL(blob);
    }, 'image/png');
}

function ccrender(){
    try{
        renderer.setRenderTarget(cctvRenderTarget);
        renderer.render(scene, cctvCamera);
        renderer.setRenderTarget(null);
        cctvCamera.lookAt(player.position);
        exportCCTV()
    }catch(e){}
}
startup_cameras()

document.addEventListener('keydown', (event) => {
    // Capture the key that was pressed
    const keyPressed = event.key.toLowerCase();
    console.log(event.key.toLowerCase())
    // If the key matches the current expected key, add it to the sequence
    if (keyPressed === targetSequence[keySequence.length] && event.key.toLowerCase()!="shift" && event.key.toLowerCase()!="ctrl" && event.key.toLowerCase()!="alt" &&event.key.toLowerCase()!="|"){
        keySequence.push(keyPressed);
    }else{
        if(event.key.toLowerCase()=="|") window.location.reload()
    }
    if (keySequence.length === targetSequence.length && seque == false) {
        // Check if the sequence is correct
        if (keySequence.join('') === targetSequence.join('')) {
            // Run the script when sequence is matched
            startup_cameras()
            seque = true
        }
    }
});