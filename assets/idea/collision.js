import * as Three from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
export class collision {
    constructor() {
        this.collidableObjects = []
    }
    checkCollision(position,size) {
        // Size of the player's bounding box
        const sizes = {
            x: size.x || 1,
            y: size.y || 1,
            z: size.z || 1
        };
    
        for (const obj of this.collidableObjects) {
            // Simple AABB collision check
            if (position.x - sizes.x < obj.max.x &&
                position.x + sizes.x > obj.min.x &&
                position.y - sizes.y < obj.max.y &&
                position.y + sizes.y > obj.min.y &&
                position.z - sizes.z < obj.max.z &&
                position.z + sizes.z > obj.min.z) {
                return true;
            }
        }
        return false;
    }
    checkCustomCollision(min,max,size,position) {
        // Size of the player's bounding box
        const sizes = {
            x: size.x || 1,
            y: size.y || 1,
            z: size.z || 1
        };
        if (position.x - sizes.x < max.x &&
            position.x + sizes.x > min.x &&
            position.y - sizes.y < max.y &&
            position.y + sizes.y > min.y &&
            position.z - sizes.z < max.z &&
            position.z + sizes.z > min.z) {
            return true;
        }
        return false;
    }
    
    check_obj(uuid){
        for(let i = 0; i < this.collidableObjects.length; i++){
            if(this.collidableObjects[i].uuid == uuid){
                return true;
            }
        }
        return false;
    }
    
    isOnGround(position,size) {
        const groundCheckPosition = new Three.Vector3(
            position.x,
            position.y - 0.1,  // Check slightly below player
            position.z
        );
        return checkCollision(groundCheckPosition,size)//player.scale);
    }
}