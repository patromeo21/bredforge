// ============================================================================
// BREDFORGE v1.0 — WEB MIDI CONTROLLER SERVICE [REF: MIDI-01]
// ============================================================================

export type MidiNoteCallback = (note: number, velocity: number, channel: number) => void;
export type MidiControlCallback = (controller: number, value: number, channel: number) => void;

export class MidiService {
  private static instance: MidiService;
  private midiAccess: WebMidi.MIDIAccess | null = null;
  private connectedInputs: Map<string, WebMidi.MIDIInput> = new Map();
  
  private noteOnCallbacks: MidiNoteCallback[] = [];
  private noteOffCallbacks: MidiNoteCallback[] = [];
  private controlChangeCallbacks: MidiControlCallback[] = [];

  private constructor() {}

  public static getInstance(): MidiService {
    if (!MidiService.instance) {
      MidiService.instance = new MidiService();
    }
    return MidiService.instance;
  }

  /**
   * Request MIDI access from the browser and bind input listeners
   */
  public async initMidi(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) {
      console.warn('[MidiService] Web MIDI API is not supported in this browser environment.');
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.refreshInputs();

      // Listen for device plug/unplug events
      this.midiAccess.onstatechange = (e) => {
        const port = e.port;
        console.log(`[MidiService] MIDI Port State Change: ${port.name} (${port.type}) -> ${port.state}`);
        this.refreshInputs();
      };

      console.log('[MidiService] Web MIDI initialized successfully.');
      return true;
    } catch (err) {
      console.error('[MidiService] Failed to request MIDI access:', err);
      return false;
    }
  }

  private refreshInputs(): void {
    if (!this.midiAccess) return;
    this.connectedInputs.clear();

    const inputs = this.midiAccess.inputs.values();
    for (const input of inputs) {
      this.connectedInputs.set(input.id, input);
      input.onmidimessage = this.handleMidiMessage.bind(this);
      console.log(`[MidiService] Connected MIDI Input: ${input.name} (ID: ${input.id})`);
    }
  }

  private handleMidiMessage(event: WebMidi.MIDIMessageEvent): void {
    const data = event.data;
    if (!data || data.length < 3) return;

    const status = data[0];
    const data1 = data[1]; // Note number or CC number
    const data2 = data[2]; // Velocity or CC value

    const command = status >> 4; // High nibble
    const channel = (status & 0x0f) + 1; // Low nibble (1-16)

    switch (command) {
      case 9: // Note On
        if (data2 > 0) {
          this.noteOnCallbacks.forEach((cb) => cb(data1, data2, channel));
        } else {
          // Velocity 0 is treated as Note Off
          this.noteOffCallbacks.forEach((cb) => cb(data1, data2, channel));
        }
        break;
      case 8: // Note Off
        this.noteOffCallbacks.forEach((cb) => cb(data1, data2, channel));
        break;
      case 11: // Control Change (CC)
        this.controlChangeCallbacks.forEach((cb) => cb(data1, data2, channel));
        break;
      default:
        break;
    }
  }

  public onNoteOn(callback: MidiNoteCallback): () => void {
    this.noteOnCallbacks.push(callback);
    return () => {
      this.noteOnCallbacks = this.noteOnCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onNoteOff(callback: MidiNoteCallback): () => void {
    this.noteOffCallbacks.push(callback);
    return () => {
      this.noteOffCallbacks = this.noteOffCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onControlChange(callback: MidiControlCallback): () => void {
    this.controlChangeCallbacks.push(callback);
    return () => {
      this.controlChangeCallbacks = this.controlChangeCallbacks.filter((cb) => cb !== callback);
    };
  }

  public getConnectedDevices(): string[] {
    const devices: string[] = [];
    this.connectedInputs.forEach((input) => {
      if (input.name) devices.push(input.name);
    });
    return devices;
  }
}

export const midiService = MidiService.getInstance();
