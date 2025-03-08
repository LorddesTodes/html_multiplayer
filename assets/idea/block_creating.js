import * as Three from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.min.js';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.min.js';
import * as collision_util from './collision.js';
import * as utilitys from './utility.js';
const collision_lib = new collision_util.collision()
const utility = new utilitys.Utility();
export class build {
    constructor(scene,world) {
        this.scene = scene
        this.world = world
        this.textureLoader = new Three.TextureLoader()
    }
    addBlock(x, y, z, width, height, depth, collision = true, uuid = utility.token(25),texture = 0x00ff00,item="van:air",can_interact=false,can_place_on=true,uses_grid=true,on_interact=()=>{}) {
        const geometry = new Three.BoxGeometry(width, height, depth);
        const mat_list = {}
        if(texture>=0x000000&&texture<=0xffffff){
            mat_list["material"] = new Three.MeshBasicMaterial({ color: texture });
        }else{
            let ldtexture = textureLoader.load(texture)
            mat_list["material"] = new Three.MeshPhongMaterial({ map: ldtexture });
        }
        const block = new Three.Mesh(geometry, mat_list["material"]);
        block.position.set(x, y, z);
        this.scene.add(block);
        const blockShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
        const blockBody = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(x, y, z)
        });
        blockBody.addShape(blockShape);
        this.world.addBody(blockBody);
        if(collision&&(!collision_lib.check_obj(uuid))){
            collision_lib.collidableObjects.push({
                min: new Three.Vector3(x - width/2, y - height/2, z - depth/2),
                max: new Three.Vector3(x + width/2, y + height/2, z + depth/2),
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
}