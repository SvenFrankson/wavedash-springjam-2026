import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Game } from "./Game";
import { CreateBeveledBoxVertexData } from "babylonjs-tiaratumgames-tools";
import { Pet } from "./Pets";

export class WinZone extends Mesh {

    public halfSize: number = 1;

    constructor(public pet: Pet, public game: Game) {
        super("winZone");
        pet.winzone = this;
        this.game.winzones.add(this);
        CreateBeveledBoxVertexData({ width: this.halfSize * 2, height: this.halfSize * 2, depth: 0.5 }).applyToMesh(this);
        this.position.copyFrom(this.pet.position);
        this.position.z = 0.25;
        this.visibility = 0.2;
        this.material = this.game.baseMaterials.yellow;

        let c = new Color4(0.8, 1, 0.6, 1);
        let line = MeshBuilder.CreateLines("winZoneLine", {
            points: [
                new Vector3(-this.halfSize + 0.1, -this.halfSize, 0),
                new Vector3(-this.halfSize, -this.halfSize + 0.1, 0),
                new Vector3(-this.halfSize, this.halfSize - 0.1, 0),
                new Vector3(-this.halfSize + 0.1, this.halfSize, 0),
                new Vector3(this.halfSize - 0.1, this.halfSize, 0),
                new Vector3(this.halfSize, this.halfSize - 0.1, 0),
                new Vector3(this.halfSize, -this.halfSize + 0.1, 0),
                new Vector3(this.halfSize - 0.1, -this.halfSize, 0),
            ],
            colors: [
                c, c, c, c, c, c, c, c
            ]
        });
        line.parent = this;
    }

    public dispose(): void {
        super.dispose();
        this.game.winzones.delete(this);
        if (this.pet && !this.pet.isDisposed()) {
            this.pet.dispose();
        }
    }
}