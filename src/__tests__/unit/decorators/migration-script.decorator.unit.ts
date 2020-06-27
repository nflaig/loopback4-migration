import { expect } from "@loopback/testlab";
import { MetadataInspector, BINDING_METADATA_KEY } from "@loopback/core";
import { migrationScript, asMigrationScript } from "../../../decorators";

describe("@migrationScript decorator (unit)", () => {
    it("should add the binding metadata to the class", () => {
        @migrationScript()
        class TestClass {}

        const metadata = MetadataInspector.getClassMetadata(BINDING_METADATA_KEY, TestClass);

        expect(metadata).to.not.be.undefined();
        expect(metadata?.templates[1]).to.equal(asMigrationScript);
    });
});
