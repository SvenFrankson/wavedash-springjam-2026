import { Color3, CreateBoxVertexData, CreateSphereVertexData, Mesh, MeshBuilder, PhysicsBody, PhysicsMotionType, PhysicsShapeBox, PhysicsShapeSphere, Quaternion, SceneLoader, StandardMaterial, Texture, Vector3, VertexData } from "@babylonjs/core";
import { ScaleVertexDataInPlace } from "babylonjs-tiaratumgames-tools";
import { Game } from "./Game";
import { BaseMaterials } from "./BaseMaterials";
import { CreateBeveledBoxVertexData } from "babylonjs-extra-meshes-kit";

export class Ball extends Mesh {

    public radius: number = 0.5;
    public density: number = 0.5;
    public get mass() {
        return 4 / 3 * Math.PI * this.radius * this.radius * this.radius * this.density;
    }

    constructor(public petName: string, public game: Game) {
        super(petName);
        this.material = this.game.baseMaterials.black;
        BaseMaterials.MakeOutline(this);
    }

    public init(radius: number): void {
        let vData = CreateSphereVertexData({ diameter: 2 * radius });
        vData.applyToMesh(this);

        this.radius = radius;
        const body = new PhysicsBody(this, PhysicsMotionType.DYNAMIC, false, this.game.scene);
        body.setMassProperties({
            mass: this.mass
        });
        body.shape = new PhysicsShapeSphere(
            new Vector3(0, 0, 0),
            this.radius,
            this.game.scene
        );
        body.shape.material = {friction: 0.1, restitution: 0.5};
    }
}