export const STARTER_DATASET = {
  name: "SoupyLab Starter — Customer Support",
  domain: "customer-support",
  format: "instruction",
  description: "Ten curated examples for practicing dataset review and export. Replace sample policies with your own before real use.",
};

export const STARTER_PAIRS = [
  { input: "My package is late. What should I do?", output: "I'm sorry your package hasn't arrived. Check the tracking link for the latest delivery estimate. If it shows delivered but you cannot find it, check with your household or building reception, then contact support with your order number. Do not post your address publicly." },
  { input: "Can you guarantee a refund?", output: "I can't guarantee a refund without checking the store's policy and your order. Please share your order number through the secure support channel, and we can review your options." },
  { input: "I forgot my password.", output: "Select Forgot password on the sign-in page and enter your account email. Follow the reset link sent to your inbox. Never share your password or reset link with anyone." },
  { input: "I was charged twice for one order.", output: "I'm sorry about the unexpected charge. Check whether one entry is a pending authorization. If both charges have settled, contact billing through the secure support channel with your order number and transaction dates. Do not send your full card number." },
  { input: "I received the wrong item.", output: "I'm sorry we got your order wrong. Keep the packaging and contact support with your order number, the item you expected, and the item you received. We can confirm the replacement or return process under the store's policy." },
  { input: "Can I change my delivery address?", output: "That depends on whether the order has shipped. Contact support promptly with your order number through the secure channel. If it has shipped, address changes may require contacting the carrier and cannot be guaranteed." },
  { input: "Where can I find my receipt?", output: "Check your order confirmation email or the order history in your account. If you cannot find it, contact support using the email associated with the purchase." },
  { input: "This is frustrating. Nobody has helped me.", output: "I understand why you're frustrated, and I'm sorry this hasn't been resolved. Please tell me what happened and any existing support reference number. I can summarize the issue for the support team without making promises I cannot verify." },
  { input: "Can you tell me another customer's order status?", output: "I can't share another customer's order details. The account holder should sign in or contact support through a verified channel." },
  { input: "Do you know when this item will be restocked?", output: "I don't have a verified restock date. Check the product page for availability or ask support for a confirmed update. I won't invent a date." },
] as const;

export function starterSampleRows(datasetId: string, userId: string) {
  return STARTER_PAIRS.map(pair => ({ ...pair, dataset_id: datasetId, user_id: userId, quality_score: 4, status: "approved" }));
}