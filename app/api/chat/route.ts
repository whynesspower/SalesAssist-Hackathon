import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

const getOpenAIClient = () => {
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const baseURL = process.env.AZURE_OPENAI_ENDPOINT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION;

  if (!apiKey || !baseURL || !apiVersion) {
    throw new Error("Azure OpenAI environment variables are not properly set");
  }

  return new OpenAI({
    apiKey,
    baseURL: `${baseURL}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
    defaultQuery: { 'api-version': apiVersion },
    defaultHeaders: { 'api-key': apiKey },
  });
};

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { text, callId } = await request.json();

    if (!text) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a TransformStream to stream the response
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Start OpenAI streaming completion in the background
    (async () => {
      try {
        // Initialize OpenAI client
        const openai = getOpenAIClient();
        
        // Get reference content from content.txt file
        let referenceContent = '';
        try {
          const contentFilePath = path.join(process.cwd(), 'content.txt');
          
          // Check if content.txt file exists before trying to read it
          try {
            await fsPromises.access(contentFilePath);
            referenceContent = await fsPromises.readFile(contentFilePath, 'utf-8');
          } catch (fileError) {
            console.log('No content.txt file found');
          }
        } catch (error) {
          console.error('Error reading content.txt:', error);
        }
        
        // Get PDF content if available
        let pdfContent = '';
        try {
          const uploadsDir = path.join(process.cwd(), 'uploads');
          const textFilePath = path.join(uploadsDir, 'extracted.txt');
          
          // Check if file exists before trying to read it
          try {
            await fsPromises.access(textFilePath);
            pdfContent = await fsPromises.readFile(textFilePath, 'utf-8');
          } catch (fileError) {
            // File doesn't exist, continue without PDF content
            console.log('No extracted text file found');
          }
        } catch (error) {
          console.error('Error reading PDF content:', error);
          // Continue without PDF content if there's an error
        }
        
        // Prepare system message with reference content, PDF content, and transcription
        const systemMessage = `You are a sales assistant AI in a video call. Your role is to help the sales representative by providing accurate, helpful information during the call. Answer in the first person's perspective as if you are the sales person itself. Don't give anything which can't be directly read aloud by the sales person, during the call. 

${referenceContent ? `Reference Content:\n${referenceContent}\n\n` : ''}
${pdfContent ? `Reference Document:\n${pdfContent}\n\n` : ''}
Transcription from the call:\n${text}\n\nAnalyze the questions being asked in the transcription and provide a comprehensive answer based on the available reference materials. Be clear, concise, and professional in your response. Focus on addressing the specific questions or concerns raised in the transcription.Even if there is no question being asked in the transcript, start answering with the most relevant question which you can guess. Please don't give any other comment on the type of question, just directly start to answer straight to the point without any extra sentences which have low value addition`;
        
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: systemMessage 
            }
          ],
          stream: true,
        });

        // Process each chunk from the OpenAI stream
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content || '';
          
          if (content) {
            await writer.write(encoder.encode(content));
          }
        }

        await writer.close();
      } catch (error) {
        console.error('Streaming error:', error);
        
        // If there's an error during streaming, write an error message and close the stream
        let errorMessage = 'Error processing your request';
        
        if (error instanceof Error) {
          errorMessage = `Error: ${error.message}`;
        }
        
        await writer.write(encoder.encode(errorMessage));
        await writer.close();
      }
    })();

    // Return the readable stream to the client
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
    
  } catch (error) {
    console.error('Error in chat API:', error);
    
    let errorMessage = 'Internal server error';
    
    if (error instanceof Error) {
      errorMessage = `Error: ${error.message}`;
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
} 