import { Color3, CreateBoxVertexData, Mesh, MeshBuilder, PhysicsBody, PhysicsMotionType, PhysicsShapeBox, Quaternion, SceneLoader, StandardMaterial, Texture, Vector3, VertexData } from "@babylonjs/core";
import { ScaleVertexDataInPlace } from "babylonjs-tiaratumgames-tools";
import { Game } from "./Game";
import { BaseMaterials } from "./BaseMaterials";
import { CreateBeveledBoxVertexData } from "babylonjs-extra-meshes-kit";

export class Block extends Mesh {

    public size: Vector3 = Vector3.One();
    public density: number = 0.5;
    public get mass() {
        return this.size.x * this.size.y * this.size.z * this.density;
    }

    constructor(public petName: string, public game: Game) {
        super(petName);
        this.material = this.game.baseMaterials.red;
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
        body.shape.material = {friction: 0.2, restitution: 0.3};
    }
}