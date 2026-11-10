// ============================================================================
// BREDFORGE v1.0 — AUDIO VISUALIZER SERVICE [REF: VISUALIZER-SERVICE-01]
// ============================================================================

import { audioEngine } from './AudioEngine';

export type VisualizerMode = 'waveform' | 'frequency';

export class AudioVisualizerService {
  private mode: VisualizerMode = 'waveform';

  public setMode(mode: VisualizerMode): void {
    this.mode = mode;
  }

  public getMode(): VisualizerMode {
    return this.mode;
  }

  public renderFrame(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    mode: VisualizerMode = this.mode
  ): void {
    const analyser = audioEngine.getAnalyser();
    if (!analyser || !ctx || !canvas) return;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    if (mode === 'waveform') {
      analyser.getByteTimeDomainData(dataArray);
    } else {
      analyser.getByteFrequencyData(dataArray);
    }

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#09090b'; // zinc-950
    ctx.fillRect(0, 0, width, height);

    if (mode === 'waveform') {
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#f59e0b'; // amber-500
      ctx.beginPath();

      const sliceWidth = width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // 128 is center for 8-bit PCM
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(width, height / 2);
      ctx.stroke();
    } else {
      // Frequency spectrum bars
      const barWidth = (width / bufferLength) * 2.5;
      let barHeight: number;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height;

        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#f59e0b');
        gradient.addColorStop(1, '#ec4899');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
        if (x > width) break;
      }
    }
  }
}

export const audioVisualizerService = new AudioVisualizerService();
