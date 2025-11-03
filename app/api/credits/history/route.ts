import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/server';

export async function GET(req: Request) {
  const authResult = await getAuthenticatedUser(req);
  if (!authResult) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { user, supabase } = authResult;
  const userId = user.id;

  // Fetch credit transactions - only purchases (transaction_type should be 'purchase')
  // The transaction_type field might need to be checked based on your schema
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('id, amount, transaction_type, description, created_at')
    .eq('user_id', userId)
    .eq('transaction_type', 'purchase') // Only show purchase transactions
    .order('created_at', { ascending: false })
    .limit(50); // Limit to last 50 purchases

  // If error or no data, return empty array (gracefully handle missing table or no transactions)
  if (error || !data) {
    return NextResponse.json({ transactions: [] });
  }

  // Format the transactions for the frontend
  const transactions = data.map((transaction) => ({
    id: transaction.id,
    date: new Date(transaction.created_at).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    action: transaction.description || 'Credit Purchase',
    amount: transaction.amount,
    type: 'add' as const, // Purchases are always additions
  }));

  return NextResponse.json({ transactions });
}

