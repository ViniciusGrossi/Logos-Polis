import {test} from "node:test";
import assert from "node:assert/strict";
import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {AtlasTimeline} from "../features/atlas/components/atlas-timeline";

test("timeline exposes only published turns and clearly marks provisional editions", () => {
  const html = renderToStaticMarkup(createElement(AtlasTimeline, {elections:[{year:2022,rounds:[1,2],provisional:false},{year:2026,rounds:[1],provisional:true}],year:2022,round:2,onChange:()=>{}}));
  assert.match(html, /aria-label="2022 · 2º turno" aria-pressed="true"/);
  assert.match(html, /2026 · 1º turno · provisória/);
  assert.doesNotMatch(html, /2026 · 2º turno/);
});
