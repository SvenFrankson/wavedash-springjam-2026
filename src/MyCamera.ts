import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Game } from "./Game";

export class MyCamera extends ArcRotateCamera {

    public zoneMin: Vector3 = new Vector3(-1, -1, 0);
    public zoneMax: Vector3 = new Vector3(1, 1, 0);

    private _targetRadius: number = 20;
    private _targetTarget: Vector3 = Vector3.Zero();

    constructor(name: string, alpha: number, beta: number, radius: number, target: Vector3, public game: Game) {
        super(name, alpha, beta, radius, target, game.scene);
        this.zoneZoom();
        this.game.scene.onBeforeRenderObservable.add(this._update);
    }

    public getCameraMinFOV(): number {
        return Math.min(this.fov, this.getCameraHorizontalFOV());
    }

    public getCameraHorizontalFOV(): number {
        let ratio = this.game.engine.getRenderWidth() / this.game.engine.getRenderHeight();
        return 2 * Math.atan(ratio * Math.tan(this.fov / 2));
    }

    public updateZone(): void {
        this.zoneMin.x += 0.1;
        this.zoneMin.x = Math.min(this.zoneMin.x, -1);

        this.zoneMax.x -= 0.1;
        this.zoneMax.x = Math.max(this.zoneMax.x, 1);

        this.zoneMax.y -= 0.1;
        this.zoneMax.y = Math.max(this.zoneMax.y, 1);

        for (let pet of this.game.pets) {
            this.zoneMin.x = Math.min(this.zoneMin.x, pet.position.x + 4);
            this.zoneMax.x = Math.max(this.zoneMax.x, pet.position.x + 4);
            this.zoneMax.y = Math.max(this.zoneMax.y, pet.position.y + 4);
        }
    }

    public zoneZoom(): void {
        let horizontalFOV = this.getCameraHorizontalFOV();
        let verticalFOV = this.fov;
        let horizontalRadius = (this.zoneMax.x - this.zoneMin.x) / (2 * Math.tan(horizontalFOV / 2));
        let verticalRadius = (this.zoneMax.y - this.zoneMin.y) / (2 * Math.tan(verticalFOV / 2));
        let radius = Math.max(horizontalRadius, verticalRadius);
        this._targetTarget.copyFromFloats(0, (this.zoneMin.y + this.zoneMax.y) / 2, 0);
        this._targetRadius = radius;
    }

    private _update = () => {
        this.updateZone();
        this.zoneZoom();
        Vector3.LerpToRef(this.target, this._targetTarget, 0.01, this.target);
        this.radius += (this._targetRadius - this.radius) * 0.01;
    }
}