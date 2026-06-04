import { Axis } from "@babylonjs/core/Maths/math.axis";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { CreateBeveledBoxVertexData } from "babylonjs-tiaratumgames-tools";
import { QuaternionFromYZAxisToRef } from "babylonjs-tiaratumgames-tools";
import { Game } from "./Game";
import { Pet, PetHitBox } from "./Pets";
import { Block } from "./Block";
import { GameState } from "./GameLoop";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial.pure";
import { Texture } from "@babylonjs/core/Materials/Textures/texture.pure";
import { CreatePlaneVertexData } from "@babylonjs/core";

export class PlayerControl {

    public get scene() {
        return this.game.scene;
    }
    public get canvas() {
        return this.game.canvas;
    }
    public get camera() {
        return this.game.camera;
    }

    public minDrawY: number = - 1;
    public maxDrawY: number = 40;
    private _pointerDown = false;
    private _pointerDownPos: Vector3 = Vector3.Zero();
    private _hoveredEntity: Pet | Block | null = null;
    public get hoveredEntity() {
        return this._hoveredEntity;
    }
    public set hoveredEntity(value: Pet | Block | null) {
        if (this._hoveredEntity && this._hoveredEntity != value) {
            this._hoveredEntity.unhighlight();
        }
        this._hoveredEntity = value;
        if (this._hoveredEntity) {
            this._hoveredEntity.highlight();
        }
    }
    private _selectedPet: Pet | null = null;
    private _selectedBlock: Block | null = null;
    public get selectedBlock() {
        return this._selectedBlock;
    }
    public set selectedBlock(value: Block | null) {
        if (this._selectedBlock) {
            this._selectedBlock.unhighlight();
        }
        this._selectedBlock = value;
        if (this._selectedBlock) {
            this._selectedBlock.highlight();
        }
    }
    private _newBox: Block | null = null;
    private _newBoxSize: Vector3 = new Vector3(0.5, 0.5, 1);
    private _localAnchor: Vector3 = Vector3.Zero();

    public verticalPanel: Mesh;
    
    constructor(public game: Game) {
        this.verticalPanel = new Mesh("verticalPanel", this.scene);
        let vData = CreatePlaneVertexData({ width: 100, height: this.maxDrawY - this.minDrawY });
        
        for (let i = 0; i < vData.positions!.length / 3; i++) {
            let x = vData.positions![i * 3];
            let y = vData.positions![i * 3 + 1];
            vData.uvs![i * 2] = x;
            vData.uvs![i * 2 + 1] = y + 0.5;
        }
        vData.applyToMesh(this.verticalPanel);
        this.verticalPanel.position.y = (this.maxDrawY + this.minDrawY) / 2;
        this.verticalPanel.position.z = 0.01;
        this.verticalPanel.isVisible = false;
        this.verticalPanel.visibility = 0.5;

        let gridMaterial = new StandardMaterial("gridMaterial", this.scene);
        let gridTexture = new Texture("textures/grid.png", this.scene);
        gridMaterial.diffuseTexture = gridTexture;
        gridMaterial.opacityTexture = gridTexture;
        gridMaterial.emissiveTexture = gridTexture;
        gridMaterial.backFaceCulling = false;
        this.verticalPanel.material = gridMaterial;

        /*
        MeshBuilder.CreateLines("drawZone", { points: [
            new Vector3(-10, 0, 0),
            new Vector3(10, 0, 0),
            new Vector3(10, 20, 0),
            new Vector3(-10, 20, 0),
            new Vector3(-10, 0, 0)
        ]}, this.scene);
        */
    }
    
    public onPointerDown = () => {
        if (this.game.gameLoop.state != GameState.Building) {
            return;
        }
        let pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => { return mesh instanceof PetHitBox || mesh instanceof Block; });
        if (!pickResult?.hit) {
            pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => { return mesh == this.verticalPanel; });
        }
        if (pickResult?.hit) {
            if (pickResult.pickedMesh instanceof PetHitBox) {
                this._pointerDown = true;
                this._selectedPet = (pickResult.pickedMesh as PetHitBox).pet;
                //this._selectedPet.disableCollisions();
                let invMatrix = new Matrix();
                pickResult.pickedMesh!.getWorldMatrix().invertToRef(invMatrix);
                Vector3.TransformCoordinatesToRef(pickResult.pickedPoint!, invMatrix, this._localAnchor);
                this._localAnchor.z = 0;
            }
            else if (pickResult.pickedMesh instanceof Block) {
                this._pointerDown = true;
                this.selectedBlock = (pickResult.pickedMesh as Block);
                let invMatrix = new Matrix();
                pickResult.pickedMesh!.getWorldMatrix().invertToRef(invMatrix);
                Vector3.TransformCoordinatesToRef(pickResult.pickedPoint!, invMatrix, this._localAnchor);
                this._localAnchor.z = 0;
            }
            else if (pickResult.pickedMesh == this.verticalPanel) {
                if (pickResult.pickedPoint?.x! < -10 || pickResult.pickedPoint?.x! > 10 || pickResult.pickedPoint?.y! < 0 || pickResult.pickedPoint?.y! > 40) {
                    return;
                }
                this._pointerDown = true;
                this._pointerDownPos.copyFrom(pickResult.pickedPoint!);
                this._newBox = new Block("box", this.game);
                this._newBox.highlight();
                this._newBox.position.copyFrom(this._pointerDownPos);
                this._newBoxSize.x = Block.Width;
                this._newBoxSize.y = Block.Width / 5;
                this._newBoxSize.z = Block.Depth;
                let vData = CreateBeveledBoxVertexData({ width: Block.Width / 5, height: Block.Width / 5, depth: Block.Depth });
                vData.applyToMesh(this._newBox!);
            }
        }
    }

    public onPointerMove = () => {
        if (this.game.gameLoop.state != GameState.Building) {
            return;
        }
        if (!this._pointerDown) {
            return;
        }
        let pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => { return mesh == this.verticalPanel });
        if (pickResult?.hit) {
            if (this._newBox) {
                let currentPos = pickResult.pickedPoint!;
                let dir = currentPos.subtract(this._pointerDownPos);
                let center = Vector3.Center(this._pointerDownPos, currentPos);
                let size = currentPos.subtract(this._pointerDownPos).length();
                if (size > Block.Width * 0.5) {
                    size = Math.round(size / Block.Width) * Block.Width;
                    size = Math.min(size, 16 * Block.Width);
                }
                this._newBox!.position.copyFrom(center);
                this._newBoxSize.x = Block.Width;
                this._newBoxSize.y = size;
                this._newBoxSize.z = Block.Depth;
                if (size > 0) {
                    let vData = CreateBeveledBoxVertexData({ width: Block.Width, height: size, depth: Block.Depth });
                    vData.applyToMesh(this._newBox!);
                    QuaternionFromYZAxisToRef(dir.normalize(), Vector3.Forward(), this._newBox!.rotationQuaternion!);
                    this._newBox.isVisible = true;
                }
                else {
                    this._newBox.isVisible = false;
                }
            }
        }
    }

    public onPointerUp = () => {
        if (this._newBox) {
            if (this._newBox.isVisible && this._newBoxSize.y >= Block.Width) {
                this._newBox.init(this._newBoxSize);
                this._newBox.flash(new Color3(1, 1, 1), 1);
                this.game.audioEngine?.unlockAsync().then(() => {
                    this.game.createSound?.play();
                });
            }
            else {
                this._newBox.dispose();
            }
        }
        this._pointerDown = false;
        this._newBox = null;
        if (this._selectedPet) {
            this._selectedPet.physicsBody?.setLinearDamping(0);
            this._selectedPet.physicsBody?.setAngularDamping(0);
            //this._selectedPet.enableCollisions();
        }
        this._selectedPet = null;
        if (this.selectedBlock) {
            this.selectedBlock.physicsBody?.setLinearDamping(0);
            this.selectedBlock.physicsBody?.setAngularDamping(0);
        }
        this.selectedBlock = null;
        if (this.game.gameLoop.state != GameState.Building) {
            return;
        }
    }

    public update = () => {
        //this.verticalPanel.isVisible = this.game.gameLoop.state === GameState.Building;
        if (this.game.gameLoop.state != GameState.Building) {
            if (this._newBox || this.selectedBlock || this._selectedPet) {
                this.onPointerUp();
            }
            return;
        }
        if (this._pointerDown && (this._selectedPet || this.selectedBlock)) {
            let pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => { return mesh == this.verticalPanel });
            if (pickResult?.hit) {
                let currentPos = pickResult.pickedPoint!;
                if (this._selectedPet) {
                    let p = Vector3.TransformCoordinates(this._localAnchor, this._selectedPet.getWorldMatrix());
                    let delta = currentPos.subtract(p);
                    if (delta.length() > 2) {
                        delta.normalize().scaleInPlace(2);
                    }
                    this._selectedPet.physicsBody?.setLinearDamping(10);
                    this._selectedPet.physicsBody?.setAngularDamping(5);
                    this._selectedPet.physicsBody?.applyForce(delta.scale(5), p);
                    
                    let torque = Vector3.Cross(this._selectedPet.forward, Axis.Z).scale(1);
                    this._selectedPet.physicsBody?.applyTorque(torque);
                }
                else if (this.selectedBlock) {
                    let p = Vector3.TransformCoordinates(this._localAnchor, this.selectedBlock.getWorldMatrix());
                    let delta = currentPos.subtract(p);
                    if (delta.length() > 2) {
                        delta.normalize().scaleInPlace(2);
                    }
                    this.selectedBlock.physicsBody?.setLinearDamping(10);
                    this.selectedBlock.physicsBody?.setAngularDamping(4);
                    this.selectedBlock.physicsBody?.applyForce(delta.scale(30 * this.selectedBlock.mass), p);

                    let torque = Vector3.Cross(this.selectedBlock.forward, Axis.Z).scale(3);
                    this.selectedBlock.physicsBody?.applyTorque(torque);
                }
            }
        }
        else if (!this._pointerDown) {
            let pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => { return mesh instanceof PetHitBox || mesh instanceof Block; });
            if (pickResult?.hit && pickResult.pickedMesh instanceof PetHitBox && pickResult.pickedMesh.pet.physicsBody) {
                this.hoveredEntity = (pickResult.pickedMesh as PetHitBox).pet;
            }
            else if (pickResult?.hit && pickResult.pickedMesh instanceof Block) {
                this.hoveredEntity = (pickResult.pickedMesh as Block);
            }
            else {
                this.hoveredEntity = null;
            }
        }
    }
}