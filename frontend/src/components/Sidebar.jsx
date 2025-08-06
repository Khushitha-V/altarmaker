import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import html2canvas from "html2canvas";
import AlertModal from "./AlertModal";
import { useNavigate } from 'react-router-dom';

const initialFrames = [
  { type: "rectangle", label: "Square" },
  { type: "circle", label: "Circle" },
  { type: "rounded", label: "Rounded Square" },
];

function getCroppedImg(imageSrc, croppedAreaPixels, targetWidth, targetHeight) {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        image,
        croppedAreaPixels.x,
        croppedAreaPixels.y,
        croppedAreaPixels.width,
        croppedAreaPixels.height,
        0,
        0,
        targetWidth,
        targetHeight
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

const Sidebar = ({ addFrame, addSticker, stickers, stickerCategories = [], setWallpaper, canvasWidth = 600, canvasHeight = 900, canvasRef, wallpaper, setIsDownloadMode, elements = [], onRoomChange, onWallChange, onDimensionsChange, selectedRoom, selectedWall, dimensions, wallDesigns = {}, saveRoomDesign, saveAsNewSession }) => {
  const navigate = useNavigate();
  const [showCropper, setShowCropper] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImageUrl, setCroppedImageUrl] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [localSelectedRoom, setLocalSelectedRoom] = useState("");
  const [localSelectedWall, setLocalSelectedWall] = useState("");
  const [localDimensions, setLocalDimensions] = useState({
    length: 8,
    width: 8,
    height: 4
  });

  // Alert modal state
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    onCancel: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false
  });

  // Helper functions for showing alerts and confirmations
  const showAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: onConfirm || (() => setAlertModal(prev => ({ ...prev, isOpen: false }))),
      onCancel: () => setAlertModal(prev => ({ ...prev, isOpen: false })),
      confirmText: 'OK',
      cancelText: 'Cancel',
      showCancel: false
    });
  };

  const showConfirmation = (title, message, onConfirm, onCancel = null) => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type: 'warning',
      onConfirm: () => {
        onConfirm();
        setAlertModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: onCancel || (() => setAlertModal(prev => ({ ...prev, isOpen: false }))),
      confirmText: 'OK',
      cancelText: 'Cancel',
      showCancel: true
    });
  };

  // Sync local state with props when they change (e.g., when session is loaded)
  React.useEffect(() => {
    if (localSelectedRoom !== selectedRoom) {
      setLocalSelectedRoom(selectedRoom || "");
    }
  }, [selectedRoom, localSelectedRoom]);

  React.useEffect(() => {
    if (localSelectedWall !== selectedWall) {
      setLocalSelectedWall(selectedWall || "");
    }
  }, [selectedWall, localSelectedWall]);

  React.useEffect(() => {
    if (localDimensions.length !== dimensions?.length || 
        localDimensions.width !== dimensions?.width || 
        localDimensions.height !== dimensions?.height) {
              setLocalDimensions({
          length: dimensions?.length || 8,
          width: dimensions?.width || 8,
          height: dimensions?.height || 4
        });
    }
  }, [dimensions, localDimensions]);

  // Room options
  const roomOptions = [
    { value: "", label: "Select one" },
    { value: "livingroom", label: "Living Room" },
    { value: "bedroom", label: "Bedroom" },
    { value: "kitchen", label: "Kitchen" },
    { value: "others", label: "Others" }
  ];

  // Wall options
  const wallOptions = [
    { value: "", label: "Select wall" },
    { value: "front", label: "Front Wall" },
    { value: "back", label: "Back Wall" },
    { value: "left", label: "Left Wall" },
    { value: "right", label: "Right Wall" }
  ];

  // Check if selections are complete
  const isSelectionComplete = localSelectedRoom && localSelectedWall && localDimensions.length > 0 && localDimensions.width > 0 && localDimensions.height > 0;

  // Handle room selection
  const handleRoomChange = (e) => {
    const roomType = e.target.value;
    setLocalSelectedRoom(roomType);
    if (roomType && onRoomChange) {
      onRoomChange(roomType);
    }
  };

  // Handle wall selection
  const handleWallChange = (e) => {
    const wallType = e.target.value;
    setLocalSelectedWall(wallType);
    if (wallType && onWallChange) {
      onWallChange(wallType);
    }
  };

  // Handle dimension changes
  const handleDimensionChange = (field, value) => {
    const newDimensions = { ...dimensions, [field]: parseFloat(value) || 0 };
    setLocalDimensions(newDimensions);
    if (onDimensionsChange) {
      onDimensionsChange(newDimensions);
    }
  };

  // When categories change, do not auto-select any category
  // (no useEffect needed)

  const handleWallpaperFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = e => {
        setImagePreviewUrl(e.target.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreviewUrl(null);
      setShowCropper(false);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (imagePreviewUrl && croppedAreaPixels) {
      const croppedUrl = await getCroppedImg(imagePreviewUrl, croppedAreaPixels, 900, 600);
      setCroppedImageUrl(croppedUrl);
      setShowCropper(false);
      if (setWallpaper) setWallpaper(croppedUrl); // Set wallpaper in App
    }
  };

    const handleSaveDesign = async () => {
    try {
      console.log('Starting download process for all edited walls...');
      
      // Get all walls that have designs (elements or wallpaper)
      const editedWalls = Object.entries(wallDesigns).filter(([wallName, design]) => 
        design.elements.length > 0 || design.wallpaper
      );
      
      if (editedWalls.length === 0) {
        showAlert('No Designs Found', 'No edited walls found to download. Please add some designs first.', 'warning');
        return;
      }

      console.log(`Found ${editedWalls.length} edited walls:`, editedWalls.map(([wall]) => wall));
      
      // Create a zip file to contain all wall designs
      const JSZip = await import('jszip');
      const zip = new JSZip.default();
      
      // Process each edited wall
      for (const [wallName, wallDesign] of editedWalls) {
        console.log(`Processing wall: ${wallName}`);
        
        // Create canvas for this wall
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 900;
      canvas.height = 600;
      
        // Set canvas style
      canvas.style.width = '900px';
      canvas.style.height = '600px';
      
      // Set background
        if (wallDesign.wallpaper) {
          console.log(`Loading wallpaper for ${wallName}:`, wallDesign.wallpaper);
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        await new Promise((resolve, reject) => {
          bgImg.onload = resolve;
          bgImg.onerror = reject;
            bgImg.src = wallDesign.wallpaper;
        });
        ctx.drawImage(bgImg, 0, 0, 900, 600);
      } else {
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 900, 600);
      }
      
        // Render all elements for this wall
        console.log(`Rendering ${wallDesign.elements.length} elements for ${wallName}...`);
        
        for (let i = 0; i < wallDesign.elements.length; i++) {
          const element = wallDesign.elements[i];
          console.log(`Rendering element ${i} for ${wallName}:`, element);
        
        if (!element) {
            console.warn(`Element ${i} is null or undefined for ${wallName}`);
          continue;
        }
        
        if (element.type === 'frame') {
          // Draw frame border
          ctx.strokeStyle = element.borderColor || '#888';
          ctx.lineWidth = 4;
          
          if (element.frameType === 'circle') {
            ctx.beginPath();
            ctx.arc(element.x + element.width/2, element.y + element.height/2, Math.min(element.width, element.height)/2, 0, 2 * Math.PI);
            ctx.stroke();
          } else if (element.frameType === 'rounded') {
            ctx.beginPath();
            const radius = 16;
            const x = element.x;
            const y = element.y;
            const width = element.width;
            const height = element.height;
            
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
            ctx.stroke();
          } else {
            ctx.strokeRect(element.x, element.y, element.width, element.height);
          }
          
            // If frame has content (image), draw it
          if (element.content) {
            try {
              const imgElement = new Image();
              imgElement.crossOrigin = 'anonymous';
              await new Promise((resolve, reject) => {
                imgElement.onload = resolve;
                imgElement.onerror = reject;
                imgElement.src = element.content;
              });
              
              if (element.frameType === 'circle') {
                ctx.save();
                ctx.beginPath();
                ctx.arc(element.x + element.width/2, element.y + element.height/2, Math.min(element.width, element.height)/2, 0, 2 * Math.PI);
                ctx.clip();
                ctx.drawImage(imgElement, element.x, element.y, element.width, element.height);
                ctx.restore();
              } else if (element.frameType === 'rounded') {
                ctx.save();
                ctx.beginPath();
                const radius = 16;
                const x = element.x;
                const y = element.y;
                const width = element.width;
                const height = element.height;
                
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + width - radius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                ctx.lineTo(x + width, y + height - radius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                ctx.lineTo(x + radius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
                ctx.clip();
                ctx.drawImage(imgElement, element.x, element.y, element.width, element.height);
                ctx.restore();
              } else {
                ctx.drawImage(imgElement, element.x, element.y, element.width, element.height);
              }
            } catch (error) {
                console.error(`Error rendering frame content ${i} for ${wallName}:`, error);
              }
          }
        } else if (element.type === 'sticker' && element.content) {
          try {
              console.log(`Loading sticker ${i} for ${wallName}:`, element.content);
            const imgElement = new Image();
            imgElement.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              imgElement.onload = () => {
                  console.log(`Sticker ${i} loaded successfully for ${wallName}, dimensions:`, imgElement.naturalWidth, 'x', imgElement.naturalHeight);
                resolve();
              };
              imgElement.onerror = (error) => {
                  console.error(`Failed to load sticker ${i} for ${wallName}:`, error);
                reject(error);
              };
              imgElement.src = element.content;
            });
            
              // Draw sticker at its exact edited size and position
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = 1.0;
            
            ctx.drawImage(imgElement, element.x, element.y, element.width, element.height);
            
            ctx.restore();
              console.log(`Drew sticker ${i} for ${wallName} at:`, { x: element.x, y: element.y, width: element.width, height: element.height });
          } catch (error) {
              console.error(`Error rendering sticker ${i} for ${wallName}:`, error);
            }
          }
        }
        
        // Convert canvas to blob and add to zip
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        // Add to zip with descriptive filename
        const wallDisplayName = wallName.charAt(0).toUpperCase() + wallName.slice(1);
        zip.file(`${wallDisplayName}-Wall-Design.png`, blob);
        
        console.log(`Added ${wallName} to zip file`);
      }
      
      // Generate and download the zip file
      console.log('Generating zip file...');
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `all-wall-designs-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('All wall designs downloaded successfully!');
      showAlert('Success', `All wall designs downloaded successfully! ${editedWalls.length} wall(s) included.`, 'success');
      
    } catch (error) {
      console.error('Error saving all wall designs:', error);
      showAlert('Error', 'Error saving wall designs. Please try again. Make sure all images are loaded.', 'error');
    }
  };

  return (
    <>
      {/* Sidebar content */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        gap: '16px',
      }}>
        {/* Room and Dimensions Selection */}
        <div style={{ marginBottom: 10}}>
          <h4 style={{ color: '#72383d' }}>Customize Your Altar</h4>
          
          {/* Room Type Selection */}
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="room-select" style={{ fontSize: '10px !important', fontWeight: 'bold', marginBottom: '4px', display: 'block', color: '#72383d' }}>
              Room Type:
            </label>
            <select
              id="room-select"
              name="room-select"
              value={localSelectedRoom}
              onChange={handleRoomChange}
        style={{
                width: '100%', 
                padding: '8px', 
                borderRadius: '8px', 
                border: '1px solid #ccc',
                fontSize: '12px'
              }}
            >
              {roomOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          {/* Wall Type Selection */}
          <div style={{ marginBottom: 12 }}>
            <label htmlFor="wall-select" style={{ fontSize: '10px !important', fontWeight: 'bold', marginBottom: '4px', display: 'block', color: '#72383d' }}>
              🧱 Select Wall:
            </label>
            <select
              id="wall-select"
              name="wall-select"
              value={localSelectedWall}
              onChange={handleWallChange}
        style={{ 
                width: '100%', 
                padding: '8px', 
          borderRadius: '8px',
                border: '1px solid #ccc',
                fontSize: '12px',
                backgroundColor: '#f8f9fa'
              }}
            >
              {wallOptions.map(option => {
                const hasDesign = wallDesigns[option.value] && 
                  (wallDesigns[option.value].elements.length > 0 || wallDesigns[option.value].wallpaper);
                return (
                  <option key={option.value} value={option.value}>
                    {option.label} {hasDesign ? '✓' : ''}
                  </option>
                );
              })}
            </select>
            {/* Wall status indicators */}
            <div style={{ marginTop: '4px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {wallOptions.filter(option => option.value).map(option => {
                const hasDesign = wallDesigns[option.value] && 
                  (wallDesigns[option.value].elements.length > 0 || wallDesigns[option.value].wallpaper);
                return (
                  <div key={option.value} style={{ 
                    fontSize: '10px', 
                    padding: '2px 6px', 
                    borderRadius: '4px',
                    backgroundColor: hasDesign ? '#d4edda' : '#f8f9fa',
                    color: hasDesign ? '#155724' : '#6c757d',
                    border: `1px solid ${hasDesign ? '#c3e6cb' : '#dee2e6'}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px'
                  }}>
                    <span style={{ fontSize: '8px' }}>🧱</span>
                    {option.value.charAt(0).toUpperCase() + option.value.slice(1)}
                    {hasDesign && <span style={{ fontSize: '8px' }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Dimensions Inputs */}
          <div>
            <label htmlFor="dimension-length" style={{ fontSize: '10px !important', fontWeight: 'bold', marginBottom: '4px', display: 'block', color: '#72383d' }}>
              Dimensions (feet):
            </label>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
              <input
                id="dimension-length"
                name="dimension-length"
                type="number"
                value={localDimensions.length}
                onChange={(e) => handleDimensionChange('length', e.target.value)}
                style={{ 
                  width: '60px', 
                  padding: '6px', 
                  borderRadius: '6px', 
                  border: '1px solid #ccc',
                  fontSize: '11px',
                  textAlign: 'center'
                }}
                placeholder="L"
                min="1"
                max="50"
                aria-label="Length in feet"
              />
              <input
                id="dimension-width"
                name="dimension-width"
                type="number"
                value={localDimensions.width}
                onChange={(e) => handleDimensionChange('width', e.target.value)}
                style={{ 
                  width: '60px', 
                  padding: '6px', 
                  borderRadius: '6px', 
                  border: '1px solid #ccc',
                  fontSize: '11px',
                  textAlign: 'center'
                }}
                placeholder="W"
                min="1"
                max="50"
                aria-label="Width in feet"
              />
              <input
                id="dimension-height"
                name="dimension-height"
                type="number"
                value={localDimensions.height}
                onChange={(e) => handleDimensionChange('height', e.target.value)}
                style={{ 
                  width: '60px', 
                  padding: '6px', 
                  borderRadius: '6px', 
                  border: '1px solid #ccc',
                  fontSize: '11px',
                  textAlign: 'center'
                }}
                placeholder="H"
                min="1"
                max="20"
                aria-label="Height in feet"
              />
            </div>
            <div style={{ fontSize: '10px', color: '#72383d', textAlign: 'center' }}>
              Length × Width × Height
            </div>
          </div>
        </div>

        {/* Current Selection Display */}
        <div style={{ 
          marginBottom: 16, 
          padding: '5px', 
          backgroundColor: isSelectionComplete ? '#f8f9fa' : '#fff3cd', 
          borderRadius: '8px', 
          border: `1px solid ${isSelectionComplete ? '#e9ecef' : '#ffeaa7'}`
        }}>
          <h5 style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#72383d' }}>
            {isSelectionComplete ? '📋 Current Selection' : '⚠️ Please Complete Selection'}
          </h5>
                      <div style={{ fontSize: '10px !important', lineHeight: '1.4' }}>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontWeight: 'bold', color: '#72383d', fontSize: '12px' }}>🏠 Room:</span> 
              <span style={{ color: '#72383d', fontSize: '12px', fontWeight: 'bold' }}> {roomOptions.find(r => r.value === localSelectedRoom)?.label || 'Not selected'}</span>
            </div>
            <div style={{ marginBottom: '4px' }}>
              <span style={{ fontWeight: 'bold', color: '#72383d', fontSize: '12px' }}>🧱 Wall:</span> 
              <span style={{ color: '#72383d', fontSize: '12px', fontWeight: 'bold' }}> 
                {wallOptions.find(w => w.value === localSelectedWall)?.label || 'Not selected'}
                {localSelectedWall && wallDesigns[localSelectedWall] && 
                  (wallDesigns[localSelectedWall].elements.length > 0 || wallDesigns[localSelectedWall].wallpaper) && 
                  <span style={{ color: '#28a745', marginLeft: '4px', fontSize: '12px', fontWeight: 'bold' }}>✓ (Has Design)</span>
                }
              </span>
            </div>
            <div>
              <span style={{ fontWeight: 'bold', color: '#72383d', fontSize: '12px' }}>📏 Dimensions:</span> 
              <span style={{ color: '#72383d', fontSize: '12px', fontWeight: 'bold' }}> {localDimensions.length}' × {localDimensions.width}' × {localDimensions.height}'</span>
            </div>
          </div>
        </div>

        {/* Wallpaper section - only enabled when selections are complete */}
        <div style={{ marginBottom: 16, opacity: isSelectionComplete ? 1 : 0.5, pointerEvents: isSelectionComplete ? 'auto' : 'none' }}>
        <h4 style={{ color: '#72383d' }}>Wallpaper</h4>
        {!isSelectionComplete && (
          <div style={{ fontSize: '11px', color: '#72383d', marginBottom: '8px', fontStyle: 'italic' }}>
            ⚠️ Please complete room and wall selection first
          </div>
        )}
        {/* Default wallpaper options */}
        <div style={{ marginBottom: 12 }}>
          <h5 style={{ fontSize: 14, marginBottom: 8, color: '#72383d' }}>Default Designs:</h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-start' }}>
            {[
              { name: "Design 1", path: "/wallpapers/design1.png" },
              { name: "Design 2", path: "/wallpapers/design2.png" },
              { name: "Design 3", path: "/wallpapers/design3.png" },
              { name: "Design 4", path: "/wallpapers/design4.png" },
              { name: "Design 5", path: "/wallpapers/design5.png" },
            ].map((design) => (
              <button
                key={design.path}
                id={`wallpaper-${design.name.toLowerCase().replace(/\s+/g, '-')}`}
                name={`wallpaper-${design.name.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setWallpaper(design.path)}
                style={{
                  width: 56,
                  height: 56,
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  background: `url(${design.path}) center/cover`,
                  cursor: "pointer",
                  fontSize: 10,
                  color: "white",
                  textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 0
                }}
                title={design.name}
                aria-label={`Select ${design.name} wallpaper`}
              >
                {design.name}
              </button>
            ))}
          </div>
        </div>
        {/* Custom wallpaper upload */}
        <div>
          <h5 style={{ fontSize: 14, marginBottom: 8, color: '#72383d' }}>Upload Custom:</h5>
          <label htmlFor="wallpaper-upload" style={{ display: 'block', marginBottom: '4px', color: '#72383d' }}>
            Choose wallpaper file:
          </label>
          <input 
            id="wallpaper-upload"
            name="wallpaper-upload"
            type="file" 
            accept="image/*" 
            onChange={handleWallpaperFileChange}
            aria-label="Upload custom wallpaper"
            style={{
              width: '100%',
              fontSize: '12px',
              padding: '4px',
              border: '1px solid #e29f9f',
              borderRadius: '4px',
              backgroundColor: '#ffffff'
            }}
          />
        </div>
        {croppedImageUrl && (
          <div style={{ marginTop: 8 }}>
            <img src={croppedImageUrl} alt="Cropped" style={{ width: 120, height: 120, objectFit: 'cover', border: '1px solid #ccc' }} />
          </div>
        )}
        {/* Remove Wallpaper Button */}
        <div style={{ marginTop: 8 }}>
          <button
            id="remove-wallpaper"
            name="remove-wallpaper"
            onClick={() => setWallpaper(null)}
            style={{
              width: '100%',
              padding: '8px',
              backgroundColor: '#e74c3c',
              color: '#72383d',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={e => e.target.style.backgroundColor = '#c0392b'}
            onMouseLeave={e => e.target.style.backgroundColor = '#e74c3c'}
            aria-label="Remove wallpaper"
          >
            🗑️ Remove Wallpaper
          </button>
        </div>
      </div>

      <div className="frame-palette" style={{ opacity: isSelectionComplete ? 1 : 0.5, pointerEvents: isSelectionComplete ? 'auto' : 'none' }}>
        <h4 style={{ color: '#72383d' }}>Frames</h4>
        {!isSelectionComplete && (
          <div style={{ fontSize: '11px', color: '#72383d', marginBottom: '8px', fontStyle: 'italic' }}>
            ⚠️ Please complete room and wall selection first
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8, marginBottom: 8 }}>
          {initialFrames.map((frame) => (
            <button
              key={frame.type}
              id={`frame-${frame.type}`}
              name={`frame-${frame.type}`}
              onClick={() => addFrame(frame.type)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 0,
                width: 60,
                height: 60,
                border: "1px solid #ccc",
                borderRadius:
                  frame.type === "circle"
                    ? "50%"
                    : frame.type === "rounded"
                    ? "16px"
                    : "4px",
                background: "#f9f9f9",
                cursor: isSelectionComplete ? "pointer" : "not-allowed",
                fontSize: 12,
                fontWeight: 500,
                padding: 0,
              }}
              title={frame.label}
              disabled={!isSelectionComplete}
              aria-label={`Add ${frame.label} frame`}
            >
              {frame.label}
            </button>
          ))}
        </div>
      </div>
      <div className="sticker-palette" style={{ opacity: isSelectionComplete ? 1 : 0.5, pointerEvents: isSelectionComplete ? 'auto' : 'none' }}>
        <h4 style={{ color: '#72383d' }}>Stickers</h4>
        {!isSelectionComplete && (
          <div style={{ fontSize: '11px', color: '#72383d', marginBottom: '8px', fontStyle: 'italic' }}>
            ⚠️ Please complete room and wall selection first
          </div>
        )}
        {/* Category dropdown */}
        {stickerCategories.length > 0 && (
          <div>
            <label htmlFor="sticker-category" style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px', display: 'block', color: '#72383d' }}>
              Select Sticker Category:
            </label>
          <select
              id="sticker-category"
              name="sticker-category"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            style={{ marginBottom: 8, width: '100%' }}
              disabled={!isSelectionComplete}
              aria-label="Select sticker category"
          >
            <option value="">Select Category...</option>
            {stickerCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          </div>
        )}
        {/* Stickers for selected category */}
        {(stickers[selectedCategory] || []).map((src) => (
          <img
            key={src}
            src={src}
            alt={`Sticker from ${selectedCategory} category`}
            className="sticker-thumb"
            onClick={() => isSelectionComplete && addSticker(src)}
            style={{
              cursor: isSelectionComplete ? "pointer" : "not-allowed",
              marginRight: 8,
              width: 48,
              height: 48,
              objectFit: "contain",
              background: "#fff",
              borderRadius: 8,
              border: "1px solid #ccc",
            }}
            role="button"
            tabIndex={isSelectionComplete ? 0 : -1}
            aria-label={`Add sticker from ${selectedCategory}`}
            onKeyDown={(e) => {
              if (isSelectionComplete && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                addSticker(src);
              }
            }}
          />
        ))}
      </div>
      {/* Save As New Session Button */}
      <div style={{ margin: '8px 0' }}>
        <button
          id="save-as-new-session"
          name="save-as-new-session"
          onClick={saveAsNewSession}
          disabled={!isSelectionComplete}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isSelectionComplete ? '#ffb6c1' : '#6c757d',
            color: '#72383d',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isSelectionComplete ? 'pointer' : 'not-allowed',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            opacity: isSelectionComplete ? 1 : 0.6,
          }}
          onMouseEnter={(e) => {
            if (isSelectionComplete) {
              e.target.style.backgroundColor = '#ff69b4';
            }
          }}
          onMouseLeave={(e) => {
            if (isSelectionComplete) {
              e.target.style.backgroundColor = '#ffb6c1';
            }
          }}
          aria-label="Save room design as new session"
        >
          💾 Save As New Session
        </button>
        {!isSelectionComplete && (
          <div style={{ fontSize: '11px', color: '#72383d', marginTop: '4px', textAlign: 'center', fontStyle: 'italic' }}>
            ⚠️ Complete room and wall selection to enable save
          </div>
        )}
      </div>

      {/* Save Session Button */}
      <div style={{ margin: '8px 0' }}>
        <button
          id="save-room-design"
          name="save-room-design"
          onClick={saveRoomDesign}
          disabled={!isSelectionComplete}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isSelectionComplete ? '#ffb6c1' : '#6c757d',
            color: '#72383d',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isSelectionComplete ? 'pointer' : 'not-allowed',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            opacity: isSelectionComplete ? 1 : 0.6,
          }}
          onMouseEnter={(e) => {
            if (isSelectionComplete) {
              e.target.style.backgroundColor = '#ff69b4';
            }
          }}
          onMouseLeave={(e) => {
            if (isSelectionComplete) {
              e.target.style.backgroundColor = '#ffb6c1';
            }
          }}
          aria-label="Save room design as session"
        >
          💾 Save Session
        </button>
        {!isSelectionComplete && (
          <div style={{ fontSize: '11px', color: '#72383d', marginTop: '4px', textAlign: 'center', fontStyle: 'italic' }}>
            ⚠️ Complete room and wall selection to enable save
          </div>
        )}
      </div>

      {/* Download All Wall Designs Button */}
      <div style={{ margin: '8px 0' }}>
        <button
          id="save-design"
          name="save-design"
          onClick={handleSaveDesign}
          disabled={!isSelectionComplete}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isSelectionComplete ? '#ffb6c1' : '#6c757d',
            color: '#72383d',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: isSelectionComplete ? 'pointer' : 'not-allowed',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            opacity: isSelectionComplete ? 1 : 0.6,
          }}
          onMouseEnter={(e) => {
            if (isSelectionComplete) {
            e.target.style.backgroundColor = '#ff69b4';
            }
          }}
          onMouseLeave={(e) => {
            if (isSelectionComplete) {
            e.target.style.backgroundColor = '#ffb6c1';
            }
          }}
          aria-label="Save all wall designs as images"
        >
          📥 Download All Wall Designs
        </button>
        {!isSelectionComplete && (
          <div style={{ fontSize: '11px', color: '#72383d', marginTop: '4px', textAlign: 'center', fontStyle: 'italic' }}>
            ⚠️ Complete room and wall selection to enable download
          </div>
        )}
      </div>
      </div>
      
      {showCropper && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 400, height: 400, background: '#fff', position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
            <Cropper
              image={imagePreviewUrl}
              crop={crop}
              zoom={zoom}
              aspect={900 / 600}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
            <div style={{ position: 'absolute', bottom: 16, left: 0, width: '100%', display: 'flex', justifyContent: 'center', gap: 16 }}>
              <button onClick={handleCropSave}>Crop</button>
              <button onClick={() => setShowCropper(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onConfirm={alertModal.onConfirm}
        onCancel={alertModal.onCancel}
        confirmText={alertModal.confirmText}
        cancelText={alertModal.cancelText}
        showCancel={alertModal.showCancel}
      />
      </>
    );
  };

export default Sidebar;
