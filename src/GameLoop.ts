import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Block } from "./Block";
import { Game } from "./Game";
import { Pet } from "./Pets";
import { RandomThankYou, ToonSoundType, Wait } from "./ToonSound";
import { USE_WAVEDASH_SDK, Wavedash } from "./Index";

var tooltips: string[] = [];
tooltips[0] = "- Hello ! Welcome to Animal Shelter :)";
tooltips[1] = "- Please, help : Build a shelter before the rain !";
tooltips[2] = "- Press GO when you think the shelter is ready :)";
tooltips[3] = "- The shelter must help me stay in my zone !";
tooltips[4] = "- You can drag and drop existing blocks to make a shelter !";
tooltips[5] = "- The higher we are sheltered, the more points we will give you !";
tooltips[6] = "- The island seems to cluttered ? Toss some blocks away !";

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

export class GameLoop {

    public state: number = 7;

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

    private _updating = false;
    public update = async () => {
        if (this._updating || this.state === -1) {
            return;
        }
        this._updating = true;
        
        this._tipUpdate();

        if (this.state === 0) {
            this.game.generateRandomPets();
            this.state = 1;
        }
        else if (this.state === 1) {
            
        }
        else if (this.state === 2) {
            this.game.pets.forEach(pet => pet.enablePhysics());
            this.game.generateRandomBalls();
            this.state = -1;
            setTimeout(() => {
                this.state = 3;
            }, 2000);
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
            this.game.hideUI();
        }
        this._updating = false;
    }
}