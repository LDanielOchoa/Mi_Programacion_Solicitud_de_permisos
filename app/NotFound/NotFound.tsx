import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import AstronautAnimation from './AstronautAnimation';
import Planets from './Planets';
import Starfield from './Starfield';
import MeteorShower from './MeteorShower';
import './NotFound.css';

const NotFound: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="not-found-container">
      <Starfield />
      <MeteorShower />
      
      <div className={`content-wrapper ${visible ? 'visible' : ''}`}>
        <Planets />
        
        <div className="glass-panel">
          <div className="error-content">
            <div className="maintenance-icon">
              <Clock 
                size={36}
                className="text-emerald-400"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(52, 211, 153, 0.3))'
                }}
              />
            </div>
            
            <h1 className="maintenance-title">
              Mantenimiento Programado
            </h1>
            
            <p className="maintenance-message">
              Nuestro sistema se encuentra temporalmente inhabilitado
            </p>
            
            <div className="astronaut-container">
              <AstronautAnimation />
            </div>
            
            <div className="maintenance-details">
              <span>Estaremos de vuelta el</span>
              <span className="maintenance-date">jueves 21 de mayo</span>
              <span>a las</span>
              <span className="maintenance-time">9:00 de la mañana</span>
            </div>
            
            <p className="maintenance-thanks">
              ¡Gracias por su comprensión!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;