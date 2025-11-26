
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, MathProblem, Difficulty, MistakeRecord, Language, HistoryRecord } from './types';
import { generateQuestions } from './services/geminiService';
import { audioService } from './services/audioEngine';
import Keypad from './components/Keypad';
import ProgressBar from './components/ProgressBar';
import { translations } from './utils/translations';
import { TRex, Triceratops, Pterodactyl, DinoEgg, Footprint } from './components/DinoIcons';

const App: React.FC = () => {
  // --- STATE ---
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [language, setLanguage] = useState<Language>('zh'); 
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [questionCount, setQuestionCount] = useState<number>(10);
  
  const [problems, setProblems] = useState<MathProblem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'incorrect'>('none');
  const [isShaking, setIsShaking] = useState(false);
  
  // Audio State
  const [isMuted, setIsMuted] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  // Game Stats
  const [mistakes, setMistakes] = useState<MistakeRecord[]>([]);
  const [gameStartTime, setGameStartTime] = useState<number>(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [questionTimeTaken, setQuestionTimeTaken] = useState<number>(0);
  const [totalTimeTaken, setTotalTimeTaken] = useState<number>(0);
  const [evaluation, setEvaluation] = useState<string>('');
  
  // Persistence
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [persistentMistakes, setPersistentMistakes] = useState<MistakeRecord[]>([]);

  const t = translations[language];

  // --- PERSISTENCE EFFECT ---
  useEffect(() => {
    const savedHistory = localStorage.getItem('math-history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedMistakes = localStorage.getItem('math-mistakes');
    if (savedMistakes) setPersistentMistakes(JSON.parse(savedMistakes));
  }, []);

  // --- GLOBAL AUDIO INIT ---
  // Browsers require user interaction to start AudioContext.
  // We capture the first click anywhere on the app to start the BGM.
  useEffect(() => {
    const initAudio = () => {
        if (!audioInitialized) {
            audioService.init();
            setAudioInitialized(true);
        }
    };

    window.addEventListener('click', initAudio);
    window.addEventListener('touchstart', initAudio);

    return () => {
        window.removeEventListener('click', initAudio);
        window.removeEventListener('touchstart', initAudio);
    };
  }, [audioInitialized]);


  const saveHistory = (record: HistoryRecord) => {
    const newHistory = [record, ...history].slice(0, 10); // Keep last 10
    setHistory(newHistory);
    localStorage.setItem('math-history', JSON.stringify(newHistory));
  };

  const saveMistake = (mistake: MistakeRecord) => {
    const exists = persistentMistakes.some(m => m.problem.id === mistake.problem.id);
    if (!exists) {
      const newMistakes = [...persistentMistakes, mistake];
      setPersistentMistakes(newMistakes);
      localStorage.setItem('math-mistakes', JSON.stringify(newMistakes));
    }
  };

  const removeMistakes = (problemIds: string[]) => {
     const newMistakes = persistentMistakes.filter(m => !problemIds.includes(m.problem.id));
     setPersistentMistakes(newMistakes);
     localStorage.setItem('math-mistakes', JSON.stringify(newMistakes));
  }

  // --- AUDIO LOGIC ---
  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent re-triggering initAudio
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    audioService.setMute(newMuteState);
  };

  // --- GAME LOGIC ---
  const startGame = async () => {
    audioService.playClick();
    setGameState(GameState.LOADING);
    setScore(0);
    setCurrentIndex(0);
    setCurrentInput('');
    setFeedback('none');
    setMistakes([]); 
    setTotalTimeTaken(0);
    
    const newProblems = await generateQuestions(questionCount, difficulty);
    setProblems(newProblems);
    setGameStartTime(Date.now());
    setGameState(GameState.PLAYING);
  };

  const practiceSpecificMistakes = () => {
    if (persistentMistakes.length === 0) return;
    audioService.playClick();
    
    setDifficulty('medium'); 
    setGameState(GameState.LOADING);
    setScore(0);
    setCurrentIndex(0);
    setCurrentInput('');
    setFeedback('none');
    setTotalTimeTaken(0);
    
    // Take up to 10 mistakes to practice
    const practiceSet = persistentMistakes.slice(0, 10).map(m => m.problem);
    setProblems(practiceSet);
    setGameStartTime(Date.now());
    setGameState(GameState.PLAYING);
  }

  const exitGame = () => {
    audioService.playClick();
    setGameState(GameState.START);
  };

  useEffect(() => {
    if (gameState === GameState.PLAYING && feedback === 'none') {
      setQuestionStartTime(Date.now());
    }
  }, [currentIndex, gameState, feedback]);

  const getEvaluationMessage = (seconds: number) => {
    if (seconds < 4) return t.excellent;
    if (seconds < 8) return t.good;
    return t.keep_trying;
  };

  const handleInput = (val: string) => {
    if (feedback !== 'none') return;
    if (currentInput.length < 5) {
      audioService.playClick();
      setCurrentInput((prev) => prev + val);
    }
  };

  const handleDelete = () => {
    if (feedback !== 'none') return;
    audioService.playClick();
    setCurrentInput((prev) => prev.slice(0, -1));
  };

  const handleSubmit = useCallback(() => {
    if (feedback !== 'none' || currentInput === '') return;

    // Calculate time stats first
    const endTime = Date.now();
    const duration = (endTime - questionStartTime) / 1000;
    setQuestionTimeTaken(duration);
    setEvaluation(getEvaluationMessage(duration));

    const currentProblem = problems[currentIndex];
    const userAnswer = parseInt(currentInput, 10);
    const isCorrect = userAnswer === currentProblem.answer;

    if (isCorrect) {
      // Play distinct sounds based on speed
      if (duration < 4) {
        audioService.playCorrect(); 
      } else {
        audioService.playCorrectSimple();
      }
      
      setFeedback('correct');
      setScore((prev) => prev + 1);
      
      if (persistentMistakes.some(m => m.problem.id === currentProblem.id)) {
        removeMistakes([currentProblem.id]);
      }

    } else {
      audioService.playWrong(); 
      setFeedback('incorrect');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      
      const mistRecord: MistakeRecord = {
          id: Date.now().toString(),
          problem: currentProblem,
          userAnswer,
          timestamp: Date.now()
      };
      setMistakes(prev => [...prev, mistRecord]);
      saveMistake(mistRecord);
    }

    setTimeout(() => {
      setFeedback('none');
      setCurrentInput('');
      
      if (currentIndex < problems.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else {
        finishGame();
      }
    }, 2000);
  }, [currentInput, problems, currentIndex, feedback, questionStartTime, persistentMistakes]);

  const finishGame = () => {
    const totalDuration = (Date.now() - gameStartTime) / 1000;
    setTotalTimeTaken(totalDuration);
    audioService.playCorrect(); // Final victory sound
    
    setGameState(GameState.FINISHED);
    
    const isPractice = problems.length <= persistentMistakes.length && problems.every(p => persistentMistakes.some(pm => pm.problem.id === p.id));
    
    if (!isPractice) {
        saveHistory({
            id: Date.now().toString(),
            timestamp: Date.now(),
            score: score + (feedback === 'correct' ? 1 : 0),
            totalQuestions: problems.length,
            totalTimeSeconds: totalDuration,
            difficulty: difficulty
        });
    }
  };

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING) return;
      
      if (e.key >= '0' && e.key <= '9') {
        handleInput(e.key);
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentInput, handleSubmit]);

  const getBestScore = () => {
      if (history.length === 0) return null;
      return [...history].sort((a, b) => {
          const rateA = a.score / a.totalQuestions;
          const rateB = b.score / b.totalQuestions;
          if (rateA !== rateB) return rateB - rateA;
          return a.totalTimeSeconds - b.totalTimeSeconds;
      })[0];
  }

  const bestRecord = getBestScore();

  return (
    <div className="min-h-screen flex flex-col items-center p-4 font-sans text-gray-800">
      
      {/* Header */}
      <div className="w-full max-w-lg flex justify-between items-center mb-4 z-10">
         <div className="flex items-center gap-2">
             <div className="bg-white p-2 rounded-full shadow-md">
                 <Footprint className="w-6 h-6 text-dino-brown" />
             </div>
             <h1 className="text-xl md:text-2xl font-black text-dino-dark-green tracking-tight">
                {t.title}
             </h1>
         </div>
         <div className="flex gap-2">
            <button 
                onClick={toggleMute}
                className={`w-10 h-10 rounded-full shadow-md flex items-center justify-center border transition-all ${isMuted ? 'bg-red-100 border-red-200 text-red-500' : 'bg-white border-gray-100 text-dino-green'}`}
            >
                {isMuted ? '🔇' : '🔊'}
            </button>
            <button 
                onClick={() => setLanguage(l => l === 'en' ? 'zh' : 'en')}
                className="px-3 py-1 bg-white rounded-full shadow-md text-sm font-bold text-dino-brown hover:bg-gray-50 border border-gray-100"
            >
                {language === 'en' ? '🇨🇳' : '🇺🇸'}
            </button>
         </div>
      </div>

      {/* --- START SCREEN --- */}
      {gameState === GameState.START && (
        <div className="bg-white/90 backdrop-blur-sm p-6 rounded-[2rem] shadow-xl w-full max-w-md animate-pop border-4 border-dino-cream relative overflow-hidden">
          
          {/* Story Intro Bubble */}
          <div className="mb-6 relative bg-dino-sky/20 p-4 rounded-xl border border-dino-sky/50">
             <div className="absolute -top-6 -right-2">
                 <Pterodactyl className="w-16 h-16 text-dino-green animate-waddle" />
             </div>
             <p className="text-dino-dark-green font-bold text-sm leading-relaxed pr-8">
                 {t.story_intro}
             </p>
          </div>

          {/* Best Score */}
          {bestRecord && (
             <div className="mb-4 bg-yellow-50 border border-yellow-200 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <div>
                        <div className="text-xs text-yellow-700 font-bold uppercase">{t.best_score}</div>
                        <div className="text-sm font-bold text-gray-700">
                             {bestRecord.score}/{bestRecord.totalQuestions} • {Math.round(bestRecord.totalTimeSeconds)}{t.seconds}
                        </div>
                    </div>
                </div>
                <div className="text-xs bg-yellow-200 px-2 py-1 rounded text-yellow-800 font-bold">
                    {bestRecord.difficulty === 'easy' ? 'Baby' : bestRecord.difficulty === 'medium' ? 'Jungle' : 'Volcano'}
                </div>
             </div>
          )}

          {/* Settings */}
          <div className="mb-6 space-y-4">
             <div>
                <label className="block text-dino-brown text-sm font-bold mb-2 ml-1 flex items-center gap-1">
                    <DinoEgg className="w-4 h-4" /> {t.select_count}
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 20].map(c => (
                        <button 
                            key={c}
                            onClick={() => { audioService.playClick(); setQuestionCount(c); }}
                            className={`py-2 rounded-xl font-bold border-b-4 transition-all ${questionCount === c ? 'border-dino-dark-green bg-dino-green text-white shadow-md' : 'border-gray-200 bg-gray-50 text-gray-400'}`}
                        >
                            {c} {t.questions}
                        </button>
                    ))}
                </div>
             </div>

             <div>
                <label className="block text-dino-brown text-sm font-bold mb-2 ml-1 flex items-center gap-1">
                    <Footprint className="w-4 h-4" /> {t.select_level}
                </label>
                <div className="space-y-2">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map(d => (
                        <button
                            key={d}
                            onClick={() => { audioService.playClick(); setDifficulty(d); }}
                            className={`w-full py-3 px-4 rounded-xl flex items-center justify-between border-b-4 transition-all ${difficulty === d 
                                ? d === 'easy' ? 'border-green-600 bg-green-100 text-green-800' 
                                : d === 'medium' ? 'border-blue-600 bg-blue-100 text-blue-800'
                                : 'border-red-600 bg-red-100 text-red-800'
                                : 'border-gray-200 bg-white text-gray-400'
                            }`}
                        >
                            <span className="font-bold">{t[d]}</span>
                            {difficulty === d && <TRex className="w-6 h-6" />}
                        </button>
                    ))}
                </div>
             </div>
          </div>
          
          <button
            onClick={startGame}
            className="w-full py-4 bg-dino-orange hover:bg-orange-400 text-white text-xl font-black rounded-2xl shadow-[0_6px_0_#e65100] active:shadow-none active:translate-y-2 transition-all mb-3 flex items-center justify-center gap-3"
          >
             <TRex className="w-8 h-8" />
             {t.start_game}
          </button>

          <div className="grid grid-cols-2 gap-3">
             <button
                onClick={() => { audioService.playClick(); setGameState(GameState.HISTORY); }}
                className="py-3 bg-white border-2 border-gray-100 hover:bg-gray-50 text-gray-600 font-bold rounded-xl"
             >
                📜 {t.history}
             </button>
             <button
                onClick={() => { audioService.playClick(); setGameState(GameState.MISTAKES_MENU); }}
                className="py-3 bg-red-50 border-2 border-red-100 hover:bg-red-100 text-red-600 font-bold rounded-xl relative"
             >
                📓 {t.mistakes}
                {persistentMistakes.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-white">
                        {persistentMistakes.length}
                    </span>
                )}
             </button>
          </div>
        </div>
      )}

      {/* --- LOADING SCREEN --- */}
      {gameState === GameState.LOADING && (
        <div className="flex flex-col items-center animate-pulse mt-32">
          <div className="relative">
             <DinoEgg className="w-24 h-24 text-dino-cream animate-bounce" />
             <div className="absolute -bottom-2 w-full h-4 bg-black/10 rounded-full blur-sm"></div>
          </div>
          <p className="text-2xl text-dino-dark-green font-bold mt-6 text-shadow-sm">{t.loading}</p>
        </div>
      )}

      {/* --- GAMEPLAY SCREEN --- */}
      {gameState === GameState.PLAYING && problems.length > 0 && (
        <div className="w-full max-w-lg flex flex-col items-center z-10">
          
          <ProgressBar current={currentIndex + 1} total={problems.length} />

          {/* Question Card */}
          <div className={`
            relative bg-white w-full p-6 rounded-[2rem] shadow-xl mb-4 text-center border-b-8
            transition-all duration-300
            ${isShaking ? 'animate-shake border-red-300' : 'border-gray-200'}
            ${feedback === 'correct' ? 'border-dino-green' : ''}
          `}>
             {/* Decorative Dinos */}
             <div className="absolute -top-8 left-4 w-12 h-12">
                 {feedback === 'correct' ? (
                     <TRex className="w-full h-full text-dino-green animate-bounce-short" />
                 ) : feedback === 'incorrect' ? (
                     <TRex className="w-full h-full text-red-500 rotate-12" />
                 ) : (
                     <Triceratops className="w-full h-full text-dino-brown" />
                 )}
             </div>

            {/* Feedback Overlay */}
            {feedback !== 'none' && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center rounded-[1.5rem] z-20 animate-pop bg-opacity-95 backdrop-blur-sm ${feedback === 'correct' ? 'bg-green-50' : 'bg-red-50'}`}>
                {feedback === 'correct' ? (
                  <>
                    <span className="text-6xl mb-2">🦖</span>
                    <span className="text-2xl font-black text-dino-dark-green">{t.correct}</span>
                    <span className="text-lg font-bold text-dino-green mt-1">{evaluation}</span>
                  </>
                ) : (
                  <>
                    <span className="text-5xl mb-1">🦕</span>
                    <span className="text-2xl font-black text-red-500 mb-1">{t.wrong}</span>
                    <span className="text-xl text-gray-600 bg-white px-4 py-1 rounded-lg shadow-sm border border-gray-100">
                         {problems[currentIndex].questionText} = <b>{problems[currentIndex].answer}</b>
                    </span>
                  </>
                )}
              </div>
            )}
            
            <div className="text-6xl font-black text-gray-800 mb-6 tracking-tight h-24 flex items-center justify-center font-mono">
              {problems[currentIndex].questionText}
            </div>
            
            <div className="h-20 bg-gray-50 rounded-2xl flex items-center justify-center text-5xl font-mono border-2 border-gray-100 text-dino-dark-green shadow-inner">
              {currentInput}
              <span className="animate-pulse text-gray-300 ml-1">|</span>
            </div>
          </div>

          <Keypad 
            onPress={handleInput} 
            onDelete={handleDelete} 
            onSubmit={handleSubmit}
            disabled={feedback !== 'none'}
          />
        </div>
      )}

      {/* --- FINISHED SCREEN --- */}
      {gameState === GameState.FINISHED && (
        <div className="bg-white/95 p-8 rounded-[2rem] shadow-2xl text-center max-w-md w-full animate-pop border-8 border-dino-green/20">
          <div className="text-7xl mb-4 relative inline-block">
             {score === problems.length ? '👑' : score >= problems.length * 0.7 ? '🍖' : '🥚'}
             <TRex className="w-16 h-16 text-dino-green absolute -bottom-2 -right-4" />
          </div>
          <h2 className="text-3xl font-black text-dino-dark-green mb-2">{t.mission_complete}</h2>
          
          <div className="grid grid-cols-2 gap-4 my-6">
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-100">
                  <div className="text-xs text-blue-400 font-bold uppercase">{t.accuracy}</div>
                  <div className="text-3xl font-black text-blue-600">{Math.round((score/problems.length)*100)}%</div>
                  <div className="text-xs text-blue-400">{score} / {problems.length} {t.questions}</div>
              </div>
              <div className="bg-dino-orange/10 p-3 rounded-2xl border border-dino-orange/20">
                  <div className="text-xs text-dino-orange font-bold uppercase">{t.total_time}</div>
                  <div className="text-3xl font-black text-dino-brown">{totalTimeTaken.toFixed(0)}</div>
                  <div className="text-xs text-dino-orange">{t.seconds}</div>
              </div>
          </div>

          <div className="space-y-3">
             {mistakes.length > 0 && (
                <button
                  onClick={() => setGameState(GameState.REVIEW)}
                  className="w-full py-3 bg-red-400 hover:bg-red-500 text-white font-bold rounded-xl shadow-[0_4px_0_#9b2c2c] active:translate-y-1 transition-all"
                >
                  {t.review_mistakes} ({mistakes.length})
                </button>
             )}
            
            <button
              onClick={exitGame}
              className="w-full py-4 bg-dino-green hover:bg-green-500 text-white text-xl font-bold rounded-xl shadow-[0_4px_0_#2f855a] active:translate-y-1 transition-all flex items-center justify-center gap-2"
            >
              <Footprint className="w-5 h-5 opacity-50" />
              {t.home}
            </button>
          </div>
        </div>
      )}

      {/* --- HISTORY SCREEN --- */}
      {gameState === GameState.HISTORY && (
        <div className="bg-white p-4 rounded-3xl shadow-xl w-full max-w-lg h-[80vh] flex flex-col z-10">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-dino-brown flex items-center gap-2">
                    📜 {t.history}
                </h2>
                <button onClick={() => { audioService.playClick(); localStorage.removeItem('math-history'); setHistory([])}} className="text-xs text-red-400 font-bold px-2 py-1 bg-red-50 rounded">
                    {t.clear_history}
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {history.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10">
                        <DinoEgg className="w-16 h-16 mx-auto mb-2 text-gray-200" />
                        {t.keep_trying}
                    </div>
                ) : (
                    history.map((h, i) => (
                        <div key={h.id} className="bg-gray-50 p-3 rounded-xl border-l-4 border-dino-green flex justify-between items-center shadow-sm">
                            <div>
                                <div className="text-xs text-gray-400 font-bold">
                                    {new Date(h.timestamp).toLocaleDateString()}
                                </div>
                                <div className="font-bold text-gray-700 capitalize text-sm flex items-center gap-1">
                                    {h.difficulty === 'easy' && <DinoEgg className="w-3 h-3" />}
                                    {h.difficulty === 'medium' && <Triceratops className="w-3 h-3" />}
                                    {h.difficulty === 'hard' && <TRex className="w-3 h-3" />}
                                    {t[h.difficulty]}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-dino-dark-green">{h.score}/{h.totalQuestions}</div>
                                <div className="text-xs text-gray-500">{Math.round(h.totalTimeSeconds)} {t.seconds}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <button
               onClick={exitGame}
               className="mt-4 py-3 bg-dino-brown text-white font-bold rounded-xl shadow-[0_4px_0_#4a3b36] active:translate-y-1"
             >
               {t.home}
             </button>
        </div>
      )}

      {/* --- MISTAKE NOTEBOOK --- */}
      {(gameState === GameState.REVIEW || gameState === GameState.MISTAKES_MENU) && (
        <div className="bg-white p-4 rounded-3xl shadow-xl w-full max-w-lg h-[80vh] flex flex-col z-10">
          <h2 className="text-2xl font-bold text-dino-brown mb-4 text-center flex items-center justify-center gap-2">
              📓 {t.mistakes}
          </h2>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {(gameState === GameState.MISTAKES_MENU ? persistentMistakes : mistakes).length === 0 ? (
                 <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <Pterodactyl className="w-20 h-20 mb-4 text-dino-sky" />
                    <p className="font-bold">{t.no_mistakes}</p>
                 </div>
            ) : (
                (gameState === GameState.MISTAKES_MENU ? persistentMistakes : mistakes).map((m, idx) => (
                <div key={idx} className="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center relative overflow-hidden">
                    <div className="absolute -left-2 top-0 bottom-0 w-4 bg-red-200"></div>
                    <div className="pl-4 text-xl font-bold text-gray-700 font-mono">
                    {m.problem.questionText} = ?
                    </div>
                    <div className="text-right z-10">
                        <div className="text-xs text-gray-500">You: <span className="text-red-500 font-bold decoration-line-through">{m.userAnswer}</span></div>
                        <div className="text-sm text-green-600 font-bold">Ans: {m.problem.answer}</div>
                    </div>
                </div>
                ))
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
             {persistentMistakes.length > 0 && gameState === GameState.MISTAKES_MENU && (
                 <button
                 onClick={practiceSpecificMistakes}
                 className="py-3 bg-dino-green hover:bg-green-600 text-white font-bold rounded-xl shadow-[0_4px_0_#2f855a] active:translate-y-1"
                >
                 {t.practice_mistakes}
                </button>
             )}
             
             <button
               onClick={exitGame}
               className={`py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl shadow-[0_4px_0_#a0aec0] active:translate-y-1 ${persistentMistakes.length === 0 || gameState !== GameState.MISTAKES_MENU ? 'col-span-2' : ''}`}
             >
               {t.home}
             </button>
          </div>
        </div>
      )}

      {/* --- ERROR STATE --- */}
      {gameState === GameState.ERROR && (
        <div className="text-center p-6 bg-red-50 rounded-2xl border-4 border-red-100">
          <p className="text-red-500 text-xl font-bold mb-4">Oh no! The volcano blocked the path!</p>
          <button 
            onClick={() => setGameState(GameState.START)}
            className="px-6 py-2 bg-dino-green text-white rounded-lg font-bold"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
