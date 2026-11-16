export interface MoveVector {
  x: number;
  y: number;
}

export type EdgeAction =
  | 'interact'
  | 'suit'
  | 'ship'
  | 'attack'
  | 'train'
  | 'pause'
  | 'tool_1'
  | 'tool_2'
  | 'tool_3'
  | 'tool_4';

/**
 * Unified InputManager for Laptop (Arrow keys + WASD + cursor)
 * and Phone/Tablet (Bottom-left D-pad + touch target for ship).
 * Separates continuous held movement from edge-triggered actions,
 * and clears held state on window blur.
 */
export class InputManager {
  private heldKeys = new Set<string>();
  private dpadVector: MoveVector = { x: 0, y: 0 };
  private touchRunHeld = false;
  private queuedActions: EdgeAction[] = [];

  // Phase 3 Ship Movement Hook:
  // Laptop -> cursor coordinates; Phone/Tablet -> where user presses
  public shipTargetCanvasPos: { x: number; y: number } | null = null;

  constructor() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
  }

  public attach() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  public detach() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
  }

  private handleBlur() {
    this.heldKeys.clear();
    this.dpadVector = { x: 0, y: 0 };
    this.touchRunHeld = false;
  }

  private handleKeyDown(e: KeyboardEvent) {
    const target = e.target as HTMLElement | null;
    if (
      target &&
      (target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT')
    ) {
      return;
    }

    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '].includes(e.key) ||
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)
    ) {
      e.preventDefault();
    }

    const code = e.code;
    const isRepeat = this.heldKeys.has(code);
    this.heldKeys.add(code);

    if (!isRepeat) {
      if (code === 'Space') this.queuedActions.push('interact');
      else if (code === 'KeyE') this.queuedActions.push('suit');
      else if (code === 'KeyF') this.queuedActions.push('ship');
      else if (code === 'KeyQ') this.queuedActions.push('attack');
      else if (code === 'KeyT') this.queuedActions.push('train');
      else if (code === 'Digit1') this.queuedActions.push('tool_1');
      else if (code === 'Digit2') this.queuedActions.push('tool_2');
      else if (code === 'Digit3') this.queuedActions.push('tool_3');
      else if (code === 'Digit4') this.queuedActions.push('tool_4');
      else if (code === 'Escape') this.queuedActions.push('pause');
    }
  }

  private handleKeyUp(e: KeyboardEvent) {
    this.heldKeys.delete(e.code);
  }

  public setDpadVector(x: number, y: number) {
    this.dpadVector = { x, y };
  }

  public setTouchRun(held: boolean) {
    this.touchRunHeld = held;
  }

  public triggerAction(action: EdgeAction) {
    this.queuedActions.push(action);
  }

  public consumeActions(): EdgeAction[] {
    if (this.queuedActions.length === 0) return [];
    const copy = [...this.queuedActions];
    this.queuedActions.length = 0;
    return copy;
  }

  public clearAll() {
    this.heldKeys.clear();
    this.dpadVector = { x: 0, y: 0 };
    this.touchRunHeld = false;
    this.queuedActions.length = 0;
  }

  public isRunning(): boolean {
    return (
      this.touchRunHeld ||
      this.heldKeys.has('ShiftLeft') ||
      this.heldKeys.has('ShiftRight')
    );
  }

  public getMoveVector(): MoveVector {
    let x = this.dpadVector.x;
    let y = this.dpadVector.y;

    // Laptop primary: Arrow keys (also support WASD as accessible secondary)
    if (this.heldKeys.has('ArrowLeft') || this.heldKeys.has('KeyA')) x -= 1;
    if (this.heldKeys.has('ArrowRight') || this.heldKeys.has('KeyD')) x += 1;
    if (this.heldKeys.has('ArrowUp') || this.heldKeys.has('KeyW')) y -= 1;
    if (this.heldKeys.has('ArrowDown') || this.heldKeys.has('KeyS')) y += 1;

    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y };
  }
}
