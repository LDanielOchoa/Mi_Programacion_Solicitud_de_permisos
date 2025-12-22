import React, { useEffect, useRef } from 'react';

const AstronautAnimation: React.FC = () => {
  const astronautRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const astronaut = astronautRef.current;
    if (!astronaut) return;

    // Add a slight floating animation
    let startY = 0;
    let floating = true;
    
    const floatAnimation = () => {
      if (!astronaut) return;
      
      startY += floating ? 0.1 : -0.1;
      
      if (startY > 10) floating = false;
      if (startY < 0) floating = true;
      
      astronaut.style.transform = `translateY(${startY}px) rotate(${startY / 2}deg)`;
      requestAnimationFrame(floatAnimation);
    };
    
    const animationId = requestAnimationFrame(floatAnimation);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div 
      ref={astronautRef} 
      className="astronaut"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      {/* Stylized Astronaut figure using div elements */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80px',
        height: '120px',
        background: 'white',
        borderRadius: '40px 40px 30px 30px',
        boxShadow: '0 0 20px rgba(255, 255, 255, 0.5), inset 0 0 10px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
      }}>
        {/* Visor */}
        <div style={{
          position: 'absolute',
          top: '15px',
          left: '10px',
          width: '60px',
          height: '35px',
          background: 'linear-gradient(45deg, #4a5568, #2d3748)',
          borderRadius: '20px',
          border: '2px solid #718096',
          boxShadow: 'inset 0 0 15px rgba(66, 153, 225, 0.5)',
          overflow: 'hidden',
        }}>
          {/* Reflection on visor */}
          <div style={{
            position: 'absolute',
            top: '5px',
            left: '5px',
            width: '15px',
            height: '5px',
            background: 'rgba(255, 255, 255, 0.7)',
            borderRadius: '50%',
            transform: 'rotate(30deg)',
          }}></div>
        </div>
        
        {/* Backpack */}
        <div style={{
          position: 'absolute',
          top: '50px',
          left: '-15px',
          width: '30px',
          height: '50px',
          background: '#e2e8f0',
          borderRadius: '5px',
          border: '1px solid #cbd5e0',
          zIndex: -1,
        }}></div>
        
        {/* Right arm */}
        <div style={{
          position: 'absolute',
          top: '50px',
          right: '-10px',
          width: '25px',
          height: '15px',
          background: 'white',
          borderRadius: '10px',
          transform: 'rotate(-30deg)',
          transformOrigin: 'left center',
          animation: 'waving 2s ease-in-out infinite',
        }}></div>
        
        {/* Left arm */}
        <div style={{
          position: 'absolute',
          top: '50px',
          left: '-10px',
          width: '25px',
          height: '15px',
          background: 'white',
          borderRadius: '10px',
          transform: 'rotate(20deg)',
          transformOrigin: 'right center',
        }}></div>
        
        {/* Legs */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '15px',
          width: '20px',
          height: '30px',
          background: 'white',
          borderRadius: '10px 10px 0 0',
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '0',
          right: '15px',
          width: '20px',
          height: '30px',
          background: 'white',
          borderRadius: '10px 10px 0 0',
        }}></div>
        
        {/* Oxygen tube */}
        <div style={{
          position: 'absolute',
          top: '30px',
          right: '-5px',
          width: '30px',
          height: '5px',
          background: '#cbd5e0',
          borderRadius: '5px',
          transform: 'rotate(-10deg)',
          zIndex: -1,
        }}></div>
      </div>

      {/* Floating string/tether */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '50%',
        width: '2px',
        height: '50px',
        background: 'linear-gradient(to bottom, transparent, rgba(255, 255, 255, 0.7))',
        transformOrigin: 'top center',
        zIndex: -1,
      }}></div>

      <style jsx>{`
        @keyframes waving {
          0%, 100% { transform: rotate(-30deg); }
          50% { transform: rotate(-10deg); }
        }
      `}</style>
    </div>
  );
};

export default AstronautAnimation;