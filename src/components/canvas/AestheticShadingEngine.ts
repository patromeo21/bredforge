export class AestheticShadingEngine {
  /**
   * Draws a hardware rotary knob with isometric radial bevel shading.
   */
  public static drawKnob(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    valueRatio: number, // 0.0 to 1.0
    label: string
  ): void {
    ctx.save();

    // Outer Bevel / Drop Shadow Ring
    ctx.beginPath();
    ctx.arc(x, y, radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = '#09090b';
    ctx.fill();

    // Knob Metallic Body Gradient
    const grad = ctx.createLinearGradient(x - radius, y - radius, x + radius, y + radius);
    grad.addColorStop(0, '#3f3f46');
    grad.addColorStop(0.5, '#27272a');
    grad.addColorStop(1, '#18181b');

    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Value Indicator Line
    const startAngle = Math.PI * 0.75;
    const endAngle = Math.PI * 2.25;
    const currentAngle = startAngle + (endAngle - startAngle) * Math.max(0, Math.min(1, valueRatio));

    const pointerX = x + Math.cos(currentAngle) * (radius - 4);
    const pointerY = y + Math.sin(currentAngle) * (radius - 4);

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(pointerX, pointerY);
    ctx.strokeStyle = '#fbbf24'; // Amber accent
    ctx.lineWidth = 2;
    ctx.stroke();

    // Knob Label
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + radius + 14);

    ctx.restore();
  }

  /**
   * Draws a backlit hardware button with shadow borders and an active amber glow.
   */
  public static drawHardwareButton(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    isActive: boolean
  ): void {
    ctx.save();

    // Button Frame / Recess Shadow
    ctx.fillStyle = '#09090b';
    ctx.fillRect(x - 1, y - 1, width + 2, height + 2);

    // Button Body Gradient
    const grad = ctx.createLinearGradient(x, y, x, y + height);
    if (isActive) {
      grad.addColorStop(0, '#d97706');
      grad.addColorStop(1, '#b45309');
    } else {
      grad.addColorStop(0, '#27272a');
      grad.addColorStop(1, '#18181b');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(x, y, width, height);

    // Outer Glow / Border
    ctx.strokeStyle = isActive ? '#fbbf24' : '#3f3f46';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, width, height);

    // Text Label
    ctx.fillStyle = isActive ? '#09090b' : '#d4d4d8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + width / 2, y + height / 2);

    ctx.restore();
  }
}