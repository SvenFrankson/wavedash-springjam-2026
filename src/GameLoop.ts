import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Block } from "./Block";
import { Game } from "./Game";
import { Pet } from "./Pets";
import { RandomThankYou, ToonSoundType, Wait } from "./ToonSound";

export class GameLoop {

    public state: number = 0;

    constructor(public game: Game) {
        document.getElementById("next-btn")?.addEventListener("click", () => {
            if (this.state === 1) {
                this.state = 2;
            }
        });
    }

    private _updating = false;
    public update = async () => {
        console.log(this.state);
        if (this._updating || this.state === -1) {
            return;
        }
        this._updating = true;
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
        }
        else if (this.state === 4) {
            let gain = 0;
            for (let pet of this.game.pets) {
                if (pet && !pet.isDisposed()) {
                    gain += 5 + Math.floor(pet.position.y / 10);
                    this.game.toonSoundManager.start({
                        text: RandomThankYou(),
                        pos: pet.position.add(new Vector3(Pet.PetSize * 0.5, Pet.PetSize * 0.5, 0)),
                        color: "#FFFFFF",
                        size: 0.5,
                        duration: 1,
                        type: ToonSoundType.Poc
                    });
                    await Wait(300);
                }
            }
            await Wait(300);
            this.game.score += gain;
            this.state = 5;
        }
        else if (this.state === 5) {
            Block.Width *= 0.9;
            Block.MaterialIndex++;
            this.game.level++;
            this.state = 0;
        }
        this._updating = false;
    }
}