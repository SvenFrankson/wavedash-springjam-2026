import { Color3, Mesh, StandardMaterial } from "@babylonjs/core";
import type { Game } from "./Game";

export class BaseMaterials {

    public game: Game;
    public materials: StandardMaterial[] = [];
    public black: StandardMaterial;
    public white: StandardMaterial;
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

    public static MakeOutline(m: Mesh): void {
        m.renderOutline = true;
        m.outlineWidth = 0.01;
        m.outlineColor.copyFromFloats(0, 0, 0);
    }

    private _makeMaterial(name: string, hexColor: string): StandardMaterial {
        const m = new StandardMaterial(name);
        m.diffuseColor = Color3.FromHexString(hexColor);
        m.emissiveColor.copyFromFloats(0.2, 0.2, 0.2);
        m.specularColor.copyFromFloats(0, 0, 0);

        return m;
    }
}