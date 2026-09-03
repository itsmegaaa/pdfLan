import React from 'react';
import AdvancedUploader from '../components/AdvancedUploader/AdvancedUploader';

export default function TestUpload() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Uji Coba Upload UX</h1>
        <p className="text-gray-400 text-center mb-8">
          Demonstrasi fitur Chunked Upload, Honest Progress, dan Independent Queue sesuai PRD.
        </p>
        
        <div className="bg-white rounded-xl p-6 shadow-xl text-black">
          <AdvancedUploader />
        </div>
      </div>
    </div>
  );
}
