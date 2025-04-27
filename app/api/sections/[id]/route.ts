import { db } from '@/lib/db/drizzle';
import { theaterSections } from '@/lib/db/schema';
import { NextResponse, NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';


// delete a section by id
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
  ) {
    const { id } = await params;
    const sectionId = parseInt(id);
  
    if (isNaN(sectionId)) {
      return NextResponse.json(
        { error: 'Invalid section ID' },
        { status: 400 }
      );
    }
  
    try {
      await db.delete(theaterSections).where(eq(theaterSections.id, sectionId));
      return NextResponse.json({ message: 'Section deleted successfully' }, { status: 200 });
    } catch (error) {
      console.error(`Error deleting section ${sectionId}:`, error);
      return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 });
    }
  }
  
  // update a section by id
  export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }  
  ) {
    const { id } = await params;
    const sectionId = parseInt(id);
  
    if (isNaN(sectionId)) {
      return NextResponse.json(
        { error: 'Invalid section ID' },
        { status: 400 }
      );
    }
  
    try {
      const { name } = await request.json();
      await db.update(theaterSections).set({ name }).where(eq(theaterSections.id, sectionId));
      return NextResponse.json({ message: 'Section updated successfully' }, { status: 200 });
    } catch (error) {
      console.error(`Error updating section ${sectionId}:`, error);
      return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
    }
  }   