
import React, { useState, useEffect, useRef } from 'react';
import { getStationsByTag } from '../services/radioService.js';
import { PlayIcon } from './Icons.jsx';
import Spinner from './Spinner.jsx';

const HeroSlider = ({ onPlayStation, t }) => {
    const [slides, setSlides] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const timeoutRef = useRef(null);

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    useEffect(() => {
        const fetchTopLatinStations = async () => {
            setIsLoading(true);
            try {
                const stations = await getStationsByTag('latino', 20);
                const stationsWithImages = stations.filter(s => s.favicon && !s.favicon.includes('dicebear'));
                setSlides(stationsWithImages.slice(0, 10)); // Limit to max 10 slides
            } catch (error) {
                console.error("Failed to fetch slides for hero", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTopLatinStations();
    }, []);

    useEffect(() => {
        resetTimeout();
        if (slides.length > 0) {
            timeoutRef.current = window.setTimeout(
                () => setCurrentIndex((prevIndex) => (prevIndex === slides.length - 1 ? 0 : prevIndex + 1)),
                5000 // Change slide every 5 seconds
            );
        }
        return () => {
            resetTimeout();
        };
    }, [currentIndex, slides.length]);

    if (isLoading) {
        return (
            <div className="relative w-full h-64 md:h-80 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center mb-6">
                <Spinner className="w-8 h-8 text-brand-500" />
            </div>
        )
    }

    if (slides.length === 0) {
        return null; // Don't render slider if no suitable stations found
    }

    const currentSlide = slides[currentIndex];

    return (
        <div className="relative w-full h-64 md:h-80 rounded-2xl shadow-2xl overflow-hidden mb-8 group">
            {/* Background Image */}
            <div 
                className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out transform group-hover:scale-110"
                style={{ backgroundImage: `url(${currentSlide.favicon})` }}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-md"></div>
            </div>

            <div className="relative z-10 flex flex-col justify-end h-full p-6 md:p-8 text-white">
                <div className="flex items-center gap-4">
                    <img src={currentSlide.favicon} alt={currentSlide.name} className="w-20 h-20 md:w-24 md:h-24 rounded-lg object-cover shadow-lg border-2 border-white/20"/>
                    <div className="flex-grow min-w-0">
                         <h2 className="text-2xl md:text-4xl font-black tracking-tight text-shadow">{currentSlide.name}</h2>
                         <p className="text-sm md:text-base opacity-80 truncate">{currentSlide.country}, {currentSlide.language.split(',')[0]}</p>
                    </div>
                    <button
                        onClick={() => onPlayStation(currentSlide)}
                        className="p-4 bg-brand-500 text-white rounded-full hover:bg-brand-600 transition-all duration-300 scale-100 group-hover:scale-110 focus:outline-none focus:ring-4 focus:ring-brand-500/50 shadow-xl flex-shrink-0"
                        aria-label={`Play ${currentSlide.name}`}
                    >
                        <PlayIcon className="w-8 h-8"/>
                    </button>
                </div>
            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${currentIndex === index ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white'}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroSlider;