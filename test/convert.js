/**
 * @author Louis-Dominique Dubeau
 * @license MPL 2.0
 * @copyright Mangalam Research Center for Buddhist Languages
 */

/* global it describe before */

"use strict";

const path = require("path");
const { convertRNGToPattern } = require("../build/dist");
const fileURL = require("file-url");
const { expect } = require("chai");

describe("convertRNGToPattern", () => {
  describe("with a manifest", () => {
    let result;

    before(() => convertRNGToPattern(new URL(fileURL(
      path.join(__dirname, "inclusion/doc-unannotated.rng"))),
                                     {
                                       createManifest: true,
                                       manifestHashAlgorithm: "SHA-1",
                                     })
           .then((_result) => {
             result = _result;
           }));

    it("converts", () => {
      expect(result).to.have.property("pattern");
    });

    it("has a simplified tree", () => {
      expect(result).to.have.property("simplified");
    });

    it("has no warnings", () => {
      expect(result).to.have.property("warnings").lengthOf(0);
    });

    it("has a manifest", () => {
      expect(result).to.have.property("manifest").deep.members([{
        filePath: `file://${__dirname}/inclusion/doc-unannotated.rng`,
        hash: "SHA-1-4abdf9d7531a342b88d2407f1077a6e96ce97476",
      }, {
        filePath: `file://${__dirname}/inclusion/doc-common.rng`,
        hash: "SHA-1-c4e57689cf2c39239f654eb9ae5cfaa07f858455",
      }]);
    });
  });

  describe("without manifest", () => {
    let result;

    before(() => convertRNGToPattern(new URL(fileURL(
      path.join(__dirname, "inclusion/doc-unannotated.rng"))))
           .then((_result) => {
             result = _result;
           }));

    it("converts", () => {
      expect(result).to.have.property("pattern");
    });

    it("has a simplified tree", () => {
      expect(result).to.have.property("simplified");
    });

    it("has no warnings", () => {
      expect(result).to.have.property("warnings").lengthOf(0);
    });

    it("has a manifest", () => {
      expect(result).to.have.property("manifest").lengthOf(0);
    });
  });
});