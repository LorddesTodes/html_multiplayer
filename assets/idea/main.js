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

    WebGLRenderTarget
} from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.min.js';
import * as guiInstance from './gui.js';
import * as util from './utility.js';
import * as player_lib from './player.js';
import * as block_util from './block_creating.js'
import * as collision_util from './collision.js'

const collision_lib = new collision_util.collision()
const utility = new util.Utility(window.location.href);
const run_scene = []

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
const hotbarItems = [
    { id: 'van:dirt', amount: 2 },
    { id: 'van:dirt', amount: 1 },
    { id: 'van:dirt', amount: 0 }, // Empty slot
    { id: 'van:dirt', amount: 5 },
    { id: 'van:dirt', amount: 2566 }
];

// Ensure the hotbar renders and updates
window.onload = () => {
    console.log("Initializing hotbar...");
    screen_gui.set_settings({
        maxSlots: 9,
        maxItemsPerSlot: 64,
        hotbarSize: 400
    })
    screen_gui.updateHotbar('hotbar', hotbarItems);
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
const renderer = new WebGLRenderer({ antialias: true });  // Renderer with anti-aliasing
renderer.setSize(window.innerWidth-16, window.innerHeight-16);
document.body.appendChild(renderer.domElement);
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

//connect to socket
const socket = io('http://localhost:3000');
let isConnected = false;

const player_inst = new player_lib.Player(0,1,0,world,socket,scene);
const block_lib = new block_util.build(scene,world)
let player = player_inst.createPlayer()

socket.on('connect', () => {
    isConnected = true;
    socket.emit('joined', { x: 0, y: 5, z: 0 ,uuid:player.uuid});  // Emit the player's starting position
    socket.emit('get_players')
    socket.emit('cl_blocks_update_req')
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

// Create player

console.log(player)
// Add block to world

    
// Gravity and player control

let isLocked = false;
let rotationSpeed = 0.002;
let yaw = 0;
let pitch = 0;
    
// Key controls
document.addEventListener('click',(e)=>{
    console.log(e.button)
    if (e.button === 0) {

    }
})
    
// Handle new players joining
const players = []
socket.on('reset_pl', (data) => {
    socket.emit('joined', { x: player.position.x, y: player.position.y, z: player.position.z ,uuid:player.uuid})
})
socket.on('playerJoined', (playerData) => {
    console.log('New player joined:', playerData);
    if(!has_player(playerData.uuid)) players.push(block_lib.addBlock(playerData.x,playerData.y,playerData.z,1,2.7,1,true,playerData.uuid,0x0000ff))
    // You can create the new player's visual representation here
});
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
    collision_lib.collidableObjects.forEach((co,idx)=>{
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
            collision_lib.collidableObjects[idx] = dt
        }
    })
    collision_lib.collidableObjects.splice(idx,1)
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
    if (data.uuid != player.uuid) {
        players.forEach(pl => {
            if(pl.uuid==data.uuid){ 
                pl.position.x=data.x
                pl.position.y=data.y
                pl.position.z=data.z
            }
        });
        collision_lib.collidableObjects.forEach((co,idx)=>{
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
                collision_lib.collidableObjects[idx] = dt
            }
        })
        // Update the player's position in the scene (you would add logic to find the player in the scene)
    }
    movePlayer()
});
    
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
        player_inst.camera.rotation.order = 'YXZ'; // This order prevents gimbal lock
        player_inst.camera.rotation.x = pitch;
        player_inst.camera.rotation.y = yaw;
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
        ccrender()
        updateHighlight()
        player_inst.movePlayer();
        renderer.render(scene, player_inst.camera);
        world.step(1 / 60);
        updateCursorPosition();
        updateHighlight()
    } catch(e) {
        console.error(e);
    }
}

function createTestLevel() {
    block_lib.addBlock(0, -1, 0, 200, 1, 200, true,utility.token(25),0x696969)
    // Some obstacles
    block_lib.addBlock(-5, 1, -5, 2, 2, 2, true,utility.token(25),0x00ff00);    // Solid block
    block_lib.addBlock(5, 1, 5, 2, 2, 2, false,utility.token(25),0x00ff00);     // Ghost block
    
    // Create some platforms at different heights
    block_lib.addBlock(-8, 2, 8, 4, 1, 4, true,utility.token(25),0x00ff00);     // Higher platform
    block_lib.addBlock(8, 1, -8, 4, 1, 4, true,utility.token(25),0x00ff00);     // Lower platform
    
    // Add a "ghost" platform you can fall through
    block_lib.addBlock(0, -5, 0, 20, 1, 20, false,utility.token(25),0x00ff00);
}
    
// Initialize
//addBlock(0, -1, 0, 10, 1, 10); // Add a ground block
createTestLevel()
// Start the animation loop

socket.on('add_block',(block)=>{
    let bl = block_lib.addBlock(block.x, block.y, block.z, block.width, block.height, block.depth, block.collision, block.uuid, block.hex, block.item, false, block.can_place_on)
    blocks.push(bl)
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
    blks.forEach((val,idx)=>{
        let bl = addBlock(val.x, val.y, val.z, val.width, val.height, val.depth, val.collision, val.uuid, val.hex, val.item, false, val.can_place_on)
        blocks.push(bl)
    })
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
    raycaster.setFromCamera(from, player_inst.camera);
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

function onRightClick(event) {
    if (event.button !== 2) return; // Only respond to right-click
    
    raycaster.setFromCamera(from, player_inst.camera);
    const intersects = raycaster.intersectObjects([...blocks, gridHelper]);

    if (intersects.length > 0) {
        const sp = getSnappedPosition(intersects[0].point);
        
        let blsc = { width: 1, height: 1, depth: 1 };
        let min = new Vector3(sp.x - blsc.width / 2, sp.y - blsc.height / 2, sp.z - blsc.depth / 2);
        let max = new Vector3(sp.x + blsc.width / 2, sp.y + blsc.height / 2, sp.z + blsc.depth / 2);
        let pp = { x: player.position.x, y: player.position.y, z: player.position.z };
        let selected_block = screen_gui.getSelectedSlot()

        if (!checkCustomCollision(min, max, player.scale, pp) && player.position.distanceTo(sp) <= max_dist && selected_block.id != "van:air") {
            let bl = addBlock(sp.x, sp.y, sp.z, blsc.width, blsc.height, blsc.depth, true, utility.token(25), utility.fulltoURL(selected_block.id), selected_block.id,false,true);
            blocks.push(bl);
            let bl_data = {x:sp.x, y:sp.y, z:sp.z, width:blsc.width, height:blsc.height, depth:blsc.depth, collision:bl.collision, uuid:bl.uuid, hex:bl.hex, item:selected_block.id, can_place_on:bl.can_place_on}
            socket.emit('cl_add_block',bl_data)
            screen_gui.removeFromSelected_slot(1)
        }
    }
}

function onLeftClick(event) {
    if (event.button !== 0) return; // Only respond to left-click
    
    raycaster.setFromCamera(from, player_inst.camera);
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
        }
    }
}
// Change from left-click to remove blocks and right-click to place blocks
window.addEventListener('mousedown', onRightClick);
window.addEventListener('mousedown', onLeftClick);

// 📏 Resize Handling
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    player_inst.camera.aspect = window.innerWidth / window.innerHeight;
    player_inst.camera.updateProjectionMatrix();
});

// 🎬 Animation Loop
animate();

function ccrender(){
    try{
        renderer.setRenderTarget(cctvRenderTarget);
        renderer.render(scene, cctvCamera);
        renderer.setRenderTarget(null);
        cctvCamera.lookAt(player.position);
    }catch(e){}
}

// CCTV Camera (Secondary Camera)
const cctvCamera = new PerspectiveCamera(50, 1, 0.1, 100);
cctvCamera.position.set(0, 3, -3); // Position the CCTV
cctvCamera.lookAt(player.position);

// Render Target for CCTV
const cctvRenderTarget = new WebGLRenderTarget(512, 512);
const cctvMaterial = new MeshBasicMaterial({ map: cctvRenderTarget.texture });

// Create CCTV Screen (A Plane to Display the Feed)
const screenGeometry = new PlaneGeometry(2, 1.5);
const cctvScreen = new Mesh(screenGeometry, cctvMaterial);
cctvScreen.position.set(2, 2, 0);
cctvScreen.rotation.y = -Math.PI / 4;
scene.add(cctvScreen);
