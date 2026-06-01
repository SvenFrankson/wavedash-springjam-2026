import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { PhysicsMotionType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeBox } from "@babylonjs/core/Physics/v2/physicsShape";
import { Game } from "./Game";
import { BaseMaterials } from "./BaseMaterials";
import { CreateBeveledBoxVertexData } from "babylonjs-tiaratumgames-tools";
import { Wait } from "./ToonSound";

export class Block extends Mesh {

    public static MaterialIndex = 0;
    public static Width = 0.4;
    public static Depth = 1;

    public size: Vector3 = Vector3.One();
    public density: number = 0.5;
    public get mass() {
        return this.size.x * this.size.y * this.size.z * this.density;
    }

    constructor(public petName: string, public game: Game) {
        super(petName);
        this.game.blocks.add(this);
        this.rotationQuaternion = Quaternion.Identity();
        this.material = this.game.baseMaterials.materials[Block.MaterialIndex % this.game.baseMaterials.materials.length];
        BaseMaterials.MakeOutline(this);
    }

    public init(size: Vector3): void {
        let vData = CreateBeveledBoxVertexData({ width: size.x, height: size.y, depth: size.z });
        vData.applyToMesh(this);

        this.size.copyFrom(size);
        const body = new PhysicsBody(this, PhysicsMotionType.DYNAMIC, false, this.game.scene);
        body.setMassProperties({
            mass: this.mass
        });
        body.shape = new PhysicsShapeBox(
            new Vector3(0, 0, 0),
            Quaternion.Identity(),
            this.size,
            this.game.scene
        );
        body.shape.material = {friction: 0.4, restitution: 0.5};
        
        this.game.scene.onBeforeRenderObservable.add(this._update);
    }

    private _update = () => {
        if (this.position.y < -10) {
            this.game.scene.onBeforeRenderObservable.removeCallback(this._update);
            this.dispose();
        }
    }
    
    public async flash(color: Color3, count: number = 4): Promise<void> {
        for (let i = 0; i < count; i++) {
            BaseMaterials.MakeOutlineWithChild(this, 0.05, color.r, color.g, color.b);
            await Wait(150);
            BaseMaterials.MakeOutlineWithChild(this);
            await Wait(150);
        }
    }

    public dispose(): void {
        this.game.blocks.delete(this);
        super.dispose();
    }
}