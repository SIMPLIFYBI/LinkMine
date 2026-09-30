export async function settlePaidResourceOrder(adminSb, order) {
  if (order.paid_at) return order.paid_at;

  const paidAt = new Date().toISOString();

  for (const item of order.resource_order_items || []) {
    const { error: entitlementError } = await adminSb
      .from("resource_entitlements")
      .insert({
        user_id: order.buyer_user_id,
        resource_id: item.resource_id,
        grant_source: "purchase",
        revoked_at: null,
      });

    if (entitlementError && entitlementError.code !== "23505") {
      throw new Error(entitlementError.message || "Failed to grant entitlement.");
    }

    const { error: itemError } = await adminSb
      .from("resource_order_items")
      .update({
        order_status: "paid",
        entitlement_granted_at: item.entitlement_granted_at || paidAt,
      })
      .eq("id", item.id);

    if (itemError) {
      throw new Error(itemError.message || "Failed to settle order item.");
    }

    const { error: payoutError } = await adminSb
      .from("resource_payout_ledger")
      .insert({
        order_item_id: item.id,
        seller_user_id: item.seller_user_id,
        entry_type: "earning",
        status: item.seller_net_cents > 0 ? "available" : "pending",
        gross_cents: item.line_total_cents,
        platform_fee_cents: item.platform_fee_cents,
        net_cents: item.seller_net_cents,
        currency_code: item.currency_code,
        available_at: paidAt,
        metadata: { orderId: order.id, resourceId: item.resource_id },
      });

    if (payoutError && payoutError.code !== "23505") {
      throw new Error(payoutError.message || "Failed to create payout ledger entry.");
    }
  }

  return paidAt;
}