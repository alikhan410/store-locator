// Resolves the shop for an app proxy request from the verified request only.
// The SDK signs over the last `shop` value but loads the session from the first,
// so a request must carry exactly one `shop` before it is authenticated.
export async function verifiedProxyShop(request, authenticateAppProxy) {
  const shopValues = new URL(request.url).searchParams.getAll("shop");
  if (shopValues.length !== 1) {
    return { error: new Response("Exactly one shop parameter required", { status: 400 }) };
  }
  // Throws a 400 Response when the signature does not verify.
  const { session } = await authenticateAppProxy(request);
  if (!session?.shop) {
    return { error: new Response("Shop is not installed", { status: 400 }) };
  }
  return { shop: session.shop };
}
