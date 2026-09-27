import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import allImagesData from '../data/images.json';

const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);
export default function Challenge({ onComplete, onCancel }) {
  const imagesData = useMemo(() => {
    const easy = shuffle(allImagesData.filter(i => i.difficulty === 'easy')).slice(0, 2);
    const hard = shuffle(allImagesData.filter(i => i.difficulty === 'hard')).slice(0, 2);
    const superHard = shuffle(allImagesData.filter(i => i.difficulty === 'super_hard')).slice(0, 1);
    return [...easy, ...hard, ...superHard];
  }, []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [lifelines, setLifelines] = useState({ fiftyFifty: true, hint: true, plusTime: true });
  const [activeHint, setActiveHint] = useState(null);
  const [hiddenOptions, setHiddenOptions] = useState([]);
  const [isLocked, setIsLocked] = useState(false);
  
  const timerRef = useRef(null);
  const deadlineRef = useRef(0);
  const advanceRef = useRef(null);
  const lockedRef = useRef(false);
  const currentImg = imagesData[currentIndex];

  const handleAnswer = useCallback((selectedOption) => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setIsLocked(true);
    clearInterval(timerRef.current);
    const isCorrect = selectedOption === imagesData[currentIndex].correctAnswer;
    const nextScore = score + Number(isCorrect);
    if (isCorrect) setScore(nextScore);
    
    advanceRef.current = setTimeout(() => {
      if (currentIndex + 1 < imagesData.length) {
         setCurrentIndex(currentIndex + 1);
         lockedRef.current = false;
         setIsLocked(false);
         // Reset state for next question without triggering effect warnings
         setTimeLeft(30);
         setActiveHint(null);
         setHiddenOptions([]);
         deadlineRef.current = Date.now() + 30000;
         timerRef.current = setInterval(() => setTimeLeft(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000))), 100);
      }
      else onComplete(nextScore);
    }, 500);
  }, [currentIndex, imagesData, score, onComplete]);

  // Use a ref for the answer handler to use in the timer effect without deps issues
  const handleAnswerRef = useRef(handleAnswer);
  useEffect(() => { handleAnswerRef.current = handleAnswer; }, [handleAnswer]);

  useEffect(() => {
    lockedRef.current = false;
    deadlineRef.current = Date.now() + 30000;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0) {
        clearInterval(timerRef.current);
        handleAnswerRef.current(null);
      }
    }, 100);
    return () => { clearInterval(timerRef.current); clearTimeout(advanceRef.current); };
  }, []); // Run only on mount

  const cancel = () => {
    if (window.confirm('Leave this attempt? Your answers will not be saved.')) {
      clearInterval(timerRef.current);
      clearTimeout(advanceRef.current);
      onCancel();
    }
  };
  
  const useFiftyFifty = () => {
    if (!lifelines.fiftyFifty || isLocked) return;
    setLifelines((value) => ({ ...value, fiftyFifty: false }));
    setHiddenOptions([...currentImg.options.filter((option) => option !== currentImg.correctAnswer)].sort(() => Math.random() - .5).slice(0, 2));
  };
  
  const useHint = () => {
    if (!lifelines.hint || isLocked) return;
    setLifelines((value) => ({ ...value, hint: false }));
    setActiveHint(currentImg.hint);
  };
  
  const usePlusTime = () => {
    if (!lifelines.plusTime || isLocked) return;
    setLifelines((value) => ({ ...value, plusTime: false }));
    deadlineRef.current += 10000;
  };

  return <main className="micro-challenge">
    <div className="micro-game-top"><span className="micro-game-label">THE TINY STUFF EDITION</span><button className="micro-cancel" type="button" onClick={cancel}>← CANCEL ATTEMPT</button></div>
    <div className="micro-game-status"><div><span>CASE</span><strong>{String(currentIndex + 1).padStart(2, '0')} <small>/ {String(imagesData.length).padStart(2, '0')}</small></strong></div><div className={`micro-timer ${timeLeft <= 5 ? 'danger' : ''}`}><span>SECONDS LEFT</span><strong>{timeLeft}</strong></div></div>
    <div className="micro-progress" aria-hidden="true"><span style={{ width: `${((currentIndex + 1) / imagesData.length) * 100}%` }}/></div>
    <div className="micro-game-layout">
      <motion.div key={currentImg.id} className="macro-image-frame" initial={{ rotate: -4, opacity: 0 }} animate={{ rotate: -2, opacity: 1 }}><img src={currentImg.imageUrl} alt={`Illustrated mystery specimen ${currentIndex + 1}`}/><span className="micro-photo-tag">ILLUSTRATED EVIDENCE #{currentIndex + 1}</span></motion.div>
      <section className="micro-question"><p className="micro-kicker">OBSERVE CLOSELY. GUESS WILDLY.</p><h2>What on earth <em>is this?</em></h2><p className="micro-question-note">Pick your best guess before the clock rats you out.</p>
        {activeHint && <div className="micro-hint"><strong>CLASSIFIED HINT:</strong> {activeHint}</div>}
        <div className="micro-options">{currentImg.options.map((option, index) => <button key={option} className="micro-option" disabled={hiddenOptions.includes(option) || isLocked} onClick={() => handleAnswer(option)}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
      </section>
    </div>
    <div className="micro-lifelines"><strong>NEED A HAND?</strong><button onClick={useFiftyFifty} disabled={!lifelines.fiftyFifty || isLocked}>✂ 50 / 50</button><button onClick={useHint} disabled={!lifelines.hint || isLocked}>✳ HINT</button><button onClick={usePlusTime} disabled={!lifelines.plusTime || isLocked}>⏱ +10 SEC</button></div>
  </main>;
}
