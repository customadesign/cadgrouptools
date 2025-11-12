import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * GET /api/personas/[id]
 * Returns the content of a specific persona template by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const personaPath = path.join(process.cwd(), 'public', 'personas', `${id}.md`);
    
    const content = await fs.readFile(personaPath, 'utf-8');
    
    return NextResponse.json(
      {
        id,
        content,
        filename: `${id}.md`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error reading persona file:', error);
    return NextResponse.json(
      { error: 'Persona not found' },
      { status: 404 }
    );
  }
}
