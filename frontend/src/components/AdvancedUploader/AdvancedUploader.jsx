import React, { useState, useRef, useEffect } from 'react';
import { ChunkedUploadService, formatBytes, formatTimeLeft } from '../../utils/uploadServices';
import './AdvancedUploader.css';

const IconCloudUpload = () => (
  <svg className="dropzone-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const IconFileDocument = () => (
  <svg className="file-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

const IconRefresh = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconTrash = () => (
  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const IconCheck = () => (
  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function AdvancedUploader() {
  const [queue, setQueue] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  
  // Menyimpan referensi instance uploader agar bisa di-retry/pause secara independen
  const uploaderRefs = useRef({});

  // Membersihkan object URL saat komponen unmount untuk mencegah memory leak
  useEffect(() => {
    return () => {
      queue.forEach(item => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    // Cegah flicker jika kursor bergerak di atas elemen child di dalam area
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const processFiles = (files) => {
    const newItems = Array.from(files).map((file) => {
      const isImage = file.type.startsWith('image/');
      const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        progress: 0,
        status: 'pending', // pending, uploading, paused, error, success
        timeLeft: 'Menghitung...',
        previewUrl: isImage ? URL.createObjectURL(file) : null
      };
      
      startUpload(newItem);
      return newItem;
    });

    setQueue(prev => [...prev, ...newItems]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset value so the same file can be selected again if needed
    e.target.value = null; 
  };

  const startUpload = (item) => {
    const uploader = new ChunkedUploadService(
      item.file,
      (progress, timeLeft) => {
        setQueue(prev => prev.map(q => 
          q.id === item.id 
            ? { ...q, progress, timeLeft: formatTimeLeft(timeLeft) } 
            : q
        ));
      },
      (status, chunkIndex) => {
        setQueue(prev => prev.map(q => 
          q.id === item.id 
            ? { ...q, status, ...(status === 'error' && { timeLeft: 'Gagal' }) } 
            : q
        ));
      }
    );

    uploaderRefs.current[item.id] = uploader;
    uploader.start();
  };

  const handleRetry = (id) => {
    const uploader = uploaderRefs.current[id];
    if (uploader) {
      setQueue(prev => prev.map(q => 
        q.id === id ? { ...q, status: 'uploading', timeLeft: 'Menghitung...' } : q
      ));
      uploader.resume();
    }
  };

  const handleRemove = (id) => {
    const uploader = uploaderRefs.current[id];
    if (uploader && uploader.status !== 'success' && uploader.status !== 'error') {
      uploader.pause();
    }
    
    setQueue(prev => {
      const item = prev.find(q => q.id === id);
      if (item && item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter(q => q.id !== id);
    });
    
    delete uploaderRefs.current[id];
  };

  return (
    <div className="uploader-container">
      {/* Fitur 1: Drag Feedback */}
      <div 
        className={`dropzone ${isDragging ? 'active' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <IconCloudUpload />
        <h3 className="dropzone-title">
          {isDragging ? 'Lepaskan untuk mengunggah' : 'Tarik & Lepas File Anda di Sini'}
        </h3>
        <p className="dropzone-subtitle">Mendukung file Gambar & PDF</p>
        <button className="browse-btn" onClick={(e) => {
          e.stopPropagation();
          fileInputRef.current?.click();
        }}>
          Pilih File
        </button>
        <input 
          type="file" 
          multiple
          ref={fileInputRef}
          onChange={handleFileSelect}
          style={{ display: 'none' }} 
        />
      </div>

      {/* Fitur 5: Independent Queue */}
      {queue.length > 0 && (
        <div className="file-queue">
          {queue.map(item => (
            <div key={item.id} className="file-item">
              
              {/* Fitur 4: Upload Preview (Thumbnail) */}
              <div className="file-preview">
                {item.previewUrl ? (
                  <img src={item.previewUrl} alt="preview" style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px'}} />
                ) : (
                  <IconFileDocument />
                )}
              </div>
              
              <div className="file-info">
                <div className="file-name">{item.file.name}</div>
                <div className="file-meta">
                  <span>{formatBytes(item.file.size)}</span>
                  <span>•</span>
                  
                  {/* Fitur 2: Honest Progress & Time Left */}
                  {item.status === 'uploading' && <span style={{color: '#3b82f6'}}>{item.timeLeft} ({item.progress}%)</span>}
                  {item.status === 'error' && <span className="status-text error">Koneksi terputus</span>}
                  {item.status === 'success' && <span className="status-text success" style={{display: 'flex', alignItems: 'center', gap: '4px'}}><IconCheck /> Selesai</span>}
                  {item.status === 'paused' && <span className="status-text">Dijeda</span>}
                </div>
                
                <div className="progress-container">
                  <div 
                    className={`progress-bar ${item.status === 'error' ? 'error' : item.status === 'success' ? 'success' : ''}`} 
                    style={{ width: `${item.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="file-actions">
                {/* Fitur 3: Inline Retry */}
                {item.status === 'error' && (
                  <button 
                    className="action-btn retry" 
                    onClick={() => handleRetry(item.id)}
                    title="Coba Lagi (Lanjut dari titik gagal)"
                  >
                    <IconRefresh />
                  </button>
                )}
                {/* Fitur 4: Opsi Hapus */}
                <button 
                  className="action-btn remove" 
                  onClick={() => handleRemove(item.id)}
                  title="Hapus"
                >
                  <IconTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
