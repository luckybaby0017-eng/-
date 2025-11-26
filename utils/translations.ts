import { Language } from '../types';

type TranslationKey = 
  | 'title' | 'story_intro' | 'start_game' | 'loading' | 'level' | 'question' 
  | 'score' | 'time' | 'best_score' | 'history' | 'mistakes' 
  | 'review' | 'home' | 'settings' | 'select_level' | 'select_count'
  | 'easy' | 'medium' | 'hard' | 'practice_mistakes' | 'no_mistakes'
  | 'mission_complete' | 'accuracy' | 'total_time' | 'date'
  | 'correct' | 'wrong' | 'saved_notebook' | 'questions' | 'clear_history'
  | 'excellent' | 'good' | 'keep_trying' | 'seconds' | 'review_mistakes';

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    title: "Dino Math Rescue",
    story_intro: "The volcano is shaking! Solve math problems quickly to help the dinosaurs escape to safety!",
    start_game: "Start Rescue Mission",
    loading: "Scouting the path...",
    level: "Danger Level",
    question: "Problem",
    score: "Dinos Saved",
    time: "Time",
    best_score: "Best Rescue",
    history: "Rescue Log",
    mistakes: "Stumble Log",
    review: "Review",
    home: "Base Camp",
    settings: "Mission Settings",
    select_level: "Select Path Difficulty",
    select_count: "Mission Length",
    easy: "Baby Walk (Easy)",
    medium: "Jungle Run (Medium)",
    hard: "Volcano Sprint (Hard)",
    practice_mistakes: "Retrain Dinos",
    no_mistakes: "Perfect run! No dinos stumbled!",
    mission_complete: "Rescue Successful!",
    accuracy: "Survival Rate",
    total_time: "Mission Time",
    date: "Date",
    correct: "Roar! (Correct)",
    wrong: "Oops! (Tripped)",
    saved_notebook: "Recorded Stumble",
    questions: "Dinos",
    clear_history: "Clear Log",
    excellent: "Super Fast!",
    good: "Safe!",
    keep_trying: "Run Faster Next Time!",
    seconds: "s",
    review_mistakes: "Help Stumbled Dinos"
  },
  zh: {
    title: "恐龙救援队",
    story_intro: "火山要爆发了！快做对口算题，帮助小恐龙们逃离危险！",
    start_game: "开始救援任务",
    loading: "正在侦察路线...",
    level: "危险等级",
    question: "救援口令",
    score: "救援数量",
    time: "用时",
    best_score: "最佳救援",
    history: "救援记录",
    mistakes: "跌倒记录",
    review: "复习",
    home: "返回营地",
    settings: "任务设置",
    select_level: "选择路线难度",
    select_count: "救援数量",
    easy: "幼龙漫步 (初级)",
    medium: "丛林奔跑 (中级)",
    hard: "火山冲刺 (高级)",
    practice_mistakes: "特训跌倒的小恐龙",
    no_mistakes: "太棒了！所有恐龙都安全了！",
    mission_complete: "救援成功！",
    accuracy: "成功率",
    total_time: "总耗时",
    date: "日期",
    correct: "吼！(正确)",
    wrong: "哎呀！(跌倒了)",
    saved_notebook: "记录跌倒",
    questions: "只恐龙",
    clear_history: "清空记录",
    excellent: "神速救援！",
    good: "安全抵达！",
    keep_trying: "下次跑快点！",
    seconds: "秒",
    review_mistakes: "查看跌倒记录"
  }
};