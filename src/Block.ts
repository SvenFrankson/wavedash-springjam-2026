import { Mesh, PhysicsBody, PhysicsMotionType, PhysicsShapeBox, Quaternion, Vector3 } from "@babylonjs/core";
import { Game } from "./Game";
import { BaseMaterials } from "./BaseMaterials";
import { CreateBeveledBoxVertexData } from "babylonjs-extra-meshes-kit";

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
}