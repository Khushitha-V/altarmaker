import React from 'react';

const Sofa = ({ position = [0, -0.7, -2], length = 8 }) => (
  <group position={position}>
    {/* Sofa Base */}
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[2.4, 0.5, 1]} />
      <meshStandardMaterial color="#7c6f57" />
    </mesh>
    {/* Backrest */}
    <mesh position={[0, 0.35, -0.45]}>
      <boxGeometry args={[2.2, 0.4, 0.2]} />
      <meshStandardMaterial color="#a89f91" />
    </mesh>
    {/* Left Armrest */}
    <mesh position={[-1.1, 0.35, 0]}>
      <boxGeometry args={[0.2, 0.4, 1]} />
      <meshStandardMaterial color="#a89f91" />
    </mesh>
    {/* Right Armrest */}
    <mesh position={[1.1, 0.35, 0]}>
      <boxGeometry args={[0.2, 0.4, 1]} />
      <meshStandardMaterial color="#a89f91" />
    </mesh>
    {/* Left Cushion */}
    <mesh position={[-0.6, 0.1, 0]}>
      <boxGeometry args={[1, 0.25, 0.9]} />
      <meshStandardMaterial color="#b8b0a1" />
    </mesh>
    {/* Right Cushion */}
    <mesh position={[0.6, 0.1, 0]}>
      <boxGeometry args={[1, 0.25, 0.9]} />
      <meshStandardMaterial color="#b8b0a1" />
    </mesh>
    {/* Sofa Legs */}
    <mesh position={[-1, -0.25, 0.4]}>
      <cylinderGeometry args={[0.05, 0.05, 0.2, 16]} />
      <meshStandardMaterial color="#444" />
    </mesh>
    <mesh position={[1, -0.25, 0.4]}>
      <cylinderGeometry args={[0.05, 0.05, 0.2, 16]} />
      <meshStandardMaterial color="#444" />
    </mesh>
    <mesh position={[-1, -0.25, -0.4]}>
      <cylinderGeometry args={[0.05, 0.05, 0.2, 16]} />
      <meshStandardMaterial color="#444" />
    </mesh>
    <mesh position={[1, -0.25, -0.4]}>
      <cylinderGeometry args={[0.05, 0.05, 0.2, 16]} />
      <meshStandardMaterial color="#444" />
    </mesh>
    {/* Throw Pillow Left */}
    <mesh position={[-0.8, 0.3, 0.2]}>
      <boxGeometry args={[0.3, 0.15, 0.3]} />
      <meshStandardMaterial color="#eab676" />
    </mesh>
    {/* Throw Pillow Right */}
    <mesh position={[0.8, 0.3, 0.2]}>
      <boxGeometry args={[0.3, 0.15, 0.3]} />
      <meshStandardMaterial color="#b6d0e2" />
    </mesh>
  </group>
);

export default Sofa; 