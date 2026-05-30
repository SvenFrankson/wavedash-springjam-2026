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
        this.verticalPanel = MeshBuilder.CreatePlane("verticalPanel", { width: 20, height: 40 }, this.scene);
        this.verticalPanel.position.y = 20;
        this.verticalPanel.visibility = 0.2;
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
                this._pointerDown = true;
                this._pointerDownPos.copyFrom(pickResult.pickedPoint!);
                this._newBox = new Block("box", this.game);
                BaseMaterials.MakeOutline(this._newBox);
                this._newBox.material = this.game.baseMaterials.red;
                this._newBox.rotationQuaternion = Quaternion.Identity();
                this._newBox.position.copyFrom(this._pointerDownPos);
                let vData = CreateBeveledBoxVertexData({ width: 0.5, height: 0.5, depth: 1 });
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
                size = Math.round(size * 2) / 2;
                this._newBox!.position.copyFrom(center);
                this._newBoxSize.y = size;
                let vData = CreateBeveledBoxVertexData({ width: 0.5, height: size, depth: 1 });
                vData.applyToMesh(this._newBox!);
                QuaternionFromYZAxisToRef(dir.normalize(), Vector3.Forward(), this._newBox!.rotationQuaternion!);
            }
        }
    }

    public onPointerUp = (evt: PointerEvent) => {
        if (this._newBox) {
            let volume = this._newBoxSize.x * this._newBoxSize.y * this._newBoxSize.z;
            let weight = volume * 0.5; // density = 1
            const body = new PhysicsBody(this._newBox, PhysicsMotionType.DYNAMIC, false, this.scene);
            body.setMassProperties({
                mass: weight
            });
            body.shape = new PhysicsShapeBox(
                new Vector3(0, 0, 0),
                Quaternion.Identity(),
                this._newBoxSize,
                this.scene
            );
            body.shape.material = {friction: 0.2, restitution: 0.3};
        }
        this._pointerDown = false;
        this._newBox = null;
        if (this._selectedPet) {
            this._selectedPet.physicsBody?.setLinearDamping(0);
            this._selectedPet.physicsBody?.setAngularDamping(0);
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
                    this._selectedPet.physicsBody?.setLinearDamping(10);
                    this._selectedPet.physicsBody?.setAngularDamping(5);
                    this._selectedPet.physicsBody?.applyForce(delta.scale(5), p);
                }
                else if (this._selectedBlock) {
                    let p = Vector3.TransformCoordinates(this._localAnchor, this._selectedBlock.getWorldMatrix());
                    let delta = currentPos.subtract(p);
                    this._selectedBlock.physicsBody?.setLinearDamping(10);
                    this._selectedBlock.physicsBody?.setAngularDamping(5);
                    this._selectedBlock.physicsBody?.applyForce(delta.scale(20), p);

                    let torque = Vector3.Cross(this._selectedBlock.forward, Axis.Z).scale(10);
                    this._selectedBlock.physicsBody?.applyTorque(torque);
                }
            }
        }
    }
}