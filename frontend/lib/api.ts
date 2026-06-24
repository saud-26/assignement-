const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function postTransaction(data: {
  user_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  idempotency_key: string;
}) {
  const res = await fetch(`${BASE_URL}/transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.detail || 'Failed to process transaction');
  }
  return json;
}

export async function getUserSummary(userId: string) {
  const res = await fetch(`${BASE_URL}/summary/${userId}`);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.detail || 'Failed to fetch user summary');
  }
  return json;
}

export async function getRanking() {
  const res = await fetch(`${BASE_URL}/ranking`);
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.detail || 'Failed to fetch ranking');
  }
  return json;
}
