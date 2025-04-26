// app/api/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import path from 'path';
import { promises as fsPromises } from 'fs';
import pdfParse from 'pdf-parse';

console.log('Entering upload route');

// Ensure the uploads directory exists
const ensureUploadsDirectory = async () => {
  console.log('Ensuring uploads directory exists');
  const uploadsDir = path.join(process.cwd(), 'uploads');
  try {
    console.log('Checking if uploads directory already exists');
    await fsPromises.access(uploadsDir);
  } catch (error) {
    console.log('Creating uploads directory');
    await fsPromises.mkdir(uploadsDir, { recursive: true });
  }
  console.log('Returning uploads directory path');
  return uploadsDir;
};

export const POST = async (req: NextRequest) => {
  console.log('Entering POST function');
  try {
    console.log('Getting form data');
    const formData = await req.formData();
    console.log('Got form data:', formData);
    const file = formData.get("pdf") as File;
    
    if (!file) {
      console.log('No PDF file provided');
      return NextResponse.json(
        { error: 'No PDF file provided' },
        { status: 400 }
      );
    }
    
    // Get file buffer
    console.log('Getting file buffer');
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    console.log('Got file buffer:', fileBuffer);
    
    // Extract text from PDF using pdf-parse
    console.log('Extracting text from PDF');
    const pdfData = await pdfParse(fileBuffer);
    const extractedText = pdfData.text;
    console.log('Extracted text:', extractedText);
    
    // Save the extracted text to a file
    console.log('Saving extracted text to file');
    const uploadsDir = await ensureUploadsDirectory();
    const textFilePath = path.join(uploadsDir, 'extracted.txt');
    await fsPromises.writeFile(textFilePath, extractedText);
    console.log('Saved extracted text to file:', textFilePath);
    
    return NextResponse.json({ 
      success: true,
      message: 'PDF text extracted and saved successfully'
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    );
  }
}

console.log('Exiting upload route');
