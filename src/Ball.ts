import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CreateSphereVertexData } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { PhysicsMotionType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeSphere } from "@babylonjs/core/Physics/v2/physicsShape";
import { Game } from "./Game";
import { BaseMaterials } from "./BaseMaterials";

export class Ball extends Mesh {

    public duration: number = 7;
    private _lifetime = 0;
    public get timeLeft(): number {
        return Math.max(0, this.duration - this._lifetime);
    }

    public radius: number = 0.5;
    public density: number = 0.5;
    public get mass() {
        return 4 / 3 * Math.PI * this.radius * this.radius * this.radius * this.density;
    }

    constructor(public petName: string, public game: Game) {
        super(petName);
        this.game.balls.add(this);
        let r = Math.random();
        if (r < 0.33) {
            this.material = this.game.baseMaterials.red;
        }
        else if (r < 0.66) {
            this.material = this.game.baseMaterials.black;
        }
        else {
            this.material = this.game.baseMaterials.blue;
        }
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
        body.shape.material = {friction: 0.1, restitution: 1};

        this.game.scene.onBeforeRenderObservable.add(this._update);
    }

    private _update = () => {
        this._lifetime += this.game.scene.getEngine().getDeltaTime() / 1000;
        if (this._lifetime > this.duration * 0.4) {
            let f = this.position.clone();
            f.y = 0;
            f.x += (Math.random() - 0.5) * 2;
            f.y = - f.length() * 0.5;
            f.z += (Math.random() - 0.5) * 2;
            f.normalize().scaleInPlace(0.2 * (this._lifetime - this.duration * 0.4));
            this.physicsBody?.applyForce(f, Vector3.Zero());
        }
        if (this._lifetime > this.duration) {
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