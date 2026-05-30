import { Color3, CreateBoxVertexData, Mesh, MeshBuilder, PhysicsBody, PhysicsMotionType, PhysicsShapeBox, Quaternion, SceneLoader, StandardMaterial, Texture, Vector3, VertexData } from "@babylonjs/core";
import { ScaleVertexDataInPlace } from "babylonjs-tiaratumgames-tools";
import { Game } from "./Game";
import { BaseMaterials } from "./BaseMaterials";

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
        this.visibility = 0.1;
        this.parent = pet;
    }
}

export class Pet extends Mesh {

    public static PetSize = 0.8;
    public hitBox: Mesh;
    public petMaterial: StandardMaterial;

    constructor(public petName: string, public game: Game) {
        super(petName);

        this.petMaterial = new StandardMaterial("petMaterial", this.game.scene);
        this.petMaterial.diffuseTexture = new Texture("meshes/Textures/colormap.png");
        this.petMaterial.specularColor = new Color3(0.1, 0.1, 0.1);
        this.petMaterial.emissiveColor = new Color3(0.5, 0.5, 0.5);
        
        this.hitBox = new PetHitBox(this);
    }

    public async initialize(): Promise<void> {

        let petMeshParts = await SceneLoader.ImportMeshAsync(
            "",
            "meshes/" + this.petName + ".obj"
        );
        petMeshParts.meshes.forEach(mesh => {
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
        console.log(body.shape.filterCollideMask);
    }

    public disableCollisions(): void {
        if (this.physicsBody && this.physicsBody.shape) {
            this.physicsBody.shape.filterCollideMask = 0;
        }
    }

    public enableCollisions(): void {
        if (this.physicsBody && this.physicsBody.shape) {
            this.physicsBody.shape.filterCollideMask = -1;
        }
    }
}