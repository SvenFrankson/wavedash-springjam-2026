import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import "@babylonjs/core/Culling/ray";
import { ArcRotateCamera, Color3, CubeTexture, HavokPlugin, HemisphericLight, Mesh, MeshBuilder, StandardMaterial, Texture, Vector2, Vector3 } from "@babylonjs/core";
import HavokPhysics from "@babylonjs/havok";
import { registerBuiltInLoaders } from "@babylonjs/loaders/dynamic";
registerBuiltInLoaders();

export class Game {

    public static Instance: Game;

    public engine: Engine;
    public scene: Scene;
    public camera: ArcRotateCamera;
    public skybox: Mesh;

    constructor(public canvas: HTMLCanvasElement) {
        Game.Instance = this;

        this.engine = new Engine(canvas, true, undefined, false)
        this.scene = new Scene(this.engine);
        this.scene.clearColor.set(0, 0, 1, 1);
        this.camera = new ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 50, Vector3.Zero(), this.scene);
        this.camera.attachControl(canvas, true);
        let light = new HemisphericLight("light", new Vector3(1, 3, -2), this.scene);
        light.direction = (new Vector3(2, 1, -1.5)).normalize();
        light.intensity = 0.7;
		Engine.ShadersRepository = "./public/shaders/";

        this.skybox = MeshBuilder.CreateBox("skyBox", { size: 1500 }, this.scene);
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
        this.skybox.material = skyboxMaterial;

        window.addEventListener("resize", () => {
            this.onResize();
        });
    }

    public start() {
        this.engine.runRenderLoop(() => {
            this.scene.render()
        })
    }

    public onResize() {
        this.engine.resize();
    }
}

//window["Game"] = Game;