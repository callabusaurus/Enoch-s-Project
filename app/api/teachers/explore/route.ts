import { NextResponse } from 'next/server';

export async function GET() {
  const defaults = [
    { id: 'default-math', name: 'Math Teacher', description: 'Expert in algebra, calculus, and geometry' },
    { id: 'default-physics', name: 'Physics Teacher', description: 'Classical mechanics to quantum fundamentals' },
    { id: 'default-language', name: 'Language Teacher', description: 'Improve grammar, vocabulary, and fluency' },
  ];
  return NextResponse.json(defaults);
}





