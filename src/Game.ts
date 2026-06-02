import "@babylonjs/core/Culling/ray";
import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Ray } from "@babylonjs/core/Culling/ray";
import { AudioEngineV2, CreateSoundAsync } from "@babylonjs/core/AudioV2/abstractAudio/audioEngineV2";
import { StaticSound } from "@babylonjs/core/AudioV2/abstractAudio/staticSound";
import { CreateAudioEngineAsync } from "@babylonjs/core/AudioV2/webAudio/webAudioEngine";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { HavokPlugin } from "@babylonjs/core/Physics";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { PhysicsMotionType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeCylinder } from "@babylonjs/core/Physics/v2/physicsShape";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import HavokPhysics  from "@babylonjs/havok";
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import { Pet, PetHitBox, PETS } from "./Pets";
import { BaseMaterials } from "./BaseMaterials";
import { PlayerControl } from "./PlayerControl";
import { Block } from "./Block";
import { Ball } from "./Ball";
import { WinZone } from "./WinZone";
import { GameLoop } from "./GameLoop";
import { ToonSoundManager } from "./ToonSound";
import { CreateBeveledCylinder, CreateBeveledCylinderVertexData } from "babylonjs-tiaratumgames-tools";
import { MyCamera } from "./MyCamera";
registerBuiltInLoaders();

export class Game {

    public static Instance: Game;

    public engine: Engine;
    public audioEngine: AudioEngineV2 | null = null;
    public scene: Scene;
    public camera: ArcRotateCamera;
    public skybox: Mesh;
    public ground: Mesh | null = null;
    public playerControl: PlayerControl;

    public baseMaterials: BaseMaterials;
    public toonSoundManager: ToonSoundManager;

    public newGameBtn: HTMLButtonElement;
    public scoreElement: HTMLDivElement;
    public tooltipElement: HTMLDivElement;
    public goBtn: HTMLButtonElement;
    public livesElement: HTMLDivElement;
    public gameStateElement: HTMLDivElement;

    public level: number = 1;
    private _score: number = 0;
    private _lives: number = 0;
    public gameLoop: GameLoop;
    public blocks: Set<Block> = new Set();
    public pets: Set<Pet> = new Set();
    public winzones: Set<WinZone> = new Set();
    public balls: Set<Ball> = new Set();

    public ambientMusic: HTMLAudioElement | null = null;
    public createSound: StaticSound | null = null;
    public starSound: StaticSound | null = null;

    constructor(public canvas: HTMLCanvasElement) {
        Game.Instance = this;

        this.engine = new Engine(canvas, true, undefined, false)
        this.scene = new Scene(this.engine);
        this.scene.clearColor.set(0, 0, 1, 1);
        this.camera = new MyCamera("camera", -Math.PI / 2, 0.48 * Math.PI, 22, new Vector3(0, 10, 0), this);
        //this.camera.attachControl(canvas, true);
        let light = new HemisphericLight("light", new Vector3(1, 3, -2), this.scene);
        light.direction = (new Vector3(2, 1, -1.5)).normalize();
        light.intensity = 0.7;
		Engine.ShadersRepository = "./public/shaders/";

        this.skybox = MeshBuilder.CreateSphere("room-skybox", { diameter: 1000, sideOrientation: Mesh.BACKSIDE, segments: 4 }, this.scene);
        this.skybox.rotation.y = Math.PI;
        let skyboxMaterial = new StandardMaterial("room-skybox-material", this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.diffuseColor.copyFromFloats(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        let skyTexture = new Texture("skyboxes/sky_toon.jpg", this.scene);
        skyboxMaterial.diffuseTexture = skyTexture;
        skyboxMaterial.emissiveTexture = skyTexture;
        this.skybox.material = skyboxMaterial;

        this.baseMaterials = new BaseMaterials(this);
        this.toonSoundManager = new ToonSoundManager(this);

        this.newGameBtn = document.getElementById("newgame-btn") as HTMLButtonElement;
        this.newGameBtn.addEventListener("click", () => {
            this.reset();
            this.newGameBtn.style.display = "none";
        });
        this.scoreElement = document.getElementById("score") as HTMLDivElement;
        this.tooltipElement = document.getElementById("tooltip") as HTMLDivElement;
        this.livesElement = document.getElementById("lives") as HTMLDivElement;
        this.goBtn = document.getElementById("next-btn") as HTMLButtonElement;
        this.gameStateElement = document.getElementById("game-state") as HTMLDivElement;
        this.lives = 5;

        this.playerControl = new PlayerControl(this);

        this.gameLoop = new GameLoop(this);

        this.hideUI();

        this.ambientMusic = document.createElement("audio");
        this.ambientMusic.src = "./sounds/Origami.mp3";
        this.ambientMusic.loop = true;
        this.ambientMusic.volume = 0.2;
        
        let attempts = 0;
        let tryPlayMusic = () => {
            if (this.ambientMusic?.paused) {
                this.ambientMusic.play().catch(() => {
                    attempts++;
                    if (attempts < 5) {
                        setTimeout(tryPlayMusic, 1000);
                    }
                });
            }
        }
        tryPlayMusic();

        window.addEventListener("resize", () => {
            this.onResize();
        });
    }

    public async initAndStart(): Promise<void> {
        (async () => {
            this.audioEngine = await CreateAudioEngineAsync();
            this.createSound = await CreateSoundAsync("create-sound", "sounds/activate.mp3", { loop: false, autoplay: false, volume: 0.2 });
            this.starSound = await CreateSoundAsync("star-sound", "sounds/collect_star.mp3", { loop: false, autoplay: false, volume: 0.2 });
        })();
        await this.loadPhysics();
        await this.start();

        let N = PETS.length;
        for (let n = 0; n < N; n++) {
            setTimeout(() => {
                if (this.gameLoop.state === 7) {
                    let petName = PETS[n];
                    
                    let a = n / N * Math.PI * 2;
                    let x = Math.cos(a) * 10 * (Math.random() * 0.5 + 0.5);
                    let z = Math.sin(a) * 10 * (Math.random() * 0.5 + 0.5);

                    let pet = new Pet(petName, this);
                    pet.initialize();
                    pet.position.set(x, 0.5, z);
                }
            }, 20000 * Math.random());
        }
    }

    public async loadPhysics(): Promise<void> {
        const havokInstance = await HavokPhysics();

        // pass the engine to the plugin
        const hk = new HavokPlugin(true, havokInstance);
        // enable physics in the scene with a gravity
        this.scene.enablePhysics(new Vector3(0, -9.8, 0), hk);

        this.ground = new Mesh("ground", this.scene);
        this.ground.position.y = -0.5;

        let vertexData = CreateBeveledCylinderVertexData({ tessellation: 64, radius: 10, height: 1 });
        if (vertexData.uvs) {
            for (let i = 0; i < vertexData.positions!.length / 3; i++) {
                let x = vertexData.positions![i * 3];
                let z = vertexData.positions![i * 3 + 2];
                vertexData.uvs[i * 2] = x;
                vertexData.uvs[i * 2 + 1] = z;
            }
        }
        vertexData.applyToMesh(this.ground);
        BaseMaterials.MakeOutline(this.ground);

        const m = new StandardMaterial("grass");
        m.diffuseTexture = new Texture("textures/grass.jpg", this.scene);
        m.emissiveColor.copyFromFloats(0.2, 0.4, 0.3);
        m.specularColor.copyFromFloats(0, 0, 0);

        this.ground.material = m;

        const body = new PhysicsBody(this.ground, PhysicsMotionType.STATIC, false, this.scene);
        body.setMassProperties({
            mass: 0
        });
        body.shape = new PhysicsShapeCylinder(
            new Vector3(0, -0.5, 0),
            new Vector3(0, 0.5, 0),
            10,
            this.scene
        );
        body.shape.material = {friction: 0.2, restitution: 0.3};
    }

    public update = () => {
        this.pets.forEach(pet => {
            if (!pet.dying) {
                if (pet.winzone) {
                    if (Math.abs(pet.position.z) > 1) {
                        pet.kill();
                    }
                    let dx = pet.position.x - pet.winzone.position.x;
                    let dy = pet.position.y - pet.winzone.position.y;
                    if (Math.abs(dx) > pet.winzone.halfSize || Math.abs(dy) > pet.winzone.halfSize) {
                        pet.kill();
                    }
                }
            }
        });

        this.skybox.rotation.y += this.engine.getDeltaTime() / 100000;

        if (this.toonSoundManager) {
            this.toonSoundManager.update(this.scene.getEngine().getDeltaTime() / 1000);
        }
    }

    public generateRandomPets(n?: number): void {
        if (!(n! > 0)) {
            n = 1;
        }

        let maxDH = 0;
        if (this.pets.size > 0) {
            maxDH = Math.min(this.level * 0.2, 1);
        }
        let minX = -1;
        let maxX = 1;
        this.pets.forEach(pet => {
            minX = Math.min(minX, pet.position.x - 2);
            maxX = Math.max(maxX, pet.position.x + 2);
        });
        for (let i = 0; i < n!; i++) {
            let petName = PETS[Math.floor(Math.random() * PETS.length)];
            
            let x = Math.random() * (maxX - minX) + minX;
            let ray = new Ray(new Vector3(x, 20, 0), new Vector3(0, -1, 0));
            let pickResult = this.scene.pickWithRay(ray, (mesh) => { return mesh instanceof Block || mesh instanceof PetHitBox || mesh == this.ground || mesh instanceof WinZone });

            let pet = new Pet(petName, this);
            pet.initialize();
            if (pickResult?.hit) {
                pet.position.copyFrom(pickResult.pickedPoint!);
                pet.position.y += Pet.PetSize / 2 + 0.01 + maxDH * Math.random();
            }
            else {
                pet.position.set(x, Pet.PetSize / 2 + 0.01, 0);
            }
            pet.position.minimizeInPlace(new Vector3(9, this.playerControl.maxDrawY - 1, 0));
            pet.position.maximizeInPlace(new Vector3(-9, 0, 0));

            new WinZone(pet, this);
        }
    }

    public generateRandomBlocks(n?: number): void {
        if (!(n! > 0)) {
            n = 4;
        }
        for (let i = 0; i < n!; i++) {
            let s = Math.floor(Math.random() * 4) + 1;
            
            let block = new Block("block", this);
            block.position.x = - 11 - i;
            block.position.y = 0.5 + s / 2;

            block.init(new Vector3(Block.Width, s, Block.Depth));
        }
    }

    public generateRandomBalls(n?: number): void {
        if (!(n! > 0)) {
            n = 2 * this.level + 2;
        }
        for (let i = 0; i < n!; i++) {
            setTimeout(() => {
                let angle = Math.random() * Math.PI * 0.8 + Math.PI * 0.1;
                let x = Math.cos(angle) * 20;
                let y = Math.sin(angle) * 20;
                let ball = new Ball("ball", this);
                ball.position.x = x;
                ball.position.y = y;

                ball.init(0.15 + 0.25 * Math.random() * this.level / 8);

                let angle2 = angle + (Math.random() * 2 - 1) * Math.PI / 8;
                let x2 = Math.cos(angle2);
                let y2 = Math.sin(angle2);
                ball.physicsBody?.setLinearVelocity(new Vector3(- x2 * 15, - y2 * 15, 0));
            }, Math.random() * 2000);
        }
    }

    public async start(): Promise<void> {
        this.playerControl.canvas.addEventListener("pointerdown", this.playerControl.onPointerDown);
        this.playerControl.canvas.addEventListener("pointermove", this.playerControl.onPointerMove);
        this.playerControl.canvas.addEventListener("pointerup", this.playerControl.onPointerUp);

        this.scene.onBeforeRenderObservable.add(this.update);
        this.scene.onBeforeRenderObservable.add(this.gameLoop.update);
        this.scene.onBeforeRenderObservable.add(this.playerControl.update);

        

        this.engine.runRenderLoop(() => {
            this.scene.render()
        })
    }

    public get score(): number {
        return this._score;
    }
    public set score(value: number) {
        this._score = value;
        this.scoreElement.textContent = value.toString().padStart(5, '0');
    }

    public get lives(): number {
        return this._lives;
    }
    public set lives(value: number) {
        this._lives = value;
        let children = this.livesElement.children;
        for (let i = 0; i < children.length; i++) {
            let child = children[i] as HTMLElement;
            if (i < value) {
                child.style.display = "inline";
            }
            else {
                child.style.display = "none";
            }
        }
        if (this.lives < 0) {
            this.gameLoop.state = 6;
        }
    }

    public showTooltip(text: string): void {
        this.tooltipElement.textContent = text;
        this.tooltipElement.style.opacity = "1";
    }

    public reset(): void {
        for (let pet of this.pets) {
            pet.dispose();
        }
        for (let ball of this.balls) {
            ball.dispose();
        }
        for (let block of this.blocks) {
            block.dispose();
        }
        this.score = 0;
        this.lives = 5;
        this.level = 1;
        Block.Width = 0.4;
        Block.MaterialIndex = 0;
        this.showUI();
        this.gameLoop.reset();
    }

    public showUI(): void {
        this.scoreElement.style.display = "";
        this.livesElement.style.display = "";
        this.goBtn.style.display = "";
        this.tooltipElement.style.display = "";
    }

    public hideUI(): void {
        this.scoreElement.style.display = "none";
        this.livesElement.style.display = "none";
        this.goBtn.style.display = "none";
        this.tooltipElement.style.display = "none";
    }

    public onResize() {
        this.engine.resize();
    }
}

//window["Game"] = Game;