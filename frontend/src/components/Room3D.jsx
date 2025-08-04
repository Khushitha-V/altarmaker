import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import Sofa from './Sofa';



function Wall({ position, rotation, size, color, wallTexture, wallName }) {
  const [texture, setTexture] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!wallTexture) {
      setTexture(null);
      setError(false);
      return;
    }
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');
    loader.load(
      wallTexture,
      (tex) => {
        setTexture(tex);
        setError(false);
      },
      undefined,
      () => {
        setTexture(null);
        setError(true);
      }
    );
  }, [wallTexture, wallName]);

  const [w, h, t] = size;
  const wallThickness = t;
  const tiny = 0.01;
  let planePosition = [0, 0, 0];
  let planeRotation = [0, 0, 0];
  let textPosition = [0, 0, 0];
  let textRotation = [0, 0, 0];

  if (wallName === 'North Wall') {
    planePosition = [0, 0, wallThickness / 2 + tiny];
    planeRotation = [0, 0, 0];
    textPosition = [0, h / 2 + 0.1, wallThickness / 2 + tiny + 0.01];
    textRotation = [0, 0, 0];
  } else if (wallName === 'South Wall') {
    planePosition = [0, 0, -(wallThickness / 2 + tiny)];
    planeRotation = [0, Math.PI, 0];
    textPosition = [0, h / 2 + 0.1, -(wallThickness / 2 + tiny + 0.01)];
    textRotation = [0, Math.PI, 0];
  } else if (wallName === 'East Wall') {
    planePosition = [0,0,-(wallThickness / 2 + tiny)];
    planeRotation = [0, -Math.PI / 1, 0];
    textPosition = [0,h/2+0.1,-(wallThickness / 2 + tiny + 0.01)];
    textRotation = [0, -Math.PI, 0];
  } else if (wallName === 'West Wall') {
    planePosition = [0,0,wallThickness / 2 + tiny];
    planeRotation = [0, 0 , 0];
    textPosition = [0,h/2+0.1,(wallThickness / 2 + tiny + 0.01)];
    textRotation = [0, 0, 0];
  }

  // Show the wall texture plane if texture is loaded
  const showWallTexture = (wallTexture && texture);

  return (
    <group position={position} rotation={rotation}>
      <mesh>
        <boxGeometry args={size} />
        <meshStandardMaterial color={color} />
      </mesh>
      {showWallTexture && (
        <>
          <mesh position={planePosition} rotation={planeRotation}>
            <planeGeometry args={[w, h]} />
            {texture && !error ? (
              <meshBasicMaterial map={texture} side={THREE.DoubleSide} />
            ) : (
              <meshBasicMaterial color="yellow" opacity={0.3} transparent side={THREE.DoubleSide} />
            )}
          </mesh>
          {/* Wall name label */}
          <Text
            position={[
              textPosition[0],
              textPosition[1],
              textPosition[2] + (textRotation[1] === 0 ? 0.08 : -0.08) // Nudge forward from the wall
            ]}
            rotation={textRotation}
            fontSize={0.7}
            color="#fff"
            anchorX="center"
            anchorY="middle"
            outlineColor="#111"
            outlineWidth={0.12}
            fontWeight="bold"
          >
            {wallName}
          </Text>
        </>
      )}
    </group>
  );
}

function LivingRoom({ dimensions, wallColors = {}, wallTextures = {} }) {
  const { length, width, height } = dimensions;
  return (
    <>
      {/* Floor */}
      <mesh receiveShadow position={[0, -1, 0]}>
        <boxGeometry args={[width, 0.2, length]} />
        <meshStandardMaterial color="#e0cda9" />
      </mesh>
      {/* Back Wall (North) */}
      <Wall position={[0, height / 2 - 1, -length / 2]} rotation={[0, 0, 0]} size={[width, height, 0.2]} color={wallColors['North Wall'] || "#b0b0b0"} wallTexture={wallTextures['North Wall']} wallName="North Wall" />
      {/* Left Wall (West) */}
      <Wall position={[-width / 2, height / 2 - 1, 0]} rotation={[0, Math.PI / 2, 0]} size={[length, height, 0.2]} color={wallColors['West Wall'] || "#8a7b94"} wallTexture={wallTextures['West Wall']} wallName="West Wall" />
      {/* Right Wall (East) */}
      <Wall position={[width / 2, height / 2 - 1, 0]} rotation={[0, Math.PI / 2, 0]} size={[length, height, 0.2]} color={wallColors['East Wall'] || "#8a7b94"} wallTexture={wallTextures['East Wall']} wallName="East Wall" />
      {/* Front Wall (South) */}
      <Wall position={[0, height / 2 - 1, length / 2]} rotation={[0, 0, 0]} size={[width, height, 0.2]} color={wallColors['South Wall'] || "#b0b0b0"} wallTexture={wallTextures['South Wall']} wallName="South Wall" />
      {/* Detailed Sofa */}
      <Sofa position={[0, -0.7, -length / 4]} />
      {/* Table */}
      <mesh position={[0, -0.9, 0]}>
        <boxGeometry args={[1, 0.2, 1]} />
        <meshStandardMaterial color="#a67c52" />
      </mesh>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
    </>
  );
}

function Bedroom({ dimensions, wallColors = {}, wallTextures = {} }) {
  const { length, width, height } = dimensions;
  return (
    <>
      {/* Floor */}
      <mesh receiveShadow position={[0, -1, 0]}>
        <boxGeometry args={[width, 0.2, length]} />
        <meshStandardMaterial color="#e6e2d3" />
      </mesh>
      {/* Back Wall (North) */}
      <Wall position={[0, height / 2 - 1, -length / 2]} rotation={[0, 0, 0]} size={[width, height, 0.2]} color={wallColors['North Wall'] || "#b0b0b0"} wallTexture={wallTextures['North Wall']} wallName="North Wall" />
      {/* Left Wall (West) */}
      <Wall position={[-width / 2, height / 2 - 1, 0]} rotation={[0, Math.PI / 2, 0]} size={[length, height, 0.2]} color={wallColors['West Wall'] || "#b0a1ba"} wallTexture={wallTextures['West Wall']} wallName="West Wall" />
      {/* Right Wall (East) */}
      <Wall position={[width / 2, height / 2 - 1, 0]} rotation={[0, Math.PI / 2, 0]} size={[length, height, 0.2]} color={wallColors['East Wall'] || "#b0a1ba"} wallTexture={wallTextures['East Wall']} wallName="East Wall" />
      {/* Front Wall (South) */}
      <Wall position={[0, height / 2 - 1, length / 2]} rotation={[0, 0, 0]} size={[width, height, 0.2]} color={wallColors['South Wall'] || "#b0b0b0"} wallTexture={wallTextures['South Wall']} wallName="South Wall" />
      {/* Bed */}
      <mesh position={[0, -0.7, length / 4]}>
        <boxGeometry args={[3, 0.5, 2]} />
        <meshStandardMaterial color="#c2b280" />
      </mesh>
      {/* Pillow */}
      <mesh position={[0, -0.4, length / 4 + 0.8]}>
        <boxGeometry args={[2.5, 0.2, 0.4]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      {/* Side Table */}
      <mesh position={[-width / 2 + 0.6, -0.85, length / 4]}>
        <boxGeometry args={[0.4, 0.3, 0.8]} />
        <meshStandardMaterial color="#a67c52" />
      </mesh>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
    </>
  );
}

function Kitchen({ dimensions, wallColors = {}, wallTextures = {} }) {
  const { length, width, height } = dimensions;
  return (
    <>
      {/* Floor */}
      <mesh receiveShadow position={[0, -1, 0]}>
        <boxGeometry args={[width, 0.2, length]} />
        <meshStandardMaterial color="#f5e6cc" />
      </mesh>
      {/* Back Wall (North) */}
      <Wall position={[0, height / 2 - 1, -length / 2]} rotation={[0, 0, 0]} size={[width, height, 0.2]} color={wallColors['North Wall'] || "#b0b0b0"} wallTexture={wallTextures['North Wall']} wallName="North Wall" />
      {/* Left Wall (West) */}
      <Wall position={[-width / 2, height / 2 - 1, 0]} rotation={[0, Math.PI / 2, 0]} size={[length, height, 0.2]} color={wallColors['West Wall'] || "#b0a1ba"} wallTexture={wallTextures['West Wall']} wallName="West Wall" />
      {/* Right Wall (East) */}
      <Wall position={[width / 2, height / 2 - 1, 0]} rotation={[0, Math.PI / 2, 0]} size={[length, height, 0.2]} color={wallColors['East Wall'] || "#b0a1ba"} wallTexture={wallTextures['East Wall']} wallName="East Wall" />
      {/* Front Wall (South) */}
      <Wall position={[0, height / 2 - 1, length / 2]} rotation={[0, 0, 0]} size={[width, height, 0.2]} color={wallColors['South Wall'] || "#b0b0b0"} wallTexture={wallTextures['South Wall']} wallName="South Wall" />
      {/* Kitchen Counter */}
      <mesh position={[-width / 4, -0.7, length / 4]}>
        <boxGeometry args={[3, 0.7, 1]} />
        <meshStandardMaterial color="#d9b382" />
      </mesh>
      {/* Fridge */}
      <mesh position={[width / 4, -0.3, length / 4 + 1]}>
        <boxGeometry args={[0.7, 1.4, 0.7]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
    </>
  );
}

function Others({ dimensions, wallColors = {}, wallTextures = {} }) {
  const { length, width, height } = dimensions;
  return (
    <>
      {/* Floor */}
      <mesh receiveShadow position={[0, -1, 0]}>
        <boxGeometry args={[width, 0.2, length]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
      {/* Back Wall (North) */}
      <Wall position={[0, height / 2 - 1, -length / 2]} rotation={[0, 0, 0]} size={[width, height, 0.2]} color={wallColors['North Wall'] || "#b0b0b0"} wallTexture={wallTextures['North Wall']} wallName="North Wall" />
      {/* Left Wall (West) */}
      <Wall position={[-width / 2, height / 2 - 1, 0]} rotation={[0, Math.PI / 2, 0]} size={[length, height, 0.2]} color={wallColors['West Wall'] || "#b0a1ba"} wallTexture={wallTextures['West Wall']} wallName="West Wall" />
      {/* Right Wall (East) */}
      <Wall position={[width / 2, height / 2 - 1, 0]} rotation={[0, Math.PI / 2, 0]} size={[length, height, 0.2]} color={wallColors['East Wall'] || "#b0a1ba"} wallTexture={wallTextures['East Wall']} wallName="East Wall" />
      {/* Front Wall (South) */}
      <Wall position={[0, height / 2 - 1, length / 2]} rotation={[0, 0, 0]} size={[width, height, 0.2]} color={wallColors['South Wall'] || "#b0b0b0"} wallTexture={wallTextures['South Wall']} wallName="South Wall" />
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
    </>
  );
}

const Room3D = ({ dimensions, roomType, wallDesigns }) => {
  const [wallTextures, setWallTextures] = useState({});

  // Convert 2D wall designs to complete wall textures
  const generateWallTextures = useCallback(async () => {
    const textures = {};
    const wallMapping = {
      'front': 'North Wall',
      'back': 'South Wall',
      'left': 'West Wall',
      'right': 'East Wall'
    };

    for (const [wallName, design] of Object.entries(wallDesigns)) {
      const mappedWallName = wallMapping[wallName];
      if (!mappedWallName) continue;

      // Only generate texture if wall has design (wallpaper or elements)
      if (design.wallpaper || (design.elements && design.elements.length > 0)) {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = 900;
          canvas.height = 600;
          
          // Set canvas style
          canvas.style.width = '900px';
          canvas.style.height = '600px';
          
          // Set background to white
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, 900, 600);
          
          // Draw wallpaper on top of white background if available
          if (design.wallpaper) {
            const bgImg = new Image();
            bgImg.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              bgImg.onload = resolve;
              bgImg.onerror = reject;
              bgImg.src = design.wallpaper;
            });
            ctx.drawImage(bgImg, 0, 0, 900, 600);
          }
          
          // Render all elements for this wall
          if (design.elements && design.elements.length > 0) {
            for (const element of design.elements) {
              if (!element || !element.content) continue;
              
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
                    console.error('Error rendering frame content:', error);
                  }
                }
              } else if (element.type === 'sticker' && element.content) {
                try {
                  const imgElement = new Image();
                  imgElement.crossOrigin = 'anonymous';
                  await new Promise((resolve, reject) => {
                    imgElement.onload = resolve;
                    imgElement.onerror = reject;
                    imgElement.src = element.content;
                  });
                  
                  ctx.drawImage(imgElement, element.x, element.y, element.width, element.height);
                } catch (error) {
                  console.error('Error rendering sticker:', error);
                }
              }
            }
          }
          
          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          textures[mappedWallName] = dataUrl;
          
        } catch (error) {
          console.error(`Error generating texture for ${wallName}:`, error);
        }
      }
    }
    
    setWallTextures(textures);
  }, [wallDesigns]);

  // Generate textures when wallDesigns change
  useEffect(() => {
    generateWallTextures();
  }, [generateWallTextures]);

  let RoomComponent;
  if (roomType === 'livingroom') RoomComponent = LivingRoom;
  else if (roomType === 'bedroom') RoomComponent = Bedroom;
  else if (roomType === 'kitchen') RoomComponent = Kitchen;
  else RoomComponent = Others;

  return (
    <div style={{ width: '100%', height: '500px', border: '2px solid #ddd', borderRadius: '8px', backgroundColor: '#ffffff' }}>
      <Canvas shadows camera={{ position: [0, 2, 8], fov: 50 }}>
        <RoomComponent dimensions={dimensions} wallTextures={wallTextures} />
        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - 0.2}
          minAzimuthAngle={-Infinity}
          maxAzimuthAngle={Infinity}
        />
      </Canvas>
    </div>
  );
};

export default Room3D; 