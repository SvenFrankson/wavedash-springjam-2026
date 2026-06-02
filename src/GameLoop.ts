import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Block } from "./Block";
import { Game } from "./Game";
import { Pet } from "./Pets";
import { RandomThankYou, ToonSoundType, Wait } from "./ToonSound";
import { USE_WAVEDASH_SDK, Wavedash } from "./Index";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh.pure";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { CreatePlaneVertexData } from "@babylonjs/core/Meshes/Builders/planeBuilder.pure";
import { AnimationFactory, QuaternionFromYZAxis, QuaternionFromZYAxis } from "babylonjs-tiaratumgames-tools";
import { Easing } from "./Easing";

var tooltips: string[] = [];
tooltips[0] = "- Hello ! Welcome to Animal Shelter :)";
tooltips[1] = "- Please, help : Build a shelter before the rain !";
tooltips[2] = "Tips : Press NEXT when you think the shelter is ready :)";
tooltips[3] = "- The shelter must help me stay in my zone !";
tooltips[4] = "Tips : You can drag and drop existing blocks to make a shelter !";
tooltips[5] = "- The higher we are sheltered, the more points we will give you !";
tooltips[6] = "Tips : The island seems to cluttered ? Toss some blocks away !";

var randomTips = [
    "- You saved our lives we are eternally grateful !",
    "- And I think to myself, what a wonderful world !",
    "- Life, uh, finds a way...",
    "- Apes, Together, Strong !",
    "- Help us, you're our only hope !",
    "- Building a better future sheltered.",
    "- Revolutionizing safety for uncertain future.",
    "- Safety is everyone's job !"
]

var tipMinMaxIndexes = [
    [0, 2],
    [1, 3],
    [1, 4],
    [2, 5],
    [3, 6],
    [4, 6],
    [4, 6],
    [4, 6],
    [4, 6],
    [4, 6],
    [4, 6],
    [4, 6],
    [4, 6],
    [4, 6],
    [4, 6],
    [4, 6],
    [4, 6],
    [4, 6]
];

var stateTexts = [
    "",
    "Build a Shelter !",
    "Wait for the Storm to Pass !",
    "Wait for the Storm to Pass !",
    "Calculating Score...",
    "",
    "",
    "",
    "Game Over"
];

export class DrawHint extends Mesh {
    
    public startDot: Mesh;
    public body: Mesh;
    public endDot: Mesh;

    public startPos: Vector3 = Vector3.Zero();
    public endPos: Vector3 = Vector3.One();

    constructor(public game: Game) {
        super("drawHint", game.scene);
        this.startDot = MeshBuilder.CreateDisc("startDot", { radius: 0.1 }, game.scene);
        this.endDot = MeshBuilder.CreateDisc("endDot", { radius: 0.15 }, game.scene);
        this.body = new Mesh("body", game.scene);
        this.startDot.material = game.baseMaterials.ultraWhite;
        this.endDot.material = game.baseMaterials.ultraWhite;
        this.body.material = game.baseMaterials.ultraWhite;
    }

    public async run(): Promise<void> {
        this.startDot.position.copyFrom(this.startPos);
        this.endDot.position.copyFrom(this.startPos);
        CreatePlaneVertexData({
            width: 0.2,
            height: Vector3.Distance(this.startPos, this.endPos)
        }).applyToMesh(this.body);
        
        let endDotAnim = AnimationFactory.CreateVector3(this, this.endDot, "position", this._update);
        await endDotAnim(this.endPos, 1.5, Easing.easeInOutSine);
    }

    private _update = () => {
        if (this.isDisposed()) {
            return;
        }
        CreatePlaneVertexData({
            width: 0.2,
            height: Vector3.Distance(this.startDot.position, this.endDot.position)
        }).applyToMesh(this.body);
        this.body.position.copyFrom(this.startDot.position).addInPlace(this.endDot.position).scaleInPlace(0.5);
        this.body.rotationQuaternion = QuaternionFromYZAxis(this.endDot.position.subtract(this.startDot.position).normalize(), new Vector3(0, 0, 1));
    }

    public dispose(): void {
        super.dispose();
        this.startDot.dispose();
        this.body.dispose();
        this.endDot.dispose();
    }
}

export class GameLoop {

    private _state: number = 7;
    public get state(): number {
        return this._state;
    }
    public set state(value: number) {
        this._state = value;
        this.game.gameStateElement.textContent = stateTexts[value] || value.toString();
    }
    private _drawingHint: boolean = false;

    constructor(public game: Game) {
        this.game.goBtn.addEventListener("click", () => {
            if (this.state === 1) {
                this.state = 2;
            }
        });
    }

    public reset(): void {
        this.state = 0;
        this._tipIndex = -1;
        this._tipTimer = Infinity;
    }

    private _tipIndex = -1;
    private _tipTimer: number = Infinity;
    private _tipUpdate(): void {
        this._tipTimer += this.game.engine.getDeltaTime() / 1000;
        if (this._tipTimer > 6) {
            this._tipTimer = 0;
            let randomTipChance = Math.min((this.game.level - 2) / 10, 0.8);
            if (Math.random() < randomTipChance) {
                this.game.showTooltip(randomTips[Math.floor(Math.random() * randomTips.length)]);
            }
            else {
                this._tipIndex++;
                let indexes = tipMinMaxIndexes[this.game.level - 1] || [0, tooltips.length - 1];
                let tipIndex = indexes[0] + (this._tipIndex % (indexes[1] - indexes[0] + 1));
                this.game.showTooltip(tooltips[tipIndex]);
            }
        }
    }

    private _stateTimer: number = 0;
    private _updating = false;
    public update = async () => {
        let timer = document.querySelector("#game-state-timer") as HTMLDivElement;
        if (timer) {
            if (this.state === 1) {
                timer.textContent = this._stateTimer.toFixed(0);
                timer.style.display = "";
                this.game.goBtn.style.display = "";
            }
            else {
                timer.style.display = "none";
                this.game.goBtn.style.display = "none";
            }
        }
        
        if (this._updating || this.state === -1) {
            return;
        }
        this._updating = true;
        
        if (this.state < 6) {
            this._tipUpdate();
        }

        if (this.state === 0) {
            this.game.generateRandomPets();
            this.state = 1;
            this._stateTimer = 15;
        }
        else if (this.state === 1) {
            this._stateTimer -= this.game.engine.getDeltaTime() / 1000;
            if (this._stateTimer <= 0) {
                this.state = 2;
            }
            if (this.game.level === 1) {
                if (!this._drawingHint) {
                    this._drawingHint = true;
                    const [pet] = this.game.pets;
                    if (pet) {
                        let hint = new DrawHint(this.game);
                        hint.startPos.copyFrom(pet.position).addInPlace(new Vector3(Math.random() > 0.5 ? -1 : 1, 1, 0));
                        hint.endPos.copyFrom(hint.startPos).addInPlace(new Vector3(0, -1.3, 0));
                        hint.run().then(async () => {
                            await Wait(1500);
                            hint.dispose();
                            await Wait(2000);
                            this._drawingHint = false;
                        });
                    }
                }
            }
        }
        else if (this.state === 2) {
            this.game.pets.forEach(pet => pet.enablePhysics());
            this.game.generateRandomBalls();
            await Wait(2000);
            if (this.state === 2) {
                this.state = 3;
            }
        }
        else if (this.state === 3) {
            if (this.game.balls.size === 0) {
                this.state = 4;
            }
            await Wait(150);
        }
        else if (this.state === 4) {
            for (let pet of this.game.pets) {
                if (pet && !pet.isDisposed() && !pet.dying) {
                    pet.flash(new Color3(1, 1, 1), 3);
                    let petGain = 5 + Math.floor(pet.position.y);
                    this.game.toonSoundManager.start({
                        text: RandomThankYou(),
                        pos: pet.position.add(new Vector3(Pet.PetSize * 0.5, Pet.PetSize * 0.5, 0)),
                        color: "#FFFFFF",
                        size: 0.4,
                        duration: 1,
                        type: ToonSoundType.Poc
                    });
                    await Wait(150);
                    this.game.toonSoundManager.start({
                        text: "+ " + petGain.toFixed(0),
                        pos: pet.position.add(new Vector3(- Pet.PetSize * 0.5, Pet.PetSize * 0.5, 0)),
                        color: "#f7d038",
                        size: 0.8,
                        duration: 2,
                        type: ToonSoundType.Poc
                    });
                    this.game.audioEngine?.unlockAsync().then(() => {
                        this.game.starSound?.play();
                    });
                    this.game.score += petGain;
                    await Wait(350);
                }
            }
            if (USE_WAVEDASH_SDK) {
                for (let n = 1; n <= this.game.pets.size; n++) {
                    let achievement = "SAVE_" + n.toFixed(0) + "_ANIMALS";
                    Wavedash.setAchievement(achievement, true);
                }
                const leaderboard = await Wavedash.getOrCreateLeaderboard("HIGHSCORE", Wavedash.LeaderboardSortOrder.DESC, Wavedash.LeaderboardDisplayType.NUMERIC);
                const leaderboardId = leaderboard.success ? leaderboard.data.id : null;

                if (leaderboardId) {
                    await Wavedash.uploadLeaderboardScore(leaderboardId, this.game.score, true);
                }
            }
            await Wait(300);
            this.state = 5;
        }
        else if (this.state === 5) {
            Block.Width *= 0.98;
            Block.MaterialIndex++;
            this.game.level++;
            this.state = 0;
            this._tipIndex = -1;
            this._tipTimer = Infinity;
        }
        else if (this.state === 6) {
            this.game.showTooltip("- Game Over ! Thanks for playing !");
            this.state = 7;
            this.game.newGameBtn.style.display = "block";
            //this.game.hideUI();
        }
        this._updating = false;
    }
}