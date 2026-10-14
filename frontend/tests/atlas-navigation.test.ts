import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCamera, serializeCamera, nextDetail, intersectsViewport, shouldEmitCamera, isDeltaMap } from "../features/atlas/map-navigation";
import {validVotesLabel} from "../features/atlas/format";

test("camera restores all five dimensions rather than losing tilt/rotation", () => {
  assert.deepEqual(parseCamera("-43.2,-19.8,6.5,45,-12"), {center:[-43.2,-19.8],zoom:6.5,pitch:45,bearing:-12});
  assert.equal(serializeCamera({center:[-43.2,-19.8],zoom:6.5,pitch:45,bearing:-12}), "-43.2,-19.8,6.5,45,-12");
});
test("invalid camera URL never sends NaN or out-of-range coordinates to WebGL", () => {
  for (const value of [undefined,"", "0,0,5", "NaN,0,5,45,0", "0,90,5,45,0", "181,0,5,45,0", "0,0,20,45,0", "0,0,5,75,0", "0,0,5,45,190"]) assert.equal(parseCamera(value), null);
});
test("municipal zoom enters at 4.8 and remains stable in the 4.5..4.8 overlap", () => {
  assert.equal(nextDetail(4.8,"states"), "municipalities");
  assert.equal(nextDetail(4.7,"states"), "states");
  assert.equal(nextDetail(4.7,"municipalities"), "municipalities");
  assert.equal(nextDetail(4.5,"municipalities"), "municipalities");
  assert.equal(nextDetail(4.49,"municipalities"), "states");
});
test("visible municipalities are loaded only for intersecting UF bounds including edges", () => {
  assert.equal(intersectsViewport([-48,-23,-39,-14], [-44,-22,-42,-18]), true);
  assert.equal(intersectsViewport([-48,-23,-39,-14], [-39,-22,-37,-18]), true);
  assert.equal(intersectsViewport([-48,-23,-39,-14], [-60,-22,-50,-18]), false);
});
test("ordinary drag reports the camera at movement end, not at every rendering frame",()=>{
  assert.equal(shouldEmitCamera("move",false,false),false);
  assert.equal(shouldEmitCamera("moveend",false,false),true);
  assert.equal(shouldEmitCamera("move",false,true),true);
  assert.equal(shouldEmitCamera("moveend",true,true),false);
  assert.equal(shouldEmitCamera("moveend",false,false,false),false);
});
test("hover distinguishes absent metric from genuine zero valid votes",()=>{
  assert.equal(validVotesLabel(null),"Sem dado de votos válidos");
  assert.equal(validVotesLabel(undefined),"Sem dado de votos válidos");
  assert.equal(validVotesLabel({validVotes:0}),"0 votos válidos");
  assert.match(validVotesLabel({validVotes:1500}),/^1,5\s+mil votos válidos$/);
});
test("curtain uses an electoral legend and never a delta legend",()=>{
  assert.equal(isDeltaMap("evolucao",true),false);
  assert.equal(isDeltaMap("evolucao",false),true);
  assert.equal(isDeltaMap("atlas",false),false);
});
