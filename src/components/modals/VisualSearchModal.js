import React, { useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { X, Camera, Upload, Search, Trash2 } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';

/**
 * VisualSearchModal - Google Lens-style multi-image visual search
 * Take Photo (native camera on mobile) or Upload from Device.
 * Supports multiple images, thumbnail previews, then search.
 *
 * Also exposes an imperative API (via ref) so parents can
 * append images from paste events while keeping the existing
 * image → AI → search pipeline unchanged.
 */
export const VisualSearchModal = forwardRef(function VisualSearchModal(
  { isOpen, onClose, onSearchWithImages },
  ref
) {
  const { setSearchQuery } = useSearch();
  const [mode, setMode] = useState(null); // 'camera' | 'upload' | null
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setMode(null);
      setFiles([]);
      setPreviews([]);
    }
  }, [isOpen]);

  const addFiles = (newFiles) => {
    const list = Array.from(newFiles || []);
    const imageFiles = list.filter(
      (f) => f.type.startsWith('image/') && ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)
    );

    if (imageFiles.length === 0) return;

    // Clear any existing text/URL input when images are added
    // (camera, upload, or paste into this modal).
    setSearchQuery('');

    const combined = [...files, ...imageFiles].slice(0, 16);
    setFiles(combined);
    const newPreviews = combined.map((f) => URL.createObjectURL(f));
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPreviews(newPreviews);
  };

  const removeFile = (index) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    URL.revokeObjectURL(previews[index]);
    setPreviews(next.map((f) => URL.createObjectURL(f)));
  };

  const handleFileChange = (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const handleCameraChange = (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const handleSearch = () => {
    if (files.length === 0) return;
    onSearchWithImages(files);
    onClose();
  };

  const openCamera = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const openUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Allow parents (e.g. ResultsNavbar) to append images from
  // paste events while reusing this modal's existing UX.
  useImperativeHandle(ref, () => ({
    addImagesFromPaste: (pastedFiles) => {
      if (!pastedFiles || pastedFiles.length === 0) return;
      // Treat pasted images like an "upload" flow.
      setMode((prev) => prev || 'upload');
      addFiles(pastedFiles);
    }
  }));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#FDFDF8] rounded-xl max-w-lg w-full shadow-2xl relative my-8 overflow-hidden border border-[#D4CFC0]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm text-[#5D5F60] hover:text-[#1D1F20] transition-colors rounded-lg p-2 shadow-lg"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-4 sm:p-6">
          <h2 className="text-xl font-bold text-[#1D1F20] mb-1">Visual search</h2>
          <p className="text-sm text-[#5D5F60] mb-4">Search using your photos (like Google Lens)</p>

          {mode === null && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode('camera')}
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-[#D4CFC0] hover:border-[#EB9D2A] hover:bg-[#EB9D2A]/5 transition-all"
              >
                <Camera className="w-8 h-8 text-[#EB9D2A]" />
                <span className="text-sm font-medium text-[#1D1F20]">Take photo</span>
                <span className="text-xs text-[#5D5F60]">Use camera</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('upload')}
                className="flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-[#D4CFC0] hover:border-[#EB9D2A] hover:bg-[#EB9D2A]/5 transition-all"
              >
                <Upload className="w-8 h-8 text-[#EB9D2A]" />
                <span className="text-sm font-medium text-[#1D1F20]">Upload</span>
                <span className="text-xs text-[#5D5F60]">From device</span>
              </button>
            </div>
          )}

          {(mode === 'camera' || mode === 'upload') && (
            <>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                capture="environment"
                multiple
                className="hidden"
                onChange={handleCameraChange}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex items-center gap-2 mb-3">
                <button
                  type="button"
                  onClick={mode === 'camera' ? openCamera : openUpload}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#EB9D2A] text-[#1D1F20] font-medium text-sm hover:bg-[#B17816] transition-colors"
                >
                  {mode === 'camera' ? <Camera className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                  {mode === 'camera' ? 'Take photo(s)' : 'Choose images'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode(null)}
                  className="text-sm text-[#5D5F60] hover:text-[#1D1F20]"
                >
                  Change
                </button>
              </div>

              {previews.length > 0 && (
                <>
                  <p className="text-xs text-[#5D5F60] mb-2">
                    {previews.length} image(s) selected. Add more or search.
                  </p>
                  <div className="grid grid-cols-4 gap-2 mb-4 max-h-40 overflow-y-auto">
                    {previews.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-[#D4CFC0] bg-[#EEEFE9]">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeFile(i)}
                          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-[#EB9D2A] text-[#1D1F20] font-medium hover:bg-[#B17816] transition-colors"
                  >
                    <Search className="w-5 h-5" />
                    Search with these images
                  </button>
                </>
              )}

              {previews.length === 0 && (
                <p className="text-sm text-[#5D5F60]">
                  {mode === 'camera'
                    ? 'Tap "Take photo(s)" to open the camera. You can take multiple photos.'
                    : 'Tap "Choose images" to select one or more images from your device.'}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});

export default VisualSearchModal;
