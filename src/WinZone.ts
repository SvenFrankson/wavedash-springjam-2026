import { Mesh } from "@babylonjs/core";
import { Game } from "./Game";
import { CreateBeveledBoxVertexData } from "babylonjs-extra-meshes-kit";
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
        this.visibility = 0.3;
        this.material = this.game.baseMaterials.yellow;
    }

    public dispose(): void {
        super.dispose();
        this.game.winzones.delete(this);
        if (this.pet && !this.pet.isDisposed()) {
            this.pet.dispose();
        }
    }
}