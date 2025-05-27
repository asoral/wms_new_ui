
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { Suspense, useRef, useState } from 'react';
import { Group } from 'three';
import { Button } from '@/components/ui/button';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

interface BikeViewer3DProps {
  selectedParts: Record<string, string>;
  onPartClick?: (partId: string) => void;
}

// 3D Bike Model Component
function BikeModel({ selectedParts, onPartClick }: BikeViewer3DProps) {
  const groupRef = useRef<Group>(null);
  
  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Main Frame */}
      <mesh position={[0, 0.5, 0]} onClick={() => onPartClick?.('frame')}>
        <boxGeometry args={[2, 0.1, 0.1]} />
        <meshStandardMaterial color="#333" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Fuel Tank */}
      <mesh position={[0.3, 0.8, 0]} onClick={() => onPartClick?.('tank')}>
        <cylinderGeometry args={[0.3, 0.4, 0.6, 8]} />
        <meshStandardMaterial 
          color={selectedParts.tank === 'Cafe Style' ? '#ff6b6b' : '#4a90e2'} 
          metalness={0.9} 
          roughness={0.1} 
        />
        <Html position={[0, 0.4, 0]} center>
          <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs pointer-events-none">
            Tank
          </div>
        </Html>
      </mesh>
      
      {/* Seat */}
      <mesh position={[-0.5, 0.7, 0]} onClick={() => onPartClick?.('seat')}>
        <boxGeometry args={[0.8, 0.1, 0.4]} />
        <meshStandardMaterial 
          color={selectedParts.seat === 'Single Seat' ? '#8b4513' : '#000'} 
          roughness={0.8} 
        />
        <Html position={[0, 0.2, 0]} center>
          <div className="bg-green-500 text-white px-2 py-1 rounded text-xs pointer-events-none">
            Seat
          </div>
        </Html>
      </mesh>
      
      {/* Front Wheel */}
      <mesh position={[1.2, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]} onClick={() => onPartClick?.('tires')}>
        <torusGeometry args={[0.4, 0.1, 8, 16]} />
        <meshStandardMaterial 
          color={selectedParts.tires === 'Sport' ? '#ff4757' : '#2f3542'} 
          roughness={0.9} 
        />
      </mesh>
      
      {/* Rear Wheel */}
      <mesh position={[-1.2, -0.3, 0]} rotation={[Math.PI / 2, 0, 0]} onClick={() => onPartClick?.('tires')}>
        <torusGeometry args={[0.4, 0.1, 8, 16]} />
        <meshStandardMaterial 
          color={selectedParts.tires === 'Sport' ? '#ff4757' : '#2f3542'} 
          roughness={0.9} 
        />
      </mesh>
      
      {/* Headlight */}
      <mesh position={[1.4, 0.5, 0]} onClick={() => onPartClick?.('lights')}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshStandardMaterial 
          color={selectedParts.lights === 'LED' ? '#fff' : '#f1c40f'} 
          emissive={selectedParts.lights === 'LED' ? '#fff' : '#f1c40f'} 
          emissiveIntensity={0.3} 
        />
        <Html position={[0, 0.3, 0]} center>
          <div className="bg-yellow-500 text-white px-2 py-1 rounded text-xs pointer-events-none">
            Light
          </div>
        </Html>
      </mesh>
      
      {/* Exhaust */}
      <mesh position={[-0.8, -0.2, -0.3]} rotation={[0, 0, -0.3]} onClick={() => onPartClick?.('exhaust')}>
        <cylinderGeometry args={[0.05, 0.08, 0.8, 8]} />
        <meshStandardMaterial 
          color={selectedParts.exhaust === 'Performance' ? '#c0392b' : '#7f8c8d'} 
          metalness={0.8} 
          roughness={0.3} 
        />
        <Html position={[0, 0.5, 0]} center>
          <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs pointer-events-none">
            Exhaust
          </div>
        </Html>
      </mesh>
      
      {/* Suspension/Shockers */}
      <mesh position={[1, -0.8, 0]} onClick={() => onPartClick?.('shockers')}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
        <meshStandardMaterial 
          color={selectedParts.shockers === 'Air Suspension' ? '#e74c3c' : '#34495e'} 
          metalness={0.7} 
          roughness={0.4} 
        />
      </mesh>
      <mesh position={[-1, -0.8, 0]} onClick={() => onPartClick?.('shockers')}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
        <meshStandardMaterial 
          color={selectedParts.shockers === 'Air Suspension' ? '#e74c3c' : '#34495e'} 
          metalness={0.7} 
          roughness={0.4} 
        />
        <Html position={[0, 0.4, 0]} center>
          <div className="bg-red-500 text-white px-2 py-1 rounded text-xs pointer-events-none">
            Suspension
          </div>
        </Html>
      </mesh>

      {/* Additional bike parts for more realism */}
      {/* Handlebars */}
      <mesh position={[1.3, 0.9, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
        <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.3} />
      </mesh>
      
      {/* Fork */}
      <mesh position={[1.2, 0.1, 0.15]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
        <meshStandardMaterial color="#34495e" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[1.2, 0.1, -0.15]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
        <meshStandardMaterial color="#34495e" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Engine block */}
      <mesh position={[0, 0.2, 0]}>
        <boxGeometry args={[0.6, 0.4, 0.4]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.4} />
      </mesh>
    </group>
  );
}

// Loading component
function Loader() {
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-gray-600">Loading 3D Model...</p>
      </div>
    </Html>
  );
}

export default function BikeViewer3D({ selectedParts, onPartClick }: BikeViewer3DProps) {
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([4, 2, 4]);
  
  const resetView = () => {
    setCameraPosition([4, 2, 4]);
  };
  
  const zoomIn = () => {
    setCameraPosition(prev => [prev[0] * 0.8, prev[1] * 0.8, prev[2] * 0.8]);
  };
  
  const zoomOut = () => {
    setCameraPosition(prev => [prev[0] * 1.2, prev[1] * 1.2, prev[2] * 1.2]);
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden">
      <Canvas shadows camera={{ position: cameraPosition, fov: 50 }}>
        <Suspense fallback={<Loader />}>
          {/* Lighting */}
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          <pointLight position={[-10, -10, -10]} intensity={0.3} />
          
          {/* Environment */}
          <Environment preset="warehouse" />
          
          {/* 3D Bike Model */}
          <BikeModel selectedParts={selectedParts} onPartClick={onPartClick} />
          
          {/* Controls */}
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={2}
            maxDistance={10}
            maxPolarAngle={Math.PI / 1.8}
          />
          
          {/* Ground */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.5, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#2c3e50" roughness={0.8} metalness={0.1} />
          </mesh>
        </Suspense>
      </Canvas>
      
      {/* 3D Controls Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
        <div className="glass-effect rounded-lg px-3 py-2">
          <p className="text-white text-sm font-medium">
            Drag to rotate • Scroll to zoom • Click parts to customize
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            onClick={zoomIn}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            onClick={zoomOut}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            onClick={resetView}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      {/* Part Highlight Instructions */}
      <div className="absolute top-4 left-4 glass-effect rounded-lg px-3 py-2">
        <p className="text-white text-xs">
          Interactive 3D Model - Click colored hotspots to customize parts
        </p>
      </div>
    </div>
  );
}
