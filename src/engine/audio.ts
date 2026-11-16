class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;
  private lastWarningTime = 0;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(mute: boolean) {
    this.muted = mute;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    volume = 0.08,
    endFreq?: number,
    delay = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playClick() {
    this.playTone(540, 0.06, 'square', 0.06, 760);
  }

  public playOpenMenu() {
    this.playTone(392, 0.07, 'square', 0.05);
    this.playTone(523.25, 0.09, 'square', 0.05, undefined, 0.05);
  }

  public playCloseMenu() {
    this.playTone(523.25, 0.06, 'square', 0.05);
    this.playTone(349.23, 0.08, 'square', 0.05, undefined, 0.04);
  }

  public playStep(insideShip: boolean) {
    if (insideShip) {
      this.playTone(170, 0.035, 'triangle', 0.035, 110);
    } else {
      this.playTone(120, 0.045, 'sawtooth', 0.025, 70);
    }
  }

  public playSuitToggle(equipped: boolean) {
    if (equipped) {
      this.playTone(330, 0.07, 'square', 0.06, 660);
      this.playTone(784, 0.09, 'triangle', 0.07, undefined, 0.06);
    } else {
      this.playTone(620, 0.08, 'square', 0.06, 260);
    }
  }

  public playAirlock(entering: boolean) {
    if (entering) {
      this.playTone(220, 0.14, 'triangle', 0.07, 440);
      this.playTone(523.25, 0.14, 'square', 0.05, 659.25, 0.1);
    } else {
      this.playTone(440, 0.15, 'triangle', 0.07, 160);
    }
  }

  public playConsume() {
    this.playTone(440, 0.06, 'triangle', 0.07, 580);
    this.playTone(620, 0.08, 'triangle', 0.07, 780, 0.06);
  }

  public playHydrate() {
    this.playTone(520, 0.07, 'sine', 0.08, 860);
    this.playTone(740, 0.09, 'sine', 0.07, 1040, 0.06);
  }

  public playTrain() {
    this.playTone(392, 0.06, 'square', 0.06);
    this.playTone(523.25, 0.06, 'square', 0.06, undefined, 0.06);
    this.playTone(659.25, 0.1, 'square', 0.06, undefined, 0.12);
  }

  public playInteract() {
    this.playTone(587.33, 0.06, 'square', 0.05);
    this.playTone(880, 0.09, 'square', 0.05, undefined, 0.05);
  }

  public playAttack() {
    this.playTone(280, 0.1, 'sawtooth', 0.07, 90);
  }

  public playSleep() {
    this.playTone(392, 0.15, 'sine', 0.06);
    this.playTone(329.63, 0.16, 'sine', 0.06, undefined, 0.14);
    this.playTone(261.63, 0.25, 'sine', 0.06, undefined, 0.28);
  }

  public playWake() {
    this.playTone(261.63, 0.1, 'triangle', 0.06);
    this.playTone(329.63, 0.1, 'triangle', 0.06, undefined, 0.09);
    this.playTone(392, 0.1, 'triangle', 0.06, undefined, 0.18);
    this.playTone(523.25, 0.18, 'triangle', 0.07, undefined, 0.27);
  }

  public playWarning() {
    const now = performance.now();
    if (now - this.lastWarningTime < 3500) return;
    this.lastWarningTime = now;
    this.playTone(660, 0.1, 'square', 0.05);
    this.playTone(440, 0.12, 'square', 0.05, undefined, 0.11);
  }

  public playDamage() {
    this.playTone(150, 0.12, 'sawtooth', 0.07, 70);
  }
}

export const soundEngine = new SoundEngine();
