import React, { useEffect, useState } from 'react';

interface Meteor {
  id: number;
  top: number;
  left: number;
  size: number;
  duration: number;
  delay: number;
}

const MeteorShower: React.FC = () => {
  const [meteors, setMeteors] = useState<Meteor[]>([]);

  useEffect(() => {
    // Create 15 meteors with random properties
    const newMeteors: Meteor[] = [];
    for (let i = 0; i < 15; i++) {
      newMeteors.push({
        id: i,
        top: Math.random() * -50,
        left: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 2 + 1,
        delay: Math.random() * 15,
      });
    }
    setMeteors(newMeteors);

    // Regenerate meteors occasionally
    const interval = setInterval(() => {
      setMeteors(prevMeteors => {
        return prevMeteors.map(meteor => ({
          ...meteor,
          top: Math.random() * -50,
          left: Math.random() * 100,
          delay: Math.random() * 10,
        }));
      });
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="meteor-shower">
      {meteors.map((meteor) => (
        <div
          key={meteor.id}
          className="meteor"
          style={{
            top: `${meteor.top}%`,
            left: `${meteor.left}%`,
            width: `${meteor.size}px`,
            height: `${meteor.size * 50}px`,
            animationDuration: `${meteor.duration}s`,
            animationDelay: `${meteor.delay}s`,
          }}
        />
      ))}

      <style jsx>{`
        .meteor-shower {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 1;
          pointer-events: none;
        }
        
        .meteor {
          position: absolute;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.8));
          border-radius: 500px;
          filter: blur(1px);
          opacity: 0;
          transform: rotate(45deg);
          animation-name: meteor;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in;
        }
        
        @keyframes meteor {
          0% {
            opacity: 0;
            transform: translate(0, 0) rotate(215deg);
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(500px, 1000px) rotate(215deg);
          }
        }
      `}</style>
    </div>
  );
};

export default MeteorShower;