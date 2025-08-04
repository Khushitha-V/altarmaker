import React, { useState, useCallback, useRef, useEffect } from "react";
import { Rnd } from "react-rnd";
import Cropper from "react-easy-crop";

const Canvas = ({ elements, setElements, selectedElementId, setSelectedElementId, wallpaper, onCanvasSize, onCanvasRef, isDownloadMode = false, roomType = "livingroom", selectedWall = "front", roomDimensions = { length: 12, width: 10, height: 8 } }) => {
  const [cropFrameId, setCropFrameId] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [cropImageUrl, setCropImageUrl] = useState(null);
  const canvasRef = useRef();

  // Room type labels
  const roomLabels = {
    livingroom: "Living Room",
    bedroom: "Bedroom", 
    kitchen: "Kitchen",
    others: "Other Room"
  };

  // Wall type labels
  const wallLabels = {
    front: "Front Wall",
    back: "Back Wall",
    left: "Left Wall",
    right: "Right Wall"
  };

  // Debug effect to log elements
  useEffect(() => {
    console.log('Canvas received elements:', elements);
    console.log('Elements length:', elements.length);
    if (elements.length > 0) {
      console.log('First element:', elements[0]);
    }
  }, [elements]);

  // Debug effect to log when canvas renders
  useEffect(() => {
    console.log('Canvas rendering with elements:', elements.length);
  }, [elements]);

  useEffect(() => {
    if (canvasRef.current && onCanvasSize) {
      const rect = canvasRef.current.getBoundingClientRect();
      onCanvasSize({ width: rect.width, height: rect.height });
    }
  }, [onCanvasSize]);

  useEffect(() => {
    if (canvasRef.current && onCanvasRef) {
      onCanvasRef(canvasRef.current);
    }
  }, [onCanvasRef]);

  // Cropper logic
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  function getCroppedImg(imageSrc, croppedAreaPixels) {
    return new Promise((resolve, reject) => {
      const image = new window.Image();
      image.src = imageSrc;
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );
        canvas.toBlob(blob => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const fileUrl = URL.createObjectURL(blob);
          resolve(fileUrl);
        }, 'image/jpeg');
      };
      image.onerror = reject;
    });
  }

  // Handler to delete selected element with confirmation
  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete?')) {
      setElements((prev) => prev.filter((el) => el.id !== id));
      setSelectedElementId(null);
    }
  };

  // Helper to render crop icon SVG
  const CropIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12"/><path d="M3 6h3v12a2 2 0 0 0 2 2h12v-3"/></svg>
  );

  // Helper to generate a random color
  function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  // Helper to get a random frame animation color theme
  function getRandomFrameTheme() {
    const themes = ['rainbow', 'fire', 'ocean', 'forest', 'purple', 'gold'];
    return themes[Math.floor(Math.random() * themes.length)];
  }

  // Real crop function
  const cropImage = (imgSrc, frameWidth, frameHeight, scale, offsetX, offsetY, frameType) => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = frameWidth;
        canvas.height = frameHeight;
        const ctx = canvas.getContext('2d');
        ctx.save();
        // For circle frame, clip to circle
        if (frameType === 'circle') {
          ctx.beginPath();
          ctx.arc(frameWidth / 2, frameHeight / 2, Math.min(frameWidth, frameHeight) / 2, 0, 2 * Math.PI);
          ctx.closePath();
          ctx.clip();
        }
        // Calculate source size and position
        const displayWidth = img.width * scale;
        const displayHeight = img.height * scale;
        // The offsetX/Y are relative to the frame, so we need to calculate the source position
        // Negative offset means moving image left/up, so sourceX/Y increases
        const sx = -offsetX * (img.width / displayWidth);
        const sy = -offsetY * (img.height / displayHeight);
        const sWidth = frameWidth * (img.width / displayWidth);
        const sHeight = frameHeight * (img.height / displayHeight);
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, frameWidth, frameHeight);
        ctx.restore();
        resolve(canvas.toDataURL());
      };
      img.src = imgSrc;
    });
  };

  return (
    <main
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        margin: 0,
        overflow: 'auto',
      }}
    >
      <div
        ref={canvasRef}
        id="wall-2d-canvas"
        className="design-canvas"
        onClick={(e) => {
          // Only deselect if the click is directly on the canvas, not on a child
          if (e.target === e.currentTarget) {
            setSelectedElementId(null);
          }
        }}
        style={{
          position: 'relative',
          width: '900px',
          height: '600px',
          margin: '10px auto',
          background: wallpaper ? `url(${wallpaper}) center/cover no-repeat` : '#fff',
          overflow: 'hidden',
          boxSizing: 'border-box',
          border: '2px solid #ccc',
        }}
      >
        {elements.map((el) => {
          let aspectRatio = false;
          if (el.type === "frame") {
            if (el.frameType === "circle") {
              aspectRatio = true;
            } else {
              aspectRatio = el.width / el.height;
            }
          }
          return (
            <Rnd
              key={el.id}
              default={{
                x: el.x,
                y: el.y,
                width: el.width,
                height: el.height,
              }}
              bounds="parent"
              minWidth={100}
              minHeight={100}
              dragHandleClassName="drag-handle"
              lockAspectRatio={aspectRatio}
              onDragStop={(e, d) => {
                setElements((prev) =>
                  prev.map((item) =>
                    item.id === el.id ? { ...item, x: d.x, y: d.y } : item
                  )
                );
              }}
              onResizeStop={(e, direction, ref, delta, position) => {
                setElements((prev) =>
                  prev.map((item) =>
                    item.id === el.id
                      ? {
                          ...item,
                          width: parseInt(ref.style.width),
                          height: parseInt(ref.style.height),
                          x: position.x,
                          y: position.y,
                        }
                      : item
                  )
                );
              }}
              enableResizing={el.id === selectedElementId}
              style={{ zIndex: el.id === selectedElementId ? 2 : 1 }}
            >
              <div
                className={`design-element drag-handle${el.type === 'frame' ? ` animated-frame-border ${el.frameTheme || 'rainbow'}` : ''}`}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent canvas deselect
                  setSelectedElementId(el.id);
                }}
                style={{
                  outline: (el.id === selectedElementId && !isDownloadMode) ? '3px solid #007bff' : 'none',
                  outlineOffset: 2,
                  cursor: 'pointer',
                  position: 'relative',
                  zIndex: (el.id === selectedElementId && !isDownloadMode) ? 2 : 1,
                  border: el.type === 'sticker' ? 'none' : `4px solid ${el.borderColor || '#888'}`,
                  borderRadius:
                    el.type === 'frame' && el.frameType === 'circle'
                      ? '50%'
                      : el.type === 'frame' && el.frameType === 'rounded'
                      ? '16px'
                      : el.type === 'frame'
                      ? '4px'
                      : undefined,
                }}
              >
                {/* Delete button for selected element */}
                {el.id === selectedElementId && !isDownloadMode && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(el.id);
                      }}
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 10,
                        background: '#ff4d4f',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: 32,
                        height: 32,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: 18,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                        padding: 0,
                      }}
                      title="Delete"
                    >
                      ×
                    </button>
                    {/* Crop button for selected frame with image */}
                    {el.type === 'frame' && el.content && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCropFrameId(el.id);
                          setCropImageUrl(el.content);
                          setCrop({ x: 0, y: 0 });
                          setZoom(1);
                        }}
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 48,
                          zIndex: 10,
                          background: '#2196f3',
                          color: 'white',
                          border: 'none',
                          borderRadius: 8,
                          padding: 0,
                          width: 32,
                          height: 32,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontWeight: 'bold',
                          fontSize: 16,
                          boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                          marginRight: 8,
                        }}
                        title="Crop"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12"/><path d="M3 6h3v12a2 2 0 0 0 2 2h12v-3"/></svg>
                      </button>
                    )}
                  </>
                )}
                {/* Frame content rendering */}
                {el.type === "frame" ? (
                  el.content ? (
                    <img
                      src={el.content}
                      className="element-img"
                      alt=""
                      style={{
                        borderRadius:
                          el.frameType === "circle"
                            ? "50%"
                            : el.frameType === "rounded"
                            ? "16px"
                            : "4px",
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        background: "none"
                      }}
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          setElements((prev) =>
                            prev.map((item) =>
                              item.id === el.id ? { ...item, content: ev.target.result } : item
                            )
                          );
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  )
                ) : (
                  <img
                    src={el.content}
                    className="element-img"
                    alt=""
                    style={el.type === "sticker" ? { background: "none" } : {}}
                  />
                )}
              </div>
            </Rnd>
          );
        })}
        {/* Cropper Modal */}
        {cropFrameId && cropImageUrl && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 400, height: 400, background: '#fff', position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
              <Cropper
                image={cropImageUrl}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
              <div style={{ position: 'absolute', bottom: 16, left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: 16 }}>
                <button
                  onClick={async () => {
                    if (cropImageUrl && croppedAreaPixels) {
                      const croppedUrl = await getCroppedImg(cropImageUrl, croppedAreaPixels);
                      setElements(prev => prev.map(item => item.id === cropFrameId ? { ...item, content: croppedUrl } : item));
                      setCropFrameId(null);
                      setCropImageUrl(null);
                    }
                  }}
                >Crop</button>
                <button onClick={() => { setCropFrameId(null); setCropImageUrl(null); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Canvas;
