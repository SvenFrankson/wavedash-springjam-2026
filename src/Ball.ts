import { CreateSphereVertexData, Mesh, PhysicsBody, PhysicsMotionType, PhysicsShapeSphere, Vector3 } from "@babylonjs/core";
import { Game } from "./Game";
import { BaseMaterials } from "./BaseMaterials";

export class Ball extends Mesh {

    private _lifetime = 0;
    public radius: number = 0.5;
    public density: number = 0.5;
    public get mass() {
        return 4 / 3 * Math.PI * this.radius * this.radius * this.radius * this.density;
    }

    constructor(public petName: string, public game: Game) {
        super(petName);
        this.game.balls.add(this);
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
        body.shape.material = {friction: 0.1, restitution: 0.7};

        this.game.scene.onBeforeRenderObservable.add(this._update);
    }

    private _update = () => {
        this._lifetime += this.game.scene.getEngine().getDeltaTime() / 1000;
        if (this._lifetime > 3) {
            let f = this.position.clone();
            f.y = 0;
            f.normalize().scaleInPlace(0.2 * (this._lifetime - 3));
            this.physicsBody?.applyForce(f, Vector3.Zero());
        }
        if (this._lifetime > 8) {
            this.dispose();
        }
        if (this.position.y < -5) {
            this.dispose();
        }
    }

    public dispose(): void {
        super.dispose();
        this.game.scene.onBeforeRenderObservable.removeCallback(this._update);
        this.game.balls.delete(this);
    }
}