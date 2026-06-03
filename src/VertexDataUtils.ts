import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";

export function SerializeVertexData(vertexData: VertexData): any {
    let serialized: any = {};
    if (vertexData.positions) {
        serialized.positions = vertexData.positions.map((v) => Math.round(v * 1000) / 1000);
    }
    if (vertexData.indices) {
        serialized.indices = vertexData.indices;
    }
    if (vertexData.normals) {
        serialized.normals = vertexData.normals.map((v) => Math.round(v * 1000) / 1000);
    }
    if (vertexData.uvs) {
        serialized.uvs = vertexData.uvs.map((v) => Math.round(v * 1000) / 1000);
    }
    return serialized;
}

export function DeserializeVertexData(serialized: any): VertexData {
    let vertexData = new VertexData();
    if (serialized.positions) {
        vertexData.positions = serialized.positions;
    }
    if (serialized.indices) {
        vertexData.indices = serialized.indices;
    }
    if (serialized.normals) {
        vertexData.normals = serialized.normals;
    }
    if (serialized.uvs) {
        vertexData.uvs = serialized.uvs;
    }
    return vertexData;
}