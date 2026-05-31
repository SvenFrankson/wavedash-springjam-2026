import { Color3, CreateBoxVertexData, CreateSphereVertexData, Mesh, MeshBuilder, PhysicsBody, PhysicsMotionType, PhysicsShapeBox, PhysicsShapeSphere, Quaternion, SceneLoader, StandardMaterial, Texture, Vector3, VertexData } from "@babylonjs/core";
import { ScaleVertexDataInPlace } from "babylonjs-tiaratumgames-tools";
import { Game } from "./Game";
import { BaseMaterials } from "./BaseMaterials";
import { CreateBeveledBoxVertexData } from "babylonjs-extra-meshes-kit";
import { Pet } from "./Pets";

export class WinZone extends Mesh {

    public pets: Pet[] = [];

    constructor(public min: Vector3, public max: Vector3, public game: Game) {
        super("winZone");
        CreateBeveledBoxVertexData({ width: this.max.x - this.min.x, height: this.max.y - this.min.y, depth: 0.5 }).applyToMesh(this);
        this.position.copyFrom(this.min).addInPlace(this.max).scaleInPlace(0.5);
        this.position.z = 0.25;
        this.visibility = 0.3;
        this.material = this.game.baseMaterials.yellow;
    }

    private _update = () => {
        
    }
}