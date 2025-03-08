import * as Three from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.min.js';
import * as utilitys from './utility.js';
import * as block_util from './block_creating.js'
import * as collision_util from './collision.js'
const collision_lib = new collision_util.collision()
const utility = new utilitys.Utility();
export class Player {
    constructor(x,y,z,world,socket,scene){
        this.spawn = {x:x,y:y,z:z}
        this.playerData = {}
        this.controls = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jump: false
        };
        this.block_lib = new block_util.build(scene,world)
        this.socket = socket
        this.world = world;
        this.dont_USE()
        this.scene = scene
        this.camera = new Three.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    }
    createPlayer(cam=true) {
        let x = this.spawn.x
        let y = this.spawn.y 
        let z = this.spawn.z 
        this.playerData.uuid = utility.token(25)
        this.playerData.cam = cam
        // Create a group to hold both the player mesh and camera
        const playerGroup = new Three.Group();
        this.scene.add(playerGroup);
    
        // Create the player mesh
        const geometry = new Three.BoxGeometry(1, 2, 1);
        const material = new Three.MeshPhongMaterial({ 
            color: 0xff0000,
            transparent: true,
            opacity: 0 // Make player mesh invisible
        });
        const playerMesh = new Three.Mesh(geometry, material);
        playerGroup.add(playerMesh);
    
        // Position camera inside the player's "head"
        if(cam){
            this.camera.position.set(0, 1.7, 0); // Slightly below top of player mesh
            playerGroup.add(this.camera);
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
        this.world.addBody(playerBody);
    
        playerGroup.uuid = this.playerData.uuid;
        this.playerData.group = playerGroup;
        this.playerData.player_visual = this.block_lib.addBlock(0,1,0,1, 2.7, 1,false,utility.token(25),0xff58f6,"van:player",false,false,false)
        return playerGroup;
    }
    movePlayer() {
        const speed = 5;
        const direction = new Vector3();
        let velocity = new CANNON.Vec3(0, 0, 0);
        let player = this.playerData.group
        let player_visual = this.playerData.player_visual
        // Get forward and right directions from camera rotation
        const forward = new Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        forward.y = 0;
        forward.normalize();
    
        const right = new Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
        right.y = 0;
        right.normalize();
    
        // Calculate movement direction
        if (this.controls.forward) direction.add(forward);
        if (this.controls.backward) direction.sub(forward);
        if (this.controls.left) direction.sub(right);
        if (this.controls.right) direction.add(right);
    
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
        if (!collision_lib.checkCollision(nextPosition,player.scale)) {
            player.position.x = nextX;
        }
    
        nextPosition.set(player.position.x, nextY, player.position.z);
        if (!collision_lib.checkCollision(nextPosition,player.scale)) {
            player.position.y = nextY;
        } else if (velocity.y < 0) {
            velocity.y = 0; // Stop falling when hitting ground
        }
    
        nextPosition.set(player.position.x, player.position.y, nextZ);
        if (!collision_lib.checkCollision(nextPosition,player.scale)) {
            player.position.z = nextZ;
        }
    
        // Handle jumping
        if (this.controls.jump && collision_lib.isOnGround(player.position,player.scale)) {
            velocity.y = 10;
        }
        if(player.position.y < -40){
            player.position.x = 0;
            player.position.y = 5;
            player.position.z = 0;
        }
        player_visual.position.x = player.position.x;
        player_visual.position.y = player.position.y+0.7
        player_visual.position.z = player.position.z;
        updatePosition();
    }

    dont_USE(){
        document.addEventListener('keydown', (event) => {
            if(isLocked){
                if (event.code === 'ArrowUp') this.controls.forward = true;
                if (event.code === 'ArrowDown') this.controls.backward = true;
                if (event.code === 'ArrowLeft') this.controls.left = true;
                if (event.code === 'ArrowRight') this.controls.right = true;
                if (event.code === 'ControlRight') this.controls.jump = true;
        
                if (event.code === 'w') this.controls.forward = true;
                if (event.code === 's') this.controls.backward = true;
                if (event.code === 'a') this.controls.left = true;
                if (event.code === 'd') this.controls.right = true;
                if (event.code === 'Space') this.controls.jump = true;
            }
        });
            
        document.addEventListener('keyup', (event) => {
            if (event.code === 'ArrowUp') this.controls.forward = false;
            if (event.code === 'ArrowDown') this.controls.backward = false;
            if (event.code === 'ArrowLeft') this.controls.left = false;
            if (event.code === 'ArrowRight') this.controls.right = false;
            if (event.code === 'ControlRight') this.controls.jump = false;
        
            if (event.code === 'w') this.controls.forward = false;
            if (event.code === 's') this.controls.backward = false;
            if (event.code === 'a') this.controls.left = false;
            if (event.code === 'd') this.controls.right = false;
            if (event.code === 'Space') this.controls.jump = false;
        });
    }
    updatePosition() {
        try{
            var position = this.playerData.group.position; // Current position of the player
            position.uuid = this.playerData.group.uuid
            this.socket.emit('clientposnw', position);
        }catch(e){}
    }
}