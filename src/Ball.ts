import { Color3, CreateBoxVertexData, CreateSphereVertexData, Mesh, MeshBuilder, PhysicsBody, PhysicsMotionType, PhysicsShapeBox, PhysicsShapeSphere, Quaternion, SceneLoader, StandardMaterial, Texture, Vector3, VertexData } from "@babylonjs/core";
import { ScaleVertexDataInPlace } from "babylonjs-tiaratumgames-tools";
import { Game } from "./Game";
import { BaseMaterials } from "./BaseMaterials";
import { CreateBeveledBoxVertexData } from "babylonjs-extra-meshes-kit";

export class Ball extends Mesh {

    private _lifetime = 0;
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
        body.shape.material = {friction: 0.1, restitution: 0.9};

        this.game.scene.onBeforeRenderObservable.add(this._update);
    }

    private _update = () => {
        this._lifetime += this.game.scene.getEngine().getDeltaTime() / 1000;
        if (this._lifetime > 3) {
            let f = this.position.clone();
            f.x = 0;
            f.y = 0;
            f.normalize().scaleInPlace(0.2 * (this._lifetime - 3));
            this.physicsBody?.applyForce(f, Vector3.Zero());
        }
        if (this._lifetime > 10) {
            this.game.scene.onBeforeRenderObservable.removeCallback(this._update);
            this.dispose();
        }
    }
}