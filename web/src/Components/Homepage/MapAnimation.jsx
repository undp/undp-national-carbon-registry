import React, { useEffect, useRef, useState } from 'react';
import styles from './MapAnimation.module.scss';
import MapSVG from '../../Assets/Images/animated-map-updated.svg'; // Use SVGR

const MapAnimation = () => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          const targetElements = mapRef.current.querySelectorAll('.animate-target');
          const textElements = mapRef.current.querySelectorAll('text');

          targetElements.forEach((el, i) => {
            el.style.animationDelay = `${i * 0.1}s`;
            el.classList.add(styles.mapElement);
          });

          textElements.forEach((el, i) => {
            el.style.animationDelay = `${1 + i * 0.2}s`;
            el.classList.add(styles.textLabel);
          });

          setHasAnimated(true); // Prevent retriggering
          observer.unobserve(containerRef.current); // Optional: stop observing once triggered
        }
      },
      {
        threshold: 0.05, // Trigger when 30% is visible
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect(); // Cleanup on unmount
  }, [hasAnimated]);

  return (
    <div ref={containerRef} className={styles.mapContainer}>
      <MapSVG ref={mapRef} className={styles.animatedMap} />
    </div>
  );
};

export default MapAnimation;
