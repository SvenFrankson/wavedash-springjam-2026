import { Vector3, Mesh, DynamicTexture, CreateGroundVertexData, Quaternion, StandardMaterial, Axis } from "@babylonjs/core";
import { Game } from "./Game";
import { AnimationFactory, MinMax, QuaternionFromYZAxisToRef } from "babylonjs-tiaratumgames-tools";
import { Easing } from "./Easing";

export async function Wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

var ThankYous = [
    "THANKS !",
    "MERCI !",
    "DANKE !",
    "GRACIAS !",
    "GRAZIE !",
    "ARIGATO !",
    "XIE XIE !",
    "SPASIBO !",
    "OBRIGADO !"
];
export function RandomThankYou(): string {
    return ThankYous[Math.floor(Math.random() * ThankYous.length)];
}

export enum ToonSoundType {
    Poc,
    Rumble
}

export interface IToonSoundProp {
    text?: string,
    texts?: string[],
    pos: Vector3,
    color: string,
    size: number,
    duration: number,
    type: ToonSoundType
}

export class ToonSound extends Mesh {

    public dynamicTexture: DynamicTexture;
    public animateVisibility = AnimationFactory.EmptyNumberCallback;

    private _timer: number = 0;
    public get active(): boolean {
        return this.isVisible;
    }
    public soundProp: IToonSoundProp | null = null;
    public get scale(): number {
        return this.scaling.x;
    }
    public set scale(v: number) {
        this.scaling.copyFromFloats(v, v, v);
    }

    constructor(
        public game: Game
    ) {
        super("haiku");
        CreateGroundVertexData({ width: 5, height: 1 }).applyToMesh(this);
        this.renderingGroupId = 1;
        this.rotationQuaternion = Quaternion.Identity();
        this.isVisible = false;

        let haikuMaterial = new StandardMaterial("toon-sound-material");
        this.dynamicTexture = new DynamicTexture("toon-sound-texture", { width: 200, height: 40 });
        this.dynamicTexture.hasAlpha = true;
        haikuMaterial.diffuseTexture = this.dynamicTexture;
        haikuMaterial.emissiveTexture = this.dynamicTexture;
        haikuMaterial.emissiveColor.copyFromFloats(1, 1, 1);
        haikuMaterial.specularColor.copyFromFloats(0, 0, 0);
        haikuMaterial.useAlphaFromDiffuseTexture = true;
        this.material = haikuMaterial;

        this.animateVisibility = AnimationFactory.CreateNumber(this, this, "visibility");
    }

    public start(soundProps: IToonSoundProp): void {
        this.soundProp = soundProps;

        if (this.soundProp.text) {
            this.writeText(this.soundProp.text);
        }
        else if (this.soundProp.texts) {
            this.writeText(this.soundProp.texts[0]);
            this._lastDrawnTextIndex = 0;
        }

        this.position.copyFrom(this.soundProp.pos);
        this.rotDir = ((this.soundProp.pos.x - this.game.camera.target.x) > 0) ? 1 : - 1;

        this._timer = 0;
        this.scale = 0;
        this.isVisible = true;
    }

    public writeText(text: string): void {
        if (this.soundProp) {
            let context = this.dynamicTexture.getContext();
            context.clearRect(0, 0, 200, 40);

            context.font = "24px JungleFever";
            let l = context.measureText(text).width;

            context.lineWidth = 4;
            context.strokeStyle = "black";
            context.strokeText(text, 100 - l * 0.5, 34);

            context.fillStyle = this.soundProp.color;
            context.fillText(text, 100 - l * 0.5, 34);

            this.dynamicTexture.update();
        }
    }

    public rotDir: number = 1;
    private _lastDrawnTextIndex: number = 0;
    private _dir: Vector3 = Vector3.Up();
    public update(dt: number): void {
        if (this.soundProp) {
            this._timer += dt;
            if (this._timer >= this.soundProp.duration) {
                this.isVisible = false;
            }
            else {
                if (this.soundProp.texts) {
                    let textIndex = Math.floor(this._timer / this.soundProp.duration * this.soundProp.texts.length);
                    if (textIndex != this._lastDrawnTextIndex) {
                        this.writeText(this.soundProp.texts[textIndex]);
                        this._lastDrawnTextIndex = textIndex;
                    }
                }
                if (this.soundProp.type === ToonSoundType.Poc) {
                    let fScale = 4 * this._timer / this.soundProp.duration;
                    fScale = MinMax(fScale, 0, 1);
                    this.scale = fScale * this.soundProp.size;

                    let fPos = 2 * this._timer / this.soundProp.duration;
                    fPos = MinMax(fPos, 0, 1);
                    fPos = Easing.easeOutSine(fPos);
                    this.position.copyFrom(this.soundProp.pos);
                    this.position.x += fPos * this.rotDir * this.soundProp.size * 0.5;
                    this.position.y += fPos * this.soundProp.size * 0.5;

                    this._dir.copyFrom(this.game.camera.globalPosition).subtractInPlace(this.position);
                    QuaternionFromYZAxisToRef(this._dir, Axis.Y.add(Axis.X.scale(0.1 * fPos * this.rotDir)), this.rotationQuaternion!);

                    this.visibility = 1;
                }
                else if (this.soundProp.type === ToonSoundType.Rumble) {
                    this._dir.copyFrom(this.game.camera.globalPosition).subtractInPlace(this.position);
                    QuaternionFromYZAxisToRef(this._dir, Axis.Z.add(Axis.X.scale(0.1 * Math.sin(4 * 2 * Math.PI * this._timer))), this.rotationQuaternion!);

                    let f = 4 * this._timer / this.soundProp.duration;
                    f = MinMax(f, 0, 1);
                    f = Easing.easeOutCubic(f);
                    this.scale = f * this.soundProp.size;
                    this.position.copyFrom(this.soundProp.pos);
                    this.position.y += f * 0.5 + 0.05 * Math.sin(6 * 2 * Math.PI * this._timer);
        
                    this.visibility = 1;
                }
            }
        }
        
    }
}

export class ToonSoundManager {
    
    public sounds: ToonSound[] = [];

    constructor(
        public game: Game
    ) {
        this.sounds = [];
        for (let i = 0; i < 10; i++) {
            this.sounds[i] = new ToonSound(this.game);
        }
    }

    public start(soundProps: IToonSoundProp): void {
        for (let i = 0; i < 10; i++) {
            if (!this.sounds[i].active) {
                this.sounds[i].start(soundProps);
                return;
            }
        }
    }

    public update(dt: number): void {
        for (let i = 0; i < 10; i++) {
            if (this.sounds[i].active) {
                this.sounds[i].update(dt);
            }
        }
    }
}