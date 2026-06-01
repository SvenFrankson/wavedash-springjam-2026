import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { CreateBoxVertexData } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { PhysicsBody } from "@babylonjs/core/Physics/v2/physicsBody";
import { PhysicsMotionType } from "@babylonjs/core/Physics/v2/IPhysicsEnginePlugin";
import { PhysicsShapeBox } from "@babylonjs/core/Physics/v2/physicsShape";
import { AnimationFactory, ScaleVertexDataInPlace } from "babylonjs-tiaratumgames-tools";
import { Game } from "./Game";
import { BaseMaterials } from "./BaseMaterials";
import { WinZone } from "./WinZone";
import { RandomHello, ToonSoundType, Wait } from "./ToonSound";
import { Easing } from "./Easing";

export const PETS = [
    "animal-beaver",
    "animal-bee",
    "animal-bunny",
    "animal-cat",
    "animal-caterpillar",
    "animal-chick",
    "animal-cow",
    "animal-crab",
    "animal-deer",
    "animal-dog",
    "animal-elephant",
    "animal-fish",
    "animal-fox",
    "animal-giraffe",
    "animal-hog",
    "animal-koala",
    "animal-lion",
    "animal-monkey",
    "animal-panda",
    "animal-parrot",
    "animal-penguin",
    "animal-pig",
    "animal-polar",
    "animal-tiger",
];

export class PetHitBox extends Mesh {

    constructor(public pet: Pet) {
        super(pet.name + "-hitbox", pet.game.scene);
        CreateBoxVertexData({ width: Pet.PetSize, height: Pet.PetSize, depth: Pet.PetSize }).applyToMesh(this);
        this.visibility = 0;
        this.parent = pet;
    }
}

export class Pet extends Mesh {

    public static PetSize = 0.8;
    public hitBox: Mesh;
    public petMaterial: StandardMaterial;
    public winzone: WinZone | null = null;

    constructor(public petName: string, public game: Game) {
        super(petName);

        this.petMaterial = new StandardMaterial("petMaterial", this.game.scene);
        this.petMaterial.diffuseTexture = new Texture("meshes/Textures/colormap.png");
        this.petMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        this.petMaterial.emissiveColor = new Color3(0.5, 0.5, 0.5);
        
        this.hitBox = new PetHitBox(this);

        this.game.pets.add(this);
    }

    public async initialize(): Promise<void> {

        this.scaling.copyFromFloats(0, 0, 0);

        let petMeshParts = await SceneLoader.ImportMeshAsync(
            "",
            "meshes/" + this.petName + ".obj"
        );
        petMeshParts.meshes.forEach(mesh => {
            if (this.isDisposed()) {
                mesh.dispose();
            }
            mesh.isVisible = false;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    mesh.isVisible = true;
                });
            });
            mesh.parent = this;
            mesh.position.y = -Pet.PetSize / 2;
            mesh.rotation.y = Math.PI;
            if (mesh instanceof Mesh) {
                BaseMaterials.MakeOutline(mesh);
                let vData = VertexData.ExtractFromMesh(mesh);
                ScaleVertexDataInPlace(vData, 0.5);
                vData.applyToMesh(mesh);
                mesh.material = this.petMaterial;
            }
        });

        if (this.isDisposed()) {
            return;
        }
        let scaleAnim = AnimationFactory.CreateVector3(this, this, "scaling");
        await scaleAnim(new Vector3(1, 1, 1), 1.5, Easing.easeOutElastic);

        if (this.isDisposed()) {
            return;
        }
        this.game.toonSoundManager.start({
            text: RandomHello(),
            pos: this.position.add(new Vector3(Pet.PetSize * 0.5, Pet.PetSize * 0.5, 0)),
            color: "#FFFFFF",
            size: 0.5,
            duration: 1,
            type: ToonSoundType.Poc
        });
    }

    public async enablePhysics(): Promise<void> {
        if (!this.physicsBody || this.physicsBody.isDisposed) {
            let volume = Pet.PetSize * Pet.PetSize * Pet.PetSize;
            let weight = volume * 0.3; // density = 1
            const body = new PhysicsBody(this, PhysicsMotionType.DYNAMIC, false, this.game.scene);
            body.setMassProperties({
                mass: weight
            });
            body.shape = new PhysicsShapeBox(
                new Vector3(0, 0, 0),
                Quaternion.Identity(),
                new Vector3(Pet.PetSize, Pet.PetSize, Pet.PetSize),
                this.game.scene
            );
            body.shape.material = {friction: 0.2, restitution: 0.3};
        }
    }

    public async disablePhysics(): Promise<void> {
        this.physicsBody?.dispose();
    }

    public dying = false;
    public async kill(): Promise<void> {
        this.dying = true;
        this.game.toonSoundManager.start({
            text: "BYE :'(",
            pos: this.position.add(new Vector3(Pet.PetSize * 0.5, Pet.PetSize * 0.5, 0)),
            color: "#d13636",
            size: 0.5,
            duration: 2,
            type: ToonSoundType.Poc
        });


        await this.flash(new Color3(1, 0, 0), 3);

        let scaleAnim = AnimationFactory.CreateVector3(this, this, "scaling");
        await scaleAnim(new Vector3(0, 0, 0), 0.5, Easing.easeInCubic);

        this.game.lives -= 1;

        this.dispose();
    }

    public async flash(color: Color3, count: number = 4): Promise<void> {
        for (let i = 0; i < count; i++) {
            BaseMaterials.MakeOutlineWithChild(this, 0.05, color.r, color.g, color.b);
            await Wait(150);
            BaseMaterials.MakeOutlineWithChild(this);
            await Wait(150);
        }
    }

    public dispose(): void {
        super.dispose();
        this.game.pets.delete(this);
        this.hitBox.dispose();
        if (this.winzone && !this.winzone.isDisposed()) {
            this.winzone.dispose();
        }
    }
}