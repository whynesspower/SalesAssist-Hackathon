'use client';

import { useState } from 'react';
import FileUpload from './FileUpload';

export default function StepsFlow() {
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadSuccess = (data: { textFilePath: string }) => {
    setUploadedFilePath(data.textFilePath);
    setUploadError(null);
    // You can store this path in localStorage or state management to use it later for chat API
    localStorage.setItem('uploadedPdfPath', data.textFilePath);
  };

  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadedFilePath(null);
  };

  return (
    <div className="flex flex-col space-y-8">
      {/* File Upload Section */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Upload Reference Document</h2>
        <p className="text-gray-600 mb-6">Upload a PDF document that will be used as reference during your sales calls.</p>
        <FileUpload 
          onUploadSuccess={handleUploadSuccess} 
          onUploadError={handleUploadError} 
        />
        {uploadedFilePath && (
          <p className="mt-4 text-sm text-green-600">Document uploaded and ready for use in your calls.</p>
        )}
      </div>

      {/* Original Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        <StepBox
          title="Optional: Reference Document ✏️"
          description="Upload a PDF document that will be used as reference for your sales calls."
          buttonLabel="Upload Reference Document"
        />
        <StepBox
          title="Step 1: Trial Sales Call ⏰"
          description="See how easy Sales Assist is to use. Trial Calls are free and limited to 10 minutes."
          buttonLabel="Create Call"
        />
        <StepBox
          title="Step 2: Buy Credits 💳"
          description="Buy credits to use for the real sales calls. No subscription!"
          buttonLabel="Get Credits"
          highlight
        />
        <StepBox title="Step 3: Real Sales Call 💸" description="Use Sales Assist for a real sales call to increase your chances of closing the deal." buttonLabel="Start" />
      </div>
    </div>
  );
}

function StepBox({
  title,
  description,
  buttonLabel,
  highlight = false,
}: {
  title: string;
  description: string;
  buttonLabel: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white border text-black p-4 rounded-lg shadow-sm flex flex-col justify-between h-full">
      <div className="mb-4">
        <h2 className="font-semibold mb-2">{title}</h2>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <button
        className={`px-4 py-2 rounded-md ${
          highlight
            ? "bg-black text-white shadow-md ring-1 ring-green-200"
            : "bg-gray-100 hover:bg-gray-200"
        }`}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
  