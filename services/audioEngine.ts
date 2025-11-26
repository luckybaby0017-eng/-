
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  // Music State
  private bgmNodes: AudioNode[] = [];
  private isMuted: boolean = false;
  private isPlayingBGM: boolean = false;
  private nextNoteTime: number = 0;
  private timerID: number | null = null;
  private currentChordIndex: number = 0;

  // Chord Progression (C Minor Adventure Theme)
  // Frequencies for chords: Cm, Ab, Fm, G
  private chords = [
    [130.81, 155.56, 196.00], // C3, Eb3, G3 (Cm)
    [103.83, 155.56, 207.65], // Ab2, Eb3, Ab3 (Ab Major)
    [87.31, 130.81, 174.61],  // F2, C3, F3 (Fm)
    [98.00, 123.47, 146.83]   // G2, B2, D3 (G Major)
  ];

  constructor() {
    // Lazy init
  }

  public init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
      this.masterGain.gain.value = this.isMuted ? 0 : 0.5; // Master volume
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    
    // Start BGM if not already playing and initialized
    if (!this.isPlayingBGM) {
      this.startMusicLoop();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setTargetAtTime(muted ? 0 : 0.5, t, 0.2);
    }
  }

  // --- BGM: Orchestral Strings ---

  private startMusicLoop() {
    this.isPlayingBGM = true;
    this.nextNoteTime = this.ctx!.currentTime + 0.1;
    this.scheduler();
  }

  private scheduler() {
    // While there are notes that will need to play before the next interval, 
    // schedule them and advance the pointer.
    if (!this.isPlayingBGM) return;

    while (this.nextNoteTime < this.ctx!.currentTime + 0.1) {
      this.scheduleChord(this.nextNoteTime);
      this.nextNoteTime += 4.0; // Each chord lasts 4 seconds (slow tempo)
    }
    
    this.timerID = window.setTimeout(() => this.scheduler(), 25);
  }

  private scheduleChord(time: number) {
    if (!this.ctx) return;

    const chord = this.chords[this.currentChordIndex];
    this.currentChordIndex = (this.currentChordIndex + 1) % this.chords.length;

    // Play each note in the chord
    chord.forEach(freq => {
      this.playStringPad(freq, time, 4.0);
    });
  }

  private playStringPad(freq: number, time: number, duration: number) {
    // Synthesize a "String Section" sound using Sawtooth + Lowpass Filter
    const osc = this.ctx!.createOscillator();
    const filter = this.ctx!.createBiquadFilter();
    const gain = this.ctx!.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = freq;

    // Filter creates the "mellow" string sound
    filter.type = 'lowpass';
    filter.frequency.value = 600; 

    // Attack and Release envelope
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.05, time + 1.0); // Slow attack
    gain.gain.setValueAtTime(0.05, time + duration - 1.0);
    gain.gain.linearRampToValueAtTime(0, time + duration); // Slow release

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc.start(time);
    osc.stop(time + duration);
    
    // Add detuned oscillators for chorus effect (thicker sound)
    const osc2 = this.ctx!.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = freq * 1.01; // Detune slightly up
    osc2.connect(filter);
    osc2.start(time);
    osc2.stop(time + duration);
  }

  // --- SFX: Game Sounds ---

  public playCorrect() {
    this.playChime([523.25, 659.25, 783.99, 1046.50]); // C Major Arpeggio
  }

  public playCorrectSimple() {
    this.playChime([523.25, 659.25]); // C - E
  }

  private playChime(freqs: number[]) {
    if (!this.ctx) this.init();
    const t = this.ctx!.currentTime;

    freqs.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      const startTime = t + (i * 0.08); // Stagger notes
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
      
      osc.connect(gain);
      gain.connect(this.masterGain!);
      
      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  }

  public playWrong() {
    if (!this.ctx) this.init();
    const t = this.ctx!.currentTime;

    // "Bonk" sound
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.3); // Pitch slide down
    
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(t);
    osc.stop(t + 0.3);
  }

  public playClick() {
    if (!this.ctx) this.init();
    const t = this.ctx!.currentTime;
    
    // Woodblock style click
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.frequency.value = 800;
    osc.type = 'sine';
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(t);
    osc.stop(t + 0.1);
  }
}

export const audioService = new AudioEngine();
