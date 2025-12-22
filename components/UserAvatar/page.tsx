import React, { useState, useEffect, useRef, memo } from 'react';

interface UserAvatarProps {
  cedula: string;
  alt: string;
  className?: string;
  defaultAvatar: string;
}

// Función para generar iniciales del nombre
const generateInitials = (name: string) => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  return initials;
};

const UserAvatar: React.FC<UserAvatarProps> = memo(({ cedula, alt, className, defaultAvatar }) => {
  const [imgSrc, setImgSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const [showInitials, setShowInitials] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Intersection Observer para lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Cache para URLs de imágenes ya verificadas
  const imageCache = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (!isInView || !cedula) {
      setShowInitials(true);
      setIsLoading(false);
      return;
    }

    // Verificar cache primero
    if (imageCache.current.has(cedula)) {
      const cachedUrl = imageCache.current.get(cedula)!;
      if (cachedUrl) {
        setImgSrc(cachedUrl);
        setShowInitials(false);
      } else {
        setShowInitials(true);
      }
      setIsLoading(false);
      return;
    }

    const checkImage = (url: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(url);
        img.onerror = () => reject();
        // Timeout para evitar esperas largas
        setTimeout(() => reject(), 3000);
      });
    };

    const findAvatar = async () => {
      setIsLoading(true);
      const baseUrl = 'https://admon.sao6.com.co/web/uploads/empleados/';
      const extensions = ['jpg', 'jpeg', 'png'];

      for (const ext of extensions) {
        try {
          const url = `${baseUrl}${cedula}.${ext}`;
          await checkImage(url);
          // Guardar en cache
          imageCache.current.set(cedula, url);
          setImgSrc(url);
          setShowInitials(false);
          setIsLoading(false);
          return;
        } catch (error) {
          // Continue to the next extension
        }
      }
      
      // Si no se encuentra ninguna imagen, usar iniciales y guardar en cache
      imageCache.current.set(cedula, '');
      setShowInitials(true);
      setIsLoading(false);
    };

    findAvatar();
  }, [cedula, isInView]);

  // Si no hay cedula o se debe mostrar iniciales
  if (!cedula || showInitials) {
    return (
      <div className={`${className} bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-lg`}>
        {generateInitials(alt)}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <img
        ref={imgRef}
        src={imgSrc}
        alt={alt}
        className={`${className} transition-opacity duration-300 ${isLoading ? 'opacity-70' : 'opacity-100'}`}
        onError={() => {
          setShowInitials(true);
          // Actualizar cache con fallback
          imageCache.current.set(cedula, '');
        }}
        loading="lazy"
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-2xl">
          <div className="w-6 h-6 border-2 border-emerald-300 border-t-emerald-600 rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
});

UserAvatar.displayName = 'UserAvatar';

export default UserAvatar; 