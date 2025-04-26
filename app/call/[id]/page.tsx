"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Send, X } from "lucide-react";

export default function CallPage() {
  const { id: callId } = useParams();
  const [isStreaming, setIsStreaming] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [llmResponse, setLlmResponse] = useState("");
  const [manualMessage, setManualMessage] = useState("");
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [showMicrophonePanel, setShowMicrophonePanel] = useState(false);
  const [micTranscription, setMicTranscription] = useState("");
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [transcriptionProvider, setTranscriptionProvider] = useState("deepgram"); // Default provider  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptionRef = useRef<string | null>(null);
  const emptyTranscriptionCountRef = useRef<number>(0);

  const processAudioChunks = useCallback(async () => {
    if (chunksRef.current.length > 0) {
      const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
      chunksRef.current = [];
      await sendToTranscriptionService(audioBlob);
    }
  }, []);

  const sendToTranscriptionService = useCallback(async (audioBlob: Blob) => {
    try {
      // Check if audio blob has actual content (not just empty audio)
      if (audioBlob.size < 100) { // Threshold for extremely small audio blobs
        emptyTranscriptionCountRef.current++;
        
        // If we get 3 consecutive empty audio chunks, stop sending requests
        if (emptyTranscriptionCountRef.current >= 3) {
          console.log("Detected empty audio input, pausing transcription requests");
          return;
        }
      } else {
        // Reset counter when we get actual audio data
        emptyTranscriptionCountRef.current = 0;
      }

      const formData = new FormData();
      formData.append("audio", audioBlob);
      formData.append("provider", transcriptionProvider);

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const { text } = await response.json();
      
      // Check if the transcription result is empty or same as previous
      if (!text || text.trim() === "") {
        emptyTranscriptionCountRef.current++;
        // If we get 3 consecutive empty transcriptions, stop sending requests
        if (emptyTranscriptionCountRef.current >= 3) {
          console.log("Detected empty transcription results, pausing transcription requests");
          return;
        }
      } else {
        // Reset counter when we get actual transcription
        emptyTranscriptionCountRef.current = 0;
        lastTranscriptionRef.current = text;
        setTranscription(prev => prev + (prev ? " " : "") + text);
      }
    } catch (error) {
      console.error("Error transcribing audio:", error);
    }
  }, [transcriptionProvider]);
  
  const setupMediaRecorder = useCallback((stream: MediaStream, onStop?: () => void) => {
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm', // Use webm for best compatibility
    });
    
    mediaRecorder.ondataavailable = async (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
        await processAudioChunks();
      }
    };

    mediaRecorder.onstop = () => {
      onStop?.();
    };

    return mediaRecorder;
  }, [processAudioChunks]);

  const startRecording = useCallback((mediaRecorder: MediaRecorder, interval: number) => {
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    
    // Reset counters when starting a new recording
    emptyTranscriptionCountRef.current = 0;
    lastTranscriptionRef.current = null;
    
    recordingIntervalRef.current = setInterval(() => {
      if (mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        mediaRecorder.start();
      }
    }, interval);
  }, []);

  const stopRecording = useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleScreenShare = async () => {
    try {
      // Clean up existing streams first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Create a CaptureController instance to control focus behavior
      const captureController = 'CaptureController' in window 
        ? new (window as any).CaptureController() 
        : null;

      // Media stream options
      const displayMediaOptions: any = {
        video: { displaySurface: "browser", monitorTypeSurfaces: "exclude" },
        audio: true,
      };

      // Add controller option if CaptureController is supported
      if (captureController) {
        displayMediaOptions.controller = captureController;
      }

      const mediaStream = await navigator.mediaDevices.getDisplayMedia(displayMediaOptions);

      // Set focus behavior to prevent switching to the captured tab/window
      if (captureController && 'setFocusBehavior' in captureController) {
        try {
          await captureController.setFocusBehavior('no-focus-change');
        } catch (err) {
          console.error("Error setting focus behavior:", err);
        }
      }

      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setIsStreaming(true);
      }

      const audioStream = new MediaStream(mediaStream.getAudioTracks());
      const mediaRecorder = setupMediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      
      // Start recording with audio data collection
      startRecording(mediaRecorder, 2500); // Send audio chunks every 2.5 seconds

      // Handle when user stops sharing
      mediaStream.getVideoTracks()[0].onended = () => {
        setIsStreaming(false);
        stopRecording();
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const toggleMicrophone = useCallback(async () => {
    if (isRecordingAudio) {
      stopRecording();
      setIsRecordingAudio(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = setupMediaRecorder(stream, () => {
        setIsRecordingAudio(false);
      });

      startRecording(mediaRecorder, 2500); // Send audio chunks every 2.5 seconds
      setIsRecordingAudio(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }, [isRecordingAudio, setupMediaRecorder, startRecording, stopRecording]);

  // const toggleMicrophonePanel = useCallback(() => {
  //   setShowMicrophonePanel(!showMicrophonePanel);
  //   if (!showMicrophonePanel) {
  //     setMicTranscription("");
  //     // If we're showing the panel, start recording if not already
  //     if (!isRecordingAudio) {
  //       toggleMicrophone();
  //     }
  //   } else {
  //     // If we're hiding the panel, stop recording
  //     if (isRecordingAudio) {
  //       toggleMicrophone();
  //     }
  //   }
  // }, [showMicrophonePanel, isRecordingAudio, toggleMicrophone]);

  const toggleMicrophonePanel = useCallback(() => {
    setShowMicrophonePanel(!showMicrophonePanel);
    if (!showMicrophonePanel) {
      setMicTranscription("");
      // If we're showing the panel, start recording if not already
      if (!isRecordingAudio) {
        toggleMicrophone();
      }
    } else {
      // If we're hiding the panel, stop recording
      if (isRecordingAudio) {
        toggleMicrophone();
      }
      // Clear mic-specific transcription when panel is closed
      setMicTranscription("");
    }
  }, [showMicrophonePanel, isRecordingAudio, toggleMicrophone]);
  
  // Update micTranscription when transcription changes during microphone recording
  useEffect(() => {
    if (isRecordingAudio && showMicrophonePanel) {
      setMicTranscription(transcription);
    } else if (!showMicrophonePanel) {
      // Clear mic transcription when panel is closed
      setMicTranscription("");
    }
  }, [transcription, isRecordingAudio, showMicrophonePanel]);
  const toggleMicrophoneRecording = useCallback(() => {
    toggleMicrophone();
  }, [toggleMicrophone]);

  const sendToOpenAI = useCallback(async (text: string) => {
    try {
      setLlmResponse(""); // Reset the response before streaming new content
      
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, callId }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Response body is null");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const decodedChunk = new TextDecoder().decode(value);
        setLlmResponse(prev => prev + decodedChunk);
      }
    } catch (error) {
      console.error("Error processing with OpenAI:", error);
    }
  }, [callId]);

  const requestAIAnswer = useCallback(async () => {
    if (transcription.trim()) await sendToOpenAI(transcription);
  }, [transcription, sendToOpenAI]);

  const sendManualMessage = useCallback(async () => {
    if (manualMessage.trim()) {
      await sendToOpenAI(manualMessage);
      setManualMessage("");
    }
  }, [manualMessage, sendToOpenAI]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendManualMessage();
  }, [sendManualMessage]);

  // Update micTranscription when transcription changes during microphone recording
  useEffect(() => {
    if (isRecordingAudio && showMicrophonePanel) {
      setMicTranscription(transcription);
    }
  }, [transcription, isRecordingAudio, showMicrophonePanel]);

  // useEffect(() => {
  //   return () => {
  //     stopRecording();
  //     if (streamRef.current) {
  //       streamRef.current.getTracks().forEach(track => track.stop());
  //     }
  //   };
  // }, [stopRecording]);

  useEffect(() => {
    return () => {
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      // Clear mic transcription on unmount
      setMicTranscription("");
    };
  }, [stopRecording]);
  
  return (
    <div className="flex h-screen w-screen relative">
      {/* Left Panel */}
      <div
        className={`h-full flex flex-col border-r border-gray-200 transition-all duration-300 ${
          showMicrophonePanel ? "w-[25%]" : "w-[35%]"
        }`}
      >
        {/* Video Section */}
        <div className="h-[40%] p-4 bg-gray-900">
          <Card className="h-full w-full flex items-center justify-center overflow-hidden">
            {!isStreaming && (
              <Button size="lg" onClick={handleScreenShare} className="px-8">
                Share Your Screen
              </Button>
            )}
            <div
              className={`w-full border rounded-lg overflow-hidden ${
                isStreaming ? "block" : "hidden"
              }`}
            >
              <video
                ref={videoRef}
                autoPlay
                muted
                className="w-full aspect-video bg-black"
              />
            </div>
          </Card>
        </div>
  
        {/* Transcription Section */}
        <div className="h-[60%] px-4 pb-4 pt-2 overflow-auto flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Transcription</h2>
            <div className="flex items-center gap-2">
            <select 
              className="px-2 py-1 text-sm border rounded-md"
              value={transcriptionProvider}
              onChange={(e) => setTranscriptionProvider(e.target.value)}
            >
              <option value="deepgram">Deepgram</option>
              <option value="aws">AWS Transcribe</option>
              <option value="assemblyai">AssemblyAI</option>
              <option value="speechmatics">Speechmatics</option>
            </select>

            </div>
          </div>
          <Card className="p-4 flex-grow overflow-auto mb-2">
            <p>{transcription || "Waiting for speech..."}</p>
          </Card>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTranscription("")}
            className="self-end"
          >
            <X size={16} /> Clear Transcription
          </Button>
        </div>
      </div>
  
      {/* Right Panel */}
      <div
        className="h-full p-4 flex flex-col transition-all duration-300 flex-grow"
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">AI Response</h2>
        </div>
        <Card className="p-4 flex-grow overflow-auto mb-4 flex flex-col justify-between">
          <div className="whitespace-pre-wrap mb-4 max-h-[calc(100vh-200px)] overflow-y-auto">
            {llmResponse || "Waiting for AI response..."}
          </div>
          <div className="flex gap-2 items-center mt-auto">
            <Input
              placeholder="Type a manual message..."
              value={manualMessage}
              onChange={(e) => setManualMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-grow"
            />
            <Button onClick={sendManualMessage}>
              <Send size={16} /> Send
            </Button>
            <Button
              variant={isRecordingAudio ? "destructive" : "secondary"}
              onClick={toggleMicrophonePanel}
            >
              {isRecordingAudio ? <MicOff size={16} /> : <Mic size={16} />}
              {isRecordingAudio ? "Stop" : "Microphone"}
            </Button>
          </div>
        </Card>
        <div className="flex gap-2">
          <Button onClick={requestAIAnswer} size="sm">
            AI Answer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setLlmResponse("")}
          >
            <X size={16} /> Clear Answers
          </Button>
        </div>
      </div>
  
      {/* Microphone Panel */}
      <div
        className={`h-full bg-gray-900 shadow-lg transition-all duration-300 ${
          showMicrophonePanel
            ? "w-80 opacity-100 translate-x-0 flex"
            : "w-0 opacity-0 translate-x-10 hidden"
        }`}
      >
        <div className="flex flex-col h-full w-full">
          <div className="flex items-center justify-between border-b border-gray-700 p-4">
            <div className="flex items-center">
              <Mic className="mr-2 text-white" size={20} />
              <h2 className="text-lg font-semibold text-white">Microphone</h2>
            </div>
            <div className="flex items-center">
              <label className="mr-2 text-sm text-white">AutoScroll</label>
              <div
                className={`w-12 h-6 rounded-full p-1 cursor-pointer ${
                  isAutoScrollEnabled ? "bg-blue-600" : "bg-gray-600"
                }`}
                onClick={() => setIsAutoScrollEnabled(!isAutoScrollEnabled)}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    isAutoScrollEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                ></div>
              </div>
            </div>
          </div>
  
          <div className="flex-grow p-4 overflow-auto">
            <h3 className="text-md font-medium mb-4 text-white">
              Microphone Transcription
            </h3>
            {isRecordingAudio ? (
              <div className="bg-gray-800 text-white p-4 rounded-lg overflow-y-auto h-[calc(100vh-240px)]">
                {micTranscription || "Listening... Speak now."}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[calc(100vh-240px)] bg-gray-800 p-4 rounded-lg text-center">
                <p className="text-gray-300 mb-6">
                  Click the button below to connect your microphone and include what
                  you are saying in the AI response to provide more context.
                </p>
                <p className="text-red-400 text-sm mb-6">
                  IMPORTANT: This is important if you want your responses to be
                  included and analyzed in the AI summary.
                </p>
              </div>
            )}
          </div>
  
          <div className="border-t border-gray-700 p-4 flex justify-between">
            <Button variant="outline" onClick={toggleMicrophonePanel}>
              Close
            </Button>
            <Button
              variant={isRecordingAudio ? "destructive" : "default"}
              onClick={toggleMicrophoneRecording}
            >
              {isRecordingAudio ? "Stop Microphone" : "Connect Microphone"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}