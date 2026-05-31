import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Culling/ray";
import { ArcRotateCamera, Color3, CubeTexture, HavokPlugin, HemisphericLight, Mesh, MeshBuilder, PhysicsBody, PhysicsMotionType, PhysicsShapeCylinder, Ray, StandardMaterial, Texture, Vector3 } from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import { Pet, PetHitBox, PETS } from "./Pets";
import { BaseMaterials } from "./BaseMaterials";
import { PlayerControl } from "./PlayerControl";
import { Block } from "./Block";
import { Ball } from "./Ball";
import { WinZone } from "./WinZone";
import { GameLoop } from "./GameLoop";
import { ToonSoundManager, ToonSoundType } from "./ToonSound";
registerBuiltInLoaders();

export class Game {

    public static Instance: Game;

    public engine: Engine;
    public scene: Scene;
    public camera: ArcRotateCamera;
    public skybox: Mesh;
    public ground: Mesh | null = null;
    public playerControl: PlayerControl;

    public baseMaterials: BaseMaterials;
    public toonSoundManager: ToonSoundManager;

    public scoreElement: HTMLDivElement;

    public level: number = 1;
    private _score: number = 0;
    public gameLoop: GameLoop;
    public pets: Set<Pet> = new Set();
    public winzones: Set<WinZone> = new Set();
    public balls: Set<Ball> = new Set();

    constructor(public canvas: HTMLCanvasElement) {
        Game.Instance = this;

        this.engine = new Engine(canvas, true, undefined, false)
        this.scene = new Scene(this.engine);
        this.scene.clearColor.set(0, 0, 1, 1);
        this.camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2, 20, new Vector3(0, 5, 0), this.scene);
        this.camera.attachControl(canvas, true);
        let light = new HemisphericLight("light", new Vector3(1, 3, -2), this.scene);
        light.direction = (new Vector3(2, 1, -1.5)).normalize();
        light.intensity = 0.7;
		Engine.ShadersRepository = "./public/shaders/";

        this.skybox = MeshBuilder.CreateBox("skyBox", { size: 1500 }, this.scene);
        this.skybox.rotation.x = Math.PI / 8;
        let skyboxMaterial: StandardMaterial = new StandardMaterial("skyBox", this.scene);
        skyboxMaterial.backFaceCulling = false;
        let skyTexture = new CubeTexture(
            "skyboxes/cloud",
            this.scene,
            ["-px.jpg", "-py.jpg", "-pz.jpg", "-nx.jpg", "-ny.jpg", "-nz.jpg"]);
        skyboxMaterial.reflectionTexture = skyTexture;
        skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new Color3(0, 0, 0);
        skyboxMaterial.specularColor = new Color3(0, 0, 0);
        skyboxMaterial.emissiveColor = new Color3(0.3, 0.3, 0.4);
        this.skybox.material = skyboxMaterial;

        this.baseMaterials = new BaseMaterials(this);
        this.toonSoundManager = new ToonSoundManager(this);

        this.playerControl = new PlayerControl(this);

        this.gameLoop = new GameLoop(this);

        this.scoreElement = document.getElementById("score") as HTMLDivElement;

        window.addEventListener("resize", () => {
            this.onResize();
        });
    }

    public async initAndStart(): Promise<void> {
        await this.loadPhysics();
        await this.start();
    }

    public async loadPhysics(): Promise<void> {
        const havokInstance = await HavokPhysics({
            locateFile: () => {
                return "havok/HavokPhysics.wasm"
            }
        });

        // pass the engine to the plugin
        const hk = new HavokPlugin(true, havokInstance);
        // enable physics in the scene with a gravity
        this.scene.enablePhysics(new Vector3(0, -9.8, 0), hk);

        this.ground = MeshBuilder.CreateCylinder("ground", { tessellation: 64, diameter: 20, height: 1 }, this.scene);
        this.ground.position.y = -0.5;
        this.ground.material = this.baseMaterials.green;

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
            if (Math.abs(pet.position.z) > 1) {
                pet.dispose();
            }
            else if (pet.winzone) {
                let dx = pet.position.x - pet.winzone.position.x;
                let dy = pet.position.y - pet.winzone.position.y;
                if (Math.abs(dx) > pet.winzone.halfSize || Math.abs(dy) > pet.winzone.halfSize) {
                    pet.dispose();
                }
            }
        });

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
            maxDH = Math.min(this.level, 5);
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
            let pickResult = this.scene.pickWithRay(ray, (mesh) => { return mesh instanceof Block || mesh instanceof PetHitBox || mesh == this.ground });

            let pet = new Pet(petName, this);
            pet.initialize();
            if (pickResult?.hit) {
                pet.position.copyFrom(pickResult.pickedPoint!);
                pet.position.y += Pet.PetSize / 2 + 0.01 + maxDH * Math.random();
            }
            else {
                pet.position.set(x, Pet.PetSize / 2 + 0.01, 0);
            }

            new WinZone(pet, this);

            this.toonSoundManager.start({
                text: "HELLO !",
                pos: pet.position.add(new Vector3(Pet.PetSize * 0.5, Pet.PetSize * 0.5, 0)),
                color: "#FFFFFF",
                size: 0.5,
                duration: 1,
                type: ToonSoundType.Poc
            });
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
            n = 2 * this.level;
        }
        for (let i = 0; i < n!; i++) {
            setTimeout(() => {
                let angle = Math.random() * Math.PI * 0.8 + Math.PI * 0.1;
                let x = Math.cos(angle) * 20;
                let y = Math.sin(angle) * 20;
                let ball = new Ball("ball", this);
                ball.position.x = x;
                ball.position.y = y;

                ball.init(0.15 + 0.25 * Math.random());

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

    public onResize() {
        this.engine.resize();
    }
}

//window["Game"] = Game;