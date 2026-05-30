import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Culling/ray";
import { ArcRotateCamera, Color3, CubeTexture, HavokPlugin, HemisphericLight, Mesh, MeshBuilder, PhysicsBody, PhysicsMotionType, PhysicsShapeBox, Quaternion, StandardMaterial, Texture, Vector2, Vector3 } from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import { CreateBeveledBox, CreateBeveledBoxVertexData } from "babylonjs-extra-meshes-kit";
import { QuaternionFromYZAxisToRef } from "babylonjs-tiaratumgames-tools";
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
import { Pet, PetHitBox, PETS } from "./Pets";
import { BaseMaterials } from "./BaseMaterials";
import { PlayerControl } from "./PlayerControl";
import { Block } from "./Block";
import { Ball } from "./Ball";
registerBuiltInLoaders();

export class Game {

    public static Instance: Game;

    public engine: Engine;
    public scene: Scene;
    public camera: ArcRotateCamera;
    public skybox: Mesh;
    public playerControl: PlayerControl;

    public baseMaterials: BaseMaterials;
    public pets: Pet[] = [];

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

        this.playerControl = new PlayerControl(this);

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

        let ground = CreateBeveledBox("ground", { width: 100, height: 1, depth: 20 }, this.scene);
        ground.material = this.baseMaterials.green;

        const body = new PhysicsBody(ground, PhysicsMotionType.STATIC, false, this.scene);
        body.setMassProperties({
            mass: 0
        });
        body.shape = new PhysicsShapeBox(
            new Vector3(0, 0, 0),
            Quaternion.Identity(),
            new Vector3(100, 1, 20),
            this.scene
        );
        body.shape.material = {friction: 0.2, restitution: 0.3};
    }

    public generateRandomPets(n?: number): void {
        if (!(n! > 0)) {
            n = Math.floor(Math.random() * 3) + 1;
        }
        for (let i = 0; i < n!; i++) {
            let petName = PETS[Math.floor(Math.random() * PETS.length)];
            
            let pet = new Pet(petName, this);
            pet.initialize();
            pet.position.x = 11 + i;
            pet.position.y = 1;

            this.pets.push(pet);
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

            block.init(new Vector3(0.5, s, 1));
        }
    }

    public generateRandomBalls(n?: number): void {
        if (!(n! > 0)) {
            n = 8;
        }
        for (let i = 0; i < n!; i++) {
            setTimeout(() => {
                let angle = Math.random() * Math.PI * 0.8 + Math.PI * 0.1;
                let x = Math.cos(angle) * 20;
                let y = Math.sin(angle) * 20;
                let ball = new Ball("ball", this);
                ball.position.x = x;
                ball.position.y = y;

                ball.init(0.4);

                let angle2 = angle + (Math.random() * 2 - 1) * Math.PI / 8;
                let x2 = Math.cos(angle2);
                let y2 = Math.sin(angle2);
                ball.physicsBody?.setLinearVelocity(new Vector3(- x2 * 15, - y2 * 15, 0));
            }, Math.random() * 2000);
        }
    }

    private _state = 0;
    public async start(): Promise<void> {
        this.playerControl.canvas.addEventListener("pointerdown", this.playerControl.onPointerDown);
        this.playerControl.canvas.addEventListener("pointermove", this.playerControl.onPointerMove);
        this.playerControl.canvas.addEventListener("pointerup", this.playerControl.onPointerUp);
        document.getElementById("next-btn")?.addEventListener("click", () => {
            if (this._state === 0) {
                this.generateRandomPets();
                //this.generateRandomBlocks();
                this._state = 1;
            }
            else if (this._state === 1) {
                this.generateRandomBalls();
                this._state = 0;
            }
        });

        this.scene.onBeforeRenderObservable.add(this.playerControl.update);

        this.engine.runRenderLoop(() => {
            this.scene.render()
        })
    }

    public onResize() {
        this.engine.resize();
    }
}

//window["Game"] = Game;