import assert from "node:assert/strict";
/** Two real HTTP sessions, restricted to the owned disposable correction scenario. */
export async function reviewerRace(accounts, origin, ref) {
  assert.equal(process.env.POSTGRES_DB, "test");
  assert.equal(process.env.PROJECT_NAME, "frontend-disposable-smoke");
  assert.equal(process.env.FOUNDATION_TASK, "029");
  assert.ok(["127.0.0.1", "localhost"].includes(new URL(origin).hostname));
  assert.ok(typeof ref === "string" && ref.length < 1024);
  const tokens = await Promise.all(
    [1, 2, accounts.users.length - 1].map(async (actor) => {
      const response = await fetch(origin + "/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          username: accounts.users[actor],
          password: accounts.password,
        }),
      });
      assert.equal(response.status, 200, "Owned race authentication");
      return (await response.json()).data.access_token;
    }),
  );
  const call = (token, path, body) =>
    fetch(origin + "/api/v1" + path, {
      method: body ? "POST" : "GET",
      headers: {
        authorization: "Bearer " + token,
        "content-type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  try {
    const taskResponse = await call(
      tokens[2],
      "/work-items/" + encodeURIComponent(ref),
    );
    assert.equal(taskResponse.status, 200, "Owned race task read");
    const task = (await taskResponse.json()).data;
    const requestResponse = await call(
      tokens[2],
      "/business-requests/" + encodeURIComponent(task.request_ref_id),
    );
    assert.equal(requestResponse.status, 200, "Owned race request read");
    const request = (await requestResponse.json()).data;
    const typeResponse = await call(
      tokens[2],
      "/request-types/" + encodeURIComponent(request.request_type_ref_id),
    );
    assert.equal(typeResponse.status, 200, "Owned race request type read");
    assert.equal(
      (await typeResponse.json()).data.code,
      "owned-reviewer-corrections",
    );
    const responses = await Promise.all(
      tokens.slice(0, 2).map((token, index) =>
        call(token, "/work-items/" + encodeURIComponent(ref) + "/claim", {
          command_key: "owned-reviewer-race-" + index,
        }),
      ),
    );
    const statuses = responses.map((response) => response.status);
    assert.deepEqual(
      [...statuses].sort(),
      [200, 409],
      "Exactly one real claim wins",
    );
    return { statuses, winner: statuses.indexOf(200) + 1 };
  } finally {
    await Promise.all(tokens.map((token) => call(token, "/auth/logout", {})));
  }
}
