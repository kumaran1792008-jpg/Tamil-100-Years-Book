import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Camera, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  RefreshCw,
  Eye,
  FileCheck,
  Video,
  VideoOff
} from 'lucide-react';
import { uploadBookFile, uploadCameraScan } from '../services/api.ts';

interface UploadViewProps {
  onUploadSuccess: (bookId: string) => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ onUploadSuccess }) => {
  const [activeMode, setActiveMode] = useState<'file' | 'camera'>('file');

  // File Upload Form State
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [year, setYear] = useState('');
  const [source, setSource] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (selectedFile: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate size (50MB)
    if (selectedFile.size > 50 * 1024 * 1024) {
      setErrorMessage('கோப்பின் அளவு 50MB-க்கு மிகாமல் இருக்க வேண்டும்.');
      return;
    }

    // Validate type
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.pdf'];
    const nameLower = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => nameLower.endsWith(ext));
    if (!isValid) {
      setErrorMessage('செல்லுபடியற்ற கோப்பு வகை. JPG, PNG, WEBP, TIFF, PDF மட்டுமே ஏற்கப்படும்.');
      return;
    }

    setFile(selectedFile);
    if (!title) {
      const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      setTitle(cleanName);
    }

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('தயவுசெய்து ஒரு நூலின் கோப்பைத் தேர்ந்தெடுக்கவும்.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('புத்தகத்தின் தலைப்பு கட்டாயம் தேவை.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title.trim());
    formData.append('author', author.trim() || 'அறியப்படாத ஆசிரியர்');
    if (year) formData.append('publication_year', year);
    if (source) formData.append('source', source.trim());

    try {
      const res = await uploadBookFile(formData);
      if (res.success) {
        setSuccessMessage(`நூல் "${title}" வெற்றிகரமாகச் சேமிக்கப்பட்டது! பக்கங்கள் பிரிக்கப்பட்டு தயார் நிலையில் உள்ளன.`);
        // Reset form
        setFile(null);
        setPreviewUrl(null);
        setTitle('');
        setAuthor('');
        setYear('');
        setSource('');
        onUploadSuccess(res.book_id);
      } else {
        setErrorMessage(res.message || 'கோப்பைப் பதிவேற்றுவதில் பிழை ஏற்பட்டது.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'பிணையப் பிழை அல்லது சேவையகத் தவறு.');
    } finally {
      setIsUploading(false);
    }
  };

  // ---------------- CAMERA LOGIC ----------------
  const startCamera = async () => {
    setCameraError(null);
    setCapturedImage(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('உங்கள் உலாவியில் கேமரா வசதி ஆதரிக்கப்படவில்லை அல்லது HTTPS தேவை.');
        return;
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraActive(true);
    } catch (err: any) {
      setCameraError('கேமரா அணுகல் மறுக்கப்பட்டது அல்லது சாதனம் கண்டறியப்படவில்லை: ' + (err.message || ''));
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleUploadCameraPhoto = async () => {
    if (!capturedImage) return;
    setIsUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await uploadCameraScan(capturedImage);
      if (res.success) {
        setSuccessMessage('கேமரா மூலம் எடுக்கப்பட்ட சுவடிப் பக்கம் வெற்றிகரமாகப் பதிவேற்றப்பட்டது!');
        setCapturedImage(null);
        onUploadSuccess(res.book_id);
      } else {
        setErrorMessage(res.message || 'கேமரா படத்தை பதிவேற்றுவதில் தோல்வி.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'சேவையகப் பிழை.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#6B1724]">
          புத்தகத்தைப் பதிவேற்று & எண்மியப்படுத்து
        </h1>
        <p className="text-xs sm:text-sm text-[#706257]">
          பழந்தமிழ் நூல்களின் பக்கங்களை PDF அல்லது படக் கோப்புகளாகவோ, அல்லது நேரடிக் கேமரா ஸ்கேனர் மூலமாகவோ பதிவேற்றலாம்.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-[#EAE2D2] rounded-xl border border-[#D5C9B3]">
          <button
            type="button"
            onClick={() => {
              setActiveMode('file');
              stopCamera();
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'file'
                ? 'bg-white text-[#6B1724] shadow-xs'
                : 'text-[#64564C] hover:text-[#2C241E]'
            }`}
          >
            <Upload className="w-4 h-4" />
            கோப்புப் பதிவேற்றம் (PDF / Image)
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode('camera');
              startCamera();
            }}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeMode === 'camera'
                ? 'bg-[#6B1724] text-white shadow-xs'
                : 'text-[#64564C] hover:text-[#2C241E]'
            }`}
          >
            <Camera className="w-4 h-4" />
            நேரடிக் கேமரா ஸ்கேனர்
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-xs sm:text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-xs sm:text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          <div className="flex-1 font-medium">{successMessage}</div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* MODE 1: FILE UPLOAD */}
      {activeMode === 'file' && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2D6C3] shadow-md space-y-6">
          {/* Dropzone Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              file
                ? 'border-emerald-500 bg-emerald-50/20'
                : 'border-[#C8BBA7] hover:border-[#8B2635] bg-[#FAF7F2]'
            }`}
          >
            <input
              type="file"
              id="file-input"
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.tiff,.tif"
              onChange={handleFileChange}
            />
            <label htmlFor="file-input" className="cursor-pointer block space-y-3">
              <div className="w-14 h-14 mx-auto rounded-full bg-[#FAF0E1] text-[#8B2635] flex items-center justify-center border border-[#E0D2BE]">
                {file ? <FileCheck className="w-7 h-7 text-emerald-600" /> : <Upload className="w-7 h-7" />}
              </div>

              {file ? (
                <div>
                  <p className="text-sm font-bold text-emerald-800">{file.name}</p>
                  <p className="text-xs text-[#706257]">
                    அளவு: {(file.size / (1024 * 1024)).toFixed(2)} MB • வகை: {file.type || 'ஆவணம்'}
                  </p>
                  <span className="inline-block mt-2 text-xs text-[#8B2635] font-semibold underline">
                    வேறொரு கோப்பை மாற்ற கிளிக் செய்க
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-[#3B2F27]">
                    கோப்பை இங்கே இழுத்துப் போடவும் அல்லது கிளிக் செய்யவும்
                  </p>
                  <p className="text-xs text-[#7D7066] mt-1">
                    ஆதரிக்கப்படும் வடிவங்கள்: JPG, PNG, WEBP, TIFF, மற்றும் பல பக்க PDF ஆவணங்கள் (50MB வரை)
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Image Preview thumbnail if image */}
          {previewUrl && (
            <div className="flex items-center gap-4 p-3 bg-[#FAF7F2] rounded-xl border border-[#E2D6C3]">
              <img src={previewUrl} alt="முன்னோட்டம்" className="w-16 h-20 object-cover rounded-md border border-[#D5C9B3]" />
              <div className="text-xs space-y-1">
                <span className="font-semibold text-[#3A2E26] block">முதல் பக்க முன்னோட்டம்</span>
                <span className="text-[#75685F] block">உயர்தர ஸ்கேன் கோப்பு தயாராக உள்ளது.</span>
              </div>
            </div>
          )}

          {/* Book Metadata Fields */}
          <div className="space-y-4 pt-2">
            <h3 className="font-serif text-base font-bold text-[#6B1724] border-b border-[#EAE0D0] pb-2">
              நூல் பற்றிய விவரங்கள் (Metadata)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] mb-1">
                  நூலின் தலைப்பு <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="எ.கா. திருக்குறள் பரிமேலழகர் உரை"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF7F2] border border-[#D5C9B3] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#8B2635] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] mb-1">
                  ஆசிரியர் / உரையாசிரியர்
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="எ.கா. திருவள்ளுவர் (உரை: பரிமேலழகர்)"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF7F2] border border-[#D5C9B3] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#8B2635] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] mb-1">
                  வெளியீட்டு ஆண்டு (CE)
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="எ.கா. 1912"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF7F2] border border-[#D5C9B3] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#8B2635] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#4A3E36] mb-1">
                  மூல ஆவணம் / நூலகம்
                </label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="எ.கா. உ.வே.சா நூலகம் / ரிப்பன் அச்சுக்கூடம்"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#FAF7F2] border border-[#D5C9B3] rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#8B2635] focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isUploading || !file}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-xs sm:text-sm shadow-md transition-all ${
                isUploading || !file
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-[#8B2635] hover:bg-[#6B1724] text-white hover:scale-102'
              }`}
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  சேமித்து பக்கங்களைப் பிரிக்கிறது...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  நூலைப் பதிவேற்றுக
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* MODE 2: CAMERA SCANNER */}
      {activeMode === 'camera' && (
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E2D6C3] shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-[#EAE0D0] pb-3">
            <div>
              <h3 className="font-serif text-base font-bold text-[#6B1724]">
                நேரடி சுவடி / நூற்பக்கக் கேமரா ஸ்கேனர்
              </h3>
              <p className="text-xs text-[#706257]">
                நூலின் பக்கத்தை வெளிச்சத்தில் நேராக வைத்து படம் பிடிக்கவும்.
              </p>
            </div>
            {cameraActive && (
              <button
                type="button"
                onClick={stopCamera}
                className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-800 rounded-lg text-xs font-medium hover:bg-rose-200"
              >
                <VideoOff className="w-3.5 h-3.5" />
                கேமராவை நிறுத்து
              </button>
            )}
          </div>

          {cameraError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
              <span className="font-bold block mb-1">கேமரா பிழை:</span>
              {cameraError}
            </div>
          )}

          {/* Live Viewport or Captured View */}
          <div className="relative aspect-4/3 max-w-lg mx-auto bg-stone-900 rounded-2xl overflow-hidden border-2 border-[#B47B36] flex items-center justify-center">
            {capturedImage ? (
              <img src={capturedImage} alt="பிடிக்கப்பட்ட பக்கம்" className="w-full h-full object-contain" />
            ) : cameraActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                {/* Framing Grid Overlay */}
                <div className="absolute inset-4 border border-white/40 pointer-events-none rounded-lg flex items-center justify-center">
                  <span className="text-[11px] text-white/80 bg-black/40 px-2.5 py-1 rounded-md backdrop-blur-xs">
                    பக்கத்தைச் சட்டத்திற்குள் சீரமைக்கவும்
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center p-6 space-y-3">
                <Video className="w-12 h-12 mx-auto text-stone-500" />
                <p className="text-xs text-stone-300">கேமரா செயலிழந்துள்ளது.</p>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-[#450C15] font-semibold text-xs rounded-xl shadow-md"
                >
                  கேமராவைத் தொடங்குக
                </button>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Camera Action Buttons */}
          <div className="flex items-center justify-center gap-4">
            {cameraActive && !capturedImage && (
              <button
                type="button"
                onClick={capturePhoto}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#8B2635] hover:bg-[#6B1724] text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg transition-transform hover:scale-105"
              >
                <Camera className="w-4 h-4" />
                படம் பிடிக்கவும்
              </button>
            )}

            {capturedImage && (
              <>
                <button
                  type="button"
                  onClick={retakePhoto}
                  className="flex items-center gap-2 px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-semibold text-xs rounded-xl transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  மீண்டும் படம் பிடி
                </button>
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={handleUploadCameraPhoto}
                  className="flex items-center gap-2 px-6 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md transition-transform hover:scale-105"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      சேமிக்கிறது...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      பக்கத்தை நூலாகப் பதிவேற்றுக
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
