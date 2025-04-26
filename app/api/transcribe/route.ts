import { NextRequest, NextResponse } from 'next/server';
import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";

// This function converts a Blob to a Buffer
const blobToBuffer = async (blob: Blob): Promise<Buffer> => {
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioBlob = formData.get('audio') as Blob;
    const provider = formData.get('provider') as string;
    
    if (!audioBlob) {
      return NextResponse.json(
        { error: 'Audio file is required' },
        { status: 400 }
      );
    }

    // Handle Deepgram provider
    if (provider === 'deepgram') {
      const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
      if (!deepgramApiKey) {
        return NextResponse.json(
          { error: 'Deepgram API key not found' },
          { status: 500 }
        );
      }

      const deepgram = createClient(deepgramApiKey);
      const connection = deepgram.listen.live({
        model: "nova-3",
        language: "en-US",
        smart_format: true,
      });

      let transcription = "";
      let transcriptionComplete = false;

      return new Promise<NextResponse>((resolve) => {
        connection.on(LiveTranscriptionEvents.Open, () => {
          connection.on(LiveTranscriptionEvents.Close, () => {
            if (!transcriptionComplete) {
              resolve(NextResponse.json(
                { text: transcription },
                { status: 200 }
              ));
            }
          });

          connection.on(LiveTranscriptionEvents.Transcript, (data) => {
            const transcript = data.channel.alternatives[0].transcript;
            if (transcript) {
              transcription += " " + transcript;
            }
          });

          connection.on(LiveTranscriptionEvents.Error, (err) => {
            console.error('Deepgram error:', err);
            resolve(NextResponse.json(
              { error: 'Deepgram transcription error' },
              { status: 500 }
            ));
          });

          // Convert blob to buffer and send to Deepgram
          blobToBuffer(audioBlob).then((buffer) => {
            connection.send(buffer.buffer);
            connection.requestClose();
          }).catch((err) => {
            console.error('Error processing audio:', err);
            resolve(NextResponse.json(
              { error: 'Error processing audio' },
              { status: 500 }
            ));
          });
        });
      });
    }

    // Handle AssemblyAI provider (fallback)
    const audioFile = await blobToFile(audioBlob);
    const assemblyFormData = new FormData();
    assemblyFormData.append('audio', audioFile);
    
    const apiKey = process.env.ASSEMBLY_AI_API_KEY || process.env.ASSEMBLY_AI_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Assembly AI API key not found' },
        { status: 500 }
      );
    }
    
    const uploadResponse = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': apiKey
      },
      body: assemblyFormData
    });
    
    if (!uploadResponse.ok) {
      console.error('Assembly AI upload error:', await uploadResponse.text());
      return NextResponse.json(
        { error: 'Failed to upload audio to Assembly AI' },
        { status: 500 }
      );
    }
    
    const uploadResult = await uploadResponse.json();
    const audioUrl = uploadResult.upload_url;
    
    const transcribeResponse = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_detection: true
      })
    });
    
    if (!transcribeResponse.ok) {
      console.error('Assembly AI transcribe error:', await transcribeResponse.text());
      return NextResponse.json(
        { error: 'Failed to start transcription' },
        { status: 500 }
      );
    }
    
    const transcribeResult = await transcribeResponse.json();
    const transcriptId = transcribeResult.id;
    
    let transcriptCompleted = false;
    let transcriptResult;
    let pollAttempts = 0;
    const maxPollAttempts = 30;
    
    while (!transcriptCompleted && pollAttempts < maxPollAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      pollAttempts++;
      
      const pollResponse = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: {
          'Authorization': apiKey
        }
      });
      
      if (!pollResponse.ok) {
        console.error('Assembly AI poll error:', await pollResponse.text());
        return NextResponse.json(
          { error: 'Failed to poll for transcription result' },
          { status: 500 }
        );
      }
      
      transcriptResult = await pollResponse.json();
      
      if (transcriptResult.status === 'completed' || transcriptResult.status === 'error') {
        transcriptCompleted = true;
      }
    }
    
    if (pollAttempts >= maxPollAttempts) {
      return NextResponse.json(
        { error: 'Transcription timed out' },
        { status: 500 }
      );
    }
    
    if (transcriptResult.status === 'error') {
      return NextResponse.json(
        { error: 'Transcription failed', details: transcriptResult.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      text: transcriptResult.text
    });
    
  } catch (error) {
    console.error('Error in transcribe API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function for AssemblyAI fallback
async function blobToFile(blob: Blob): Promise<File> {
  const arrayBuffer = await blob.arrayBuffer();
  return new File([arrayBuffer], `audio-${Date.now()}.webm`, { type: blob.type });
}