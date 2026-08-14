export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" },
});

export function requireAutomationSecret(request: Request) {
  const expected = Deno.env.get("AUTOMATION_SECRET");
  const provided = request.headers.get("x-automation-secret");
  return Boolean(expected && provided && expected === provided);
}
