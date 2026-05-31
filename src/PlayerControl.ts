import { Vector3, Mesh, Quaternion, PhysicsBody, PhysicsMotionType, PhysicsShapeBox, MeshBuilder, Matrix, Axis } from "@babylonjs/core";
import { CreateBeveledBoxVertexData } from "babylonjs-extra-meshes-kit";
import { QuaternionFromYZAxisToRef } from "babylonjs-tiaratumgames-tools";
import { BaseMaterials } from "./BaseMaterials";
import { Game } from "./Game";
import { Pet, PetHitBox } from "./Pets";
import { Block } from "./Block";

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

    private _pointerDown = false;
    private _pointerDownPos: Vector3 = Vector3.Zero();
    private _selectedPet: Pet | null = null;
    private _selectedBlock: Block | null = null;
    private _newBox: Block | null = null;
    private _newBoxSize: Vector3 = new Vector3(0.5, 0.5, 1);
    private _localAnchor: Vector3 = Vector3.Zero();

    public verticalPanel: Mesh;
    
    constructor(public game: Game) {
        this.verticalPanel = MeshBuilder.CreatePlane("verticalPanel", { width: 100, height: 40 }, this.scene);
        this.verticalPanel.position.y = 20;
        this.verticalPanel.visibility = 0.1;

        let drawZone = MeshBuilder.CreateLines("drawZone", { points: [
            new Vector3(-10, 0, 0),
            new Vector3(10, 0, 0),
            new Vector3(10, 40, 0),
            new Vector3(-10, 40, 0),
            new Vector3(-10, 0, 0)
        ]}, this.scene);
    }
    
    public onPointerDown = (evt: PointerEvent) => {
        let pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => { return mesh instanceof PetHitBox || mesh instanceof Block; });
        if (!pickResult?.hit) {
            pickResult = this.scene.pick(this.scene.pointerX, this.scene.pointerY, (mesh) => { return mesh == this.verticalPanel; });
        }
        if (pickResult?.hit) {
            this.camera.detachControl();
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
                this._selectedBlock = (pickResult.pickedMesh as Block);
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
                this._newBox.position.copyFrom(this._pointerDownPos);
                let vData = CreateBeveledBoxVertexData({ width: Block.Width, height: 0.5, depth: Block.Depth });
                vData.applyToMesh(this._newBox!);
            }
        }
    }

    public onPointerMove = (evt: PointerEvent) => {
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
                size = Math.max(size, 0.5);
                size = Math.round(size / Block.Width) * Block.Width;
                size = Math.min(size, 16 * Block.Width);
                this._newBox!.position.copyFrom(center);
                this._newBoxSize.x = Block.Width;
                this._newBoxSize.y = size;
                this._newBoxSize.z = Block.Depth;
                let vData = CreateBeveledBoxVertexData({ width: Block.Width, height: size, depth: Block.Depth });
                vData.applyToMesh(this._newBox!);
                QuaternionFromYZAxisToRef(dir.normalize(), Vector3.Forward(), this._newBox!.rotationQuaternion!);
            }
        }
    }

    public onPointerUp = (evt: PointerEvent) => {
        if (this._newBox) {
            this._newBox.init(this._newBoxSize);
        }
        this._pointerDown = false;
        this._newBox = null;
        if (this._selectedPet) {
            this._selectedPet.physicsBody?.setLinearDamping(0);
            this._selectedPet.physicsBody?.setAngularDamping(0);
            //this._selectedPet.enableCollisions();
        }
        this._selectedPet = null;
        if (this._selectedBlock) {
            this._selectedBlock.physicsBody?.setLinearDamping(0);
            this._selectedBlock.physicsBody?.setAngularDamping(0);
        }
        this._selectedBlock = null;
        this.camera.attachControl(this.canvas, true);
    }

    public update = () => {
        if (this._pointerDown && (this._selectedPet || this._selectedBlock)) {
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
                else if (this._selectedBlock) {
                    let p = Vector3.TransformCoordinates(this._localAnchor, this._selectedBlock.getWorldMatrix());
                    let delta = currentPos.subtract(p);
                    if (delta.length() > 2) {
                        delta.normalize().scaleInPlace(2);
                    }
                    this._selectedBlock.physicsBody?.setLinearDamping(10);
                    this._selectedBlock.physicsBody?.setAngularDamping(4);
                    this._selectedBlock.physicsBody?.applyForce(delta.scale(20 * this._selectedBlock.mass), p);

                    let torque = Vector3.Cross(this._selectedBlock.forward, Axis.Z).scale(3);
                    this._selectedBlock.physicsBody?.applyTorque(torque);
                }
            }
        }
    }
}