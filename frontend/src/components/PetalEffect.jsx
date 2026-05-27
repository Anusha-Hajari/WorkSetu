import React, { useEffect } from "react";

export default function PetalEffect() {
  useEffect(() => {
    const petals = [];
    const count = 12; // More petals
    for (let i = 0; i < count; i++) {
      const petal = document.createElement("div");
      petal.className = "petal";
      const size = 6 + Math.random() * 6; // Larger petals
      petal.style.cssText = `
        left: ${Math.random() * 100}vw;
        animation-duration: ${8 + Math.random() * 10}s;
        animation-delay: ${Math.random() * 10}s;
        width: ${size}px;
        height: ${size * 1.5}px;
        opacity: ${0.3 + Math.random() * 0.4};
      `;
      document.body.appendChild(petal);
      petals.push(petal);
    }
    return () => petals.forEach((p) => p.remove());
  }, []);
  return null;
}