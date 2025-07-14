import React from 'react';

const Planets: React.FC = () => {
  return (
    <div className="planets-container">
      {/* Planet 1 - Large planet in background */}
      <div className="planet planet-1"></div>
      
      {/* Planet 2 - Small planet in foreground */}
      <div className="planet planet-2"></div>
      
      {/* Planet 3 - Medium planet with ring */}
      <div className="planet planet-3">
        <div className="planet-ring"></div>
      </div>

      {/* CSS for planets */}
      <style jsx>{`
        .planets-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 2;
        }
        
        .planet {
          position: absolute;
          border-radius: 50%;
          box-shadow: inset 4px -3px 20px rgba(0, 0, 0, 0.5);
        }
        
        .planet-1 {
          width: 300px;
          height: 300px;
          background: linear-gradient(45deg, #047857, #065f46);
          top: -100px;
          right: -50px;
          opacity: 0.4;
          filter: blur(4px);
        }
        
        .planet-2 {
          width: 80px;
          height: 80px;
          background: linear-gradient(45deg, #10b981, #34d399);
          bottom: 50px;
          left: 100px;
          opacity: 0.6;
          animation: float 15s ease-in-out infinite;
        }
        
        .planet-3 {
          width: 140px;
          height: 140px;
          background: linear-gradient(45deg, #059669, #10b981);
          top: 30%;
          right: 15%;
          opacity: 0.7;
          animation: float 20s ease-in-out infinite reverse;
          position: relative;
        }
        
        .planet-ring {
          position: absolute;
          width: 200px;
          height: 40px;
          border-radius: 50%;
          border: 4px solid rgba(255, 255, 255, 0.3);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(30deg);
          box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @media (max-width: 768px) {
          .planet-1 {
            width: 200px;
            height: 200px;
            top: -80px;
            right: -40px;
          }
          
          .planet-2 {
            width: 60px;
            height: 60px;
            bottom: 40px;
            left: 60px;
          }
          
          .planet-3 {
            width: 100px;
            height: 100px;
          }
          
          .planet-ring {
            width: 140px;
            height: 30px;
          }
        }
      `}</style>
    </div>
  );
};

export default Planets;