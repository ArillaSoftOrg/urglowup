import assert from "node:assert/strict";
import { test } from "node:test";
import { safeJsonLd } from "./json-ld";

test("escapes script-breaking characters while preserving JSON semantics", () => {
  const serialized = safeJsonLd({
    name: '</script><img src=x onerror="alert(1)">',
    text: "A & B",
  });

  assert.equal(serialized.includes("</script>"), false);
  assert.equal(serialized.includes("<img"), false);
  assert.equal(serialized.includes("&"), false);
  assert.equal(serialized.includes("\\u003c/script\\u003e"), true);

  assert.deepEqual(JSON.parse(serialized), {
    name: '</script><img src=x onerror="alert(1)">',
    text: "A & B",
  });
});
