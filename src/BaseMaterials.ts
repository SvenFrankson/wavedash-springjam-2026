import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Rendering/outlineRenderer";
import type { Game } from "./Game";

export class BaseMaterials {

    public game: Game;
    public materials: StandardMaterial[] = [];
    public black: StandardMaterial;
    public white: StandardMaterial;
    public ultraWhite: StandardMaterial;
    public red: StandardMaterial;
    public orange: StandardMaterial;
    public yellow: StandardMaterial;
    public green: StandardMaterial;
    public teal: StandardMaterial;
    public blue: StandardMaterial;
    public marine: StandardMaterial;
    public pink: StandardMaterial;

    constructor(game: Game) {
        this.game = game;

        this.black = this._makeMaterial("black", "#282a33");
        this.white = this._makeMaterial("white", "#ffffff");
        this.red = this._makeMaterial("red", "#e6261f");
        this.orange = this._makeMaterial("orange", "#eb7532");
        this.yellow = this._makeMaterial("yellow", "#f7d038");
        this.green = this._makeMaterial("green", "#7de048");
        this.teal = this._makeMaterial("teal", "#49da9a");
        this.blue = this._makeMaterial("blue", "#34bbe6");
        this.marine = this._makeMaterial("marine", "#4355db");
        this.pink = this._makeMaterial("pink", "#d23be7");
        this.ultraWhite = this._makeMaterial("ultraWhite", "#ffffff");
        this.ultraWhite.emissiveColor.copyFromFloats(1, 1, 1);

        this.materials = [
            this.red,
            this.orange,
            this.yellow,
            this.green,
            this.teal,
            this.blue,
            this.marine,
            this.pink,
            this.white
        ];
    }

    public static MakeOutline(m: Mesh, w: number = 0.02, r: number = 0, g: number = 0, b: number = 0): void {
        m.renderOutline = true;
        m.outlineWidth = w;
        m.outlineColor.copyFromFloats(r, g, b);
        
    }

    public static MakeOutlineWithChild(m: Mesh, w: number = 0.02, r: number = 0, g: number = 0, b: number = 0): void {
        m.renderOutline = true;
        m.outlineWidth = w;
        m.outlineColor.copyFromFloats(r, g, b);
        m.getChildMeshes().forEach(child => {
            if (child instanceof Mesh) {
                BaseMaterials.MakeOutlineWithChild(child, w, r, g, b);
            }
        });
    }

    private _makeMaterial(name: string, hexColor: string): StandardMaterial {
        const m = new StandardMaterial(name);
        m.diffuseColor = Color3.FromHexString(hexColor);
        m.emissiveColor.copyFromFloats(0.2, 0.2, 0.2);
        m.specularColor.copyFromFloats(0, 0, 0);

        return m;
    }
}