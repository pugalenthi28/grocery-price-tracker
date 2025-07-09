import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_ANON_KEY
);

export async function GET() {
  try {
    // Fetch bills from Supabase
    const { data, error } = await supabase.from('groceries').select('*');
    if (error) throw error;
    
    // Return bills as JSON
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    // Return error message if something goes wrong
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
}

export async function POST(req) {
  const { date, product, productType, apna_amount, ism_amount, per_lb_pc } = await req.json();

  try {
    // Insert a new bill into Supabase
    const { data, error } = await supabase
      .from('groceries')
      .insert([{ date, product, productType, apna_amount, ism_amount, per_lb_pc }]);

    if (error) throw error;

    // Return the newly inserted bill
    return new Response(JSON.stringify(data[0]), { status: 200 });
  } catch (error) {
    // Return error message if insertion fails
    return new Response(JSON.stringify({ message: error.message }), { status: 500 });
  }
}
