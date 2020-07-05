import { Entity, model, property, ModelDefinition, defineModelClass } from "@loopback/repository";
import { MigrationAction } from "../types";

@model()
export class Migration extends Entity {
    @property({
        type: "string",
        id: true,
        generated: false,
        defaultFn: "uuidv4"
    })
    id: string;

    @property({
        type: "string",
        required: true
    })
    version: string;

    @property({
        type: "string"
    })
    scriptName?: string;

    @property({
        type: "string"
    })
    description?: string;

    @property({
        type: "string",
        required: true
    })
    action: MigrationAction;

    @property({
        type: "date",
        defaultFn: "now"
    })
    appliedAt: string;

    @property({
        type: "number",
        required: true
    })
    changeNumber: number;

    constructor(data?: Partial<Migration>) {
        super(data);
    }
}

export function updateMigrationModelName(modelClass: typeof Migration, modelName: string) {
    const modelDef = new ModelDefinition({ ...modelClass.definition, name: modelName });
    const newModelClass = defineModelClass(Entity, modelDef);
    return newModelClass;
}
