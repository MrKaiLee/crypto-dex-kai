'use client';

// Adds a smooth, staggered fade-and-slide entrance to the direct children of any
// element that has the class "home-animate".
export default function HomeAnimations() {
  const steps = Array.from({ length: 16 }, (_, i) => i);

  const css = `
    @keyframes homeFadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .home-animate > * { animation: homeFadeUp 0.55s ease backwards; }
    ${steps
      .map((i) => `.home-animate > *:nth-child(${i + 1}) { animation-delay: ${i * 60}ms; }`)
      .join('\n')}
    
  `;

  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}