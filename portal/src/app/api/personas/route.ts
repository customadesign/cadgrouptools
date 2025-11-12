import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

/**
 * GET /api/personas
 * Returns a list of all available default persona templates.
 */
export async function GET(request: NextRequest) {
  try {
    const personasDir = path.join(process.cwd(), 'public', 'personas');
    const files = await fs.readdir(personasDir);
    
    const personas = files
      .filter(file => file.endsWith('.md') && file !== 'README.md')
      .map(file => ({
        id: file.replace('.md', ''),
        filename: file,
        url: `/personas/${file}`,
      }));

    return NextResponse.json({ personas }, { status: 200 });
  } catch (error) {
    console.error('Error reading personas directory:', error);
    return NextResponse.json(
      { error: 'Failed to load personas' },
      { status: 500 }
    );
  }
}
