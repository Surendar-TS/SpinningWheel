// main.js
import { drawWheel, spinWheel } from './wheel.js';

document.getElementById("drawBtn").addEventListener("click", () => {
  const namesInput = document.getElementById("namesInput").value;
  // Split names by comma and filter out any empty names
  const names = namesInput.split(",").map(name => name.trim()).filter(name => name !== "");
  
  if (names.length === 0) {
    alert("Please enter at least one name.");
    return;
  }
  
  // Draw the wheel and store segments for later use
  window.segments = drawWheel(names);
  document.getElementById("result").innerText = "";
  // Ensure the wheel is drawn
  drawWheel(names);
});

document.getElementById("spinBtn").addEventListener("click", () => {
  if (!window.segments || window.segments.length === 0) {
    alert("Please draw the wheel first!");
    return;
  }
  spinWheel(window.segments, (winner) => {
    document.getElementById("result").innerText = "Winner: " + winner;
  });
});

// Add event listener for reset button
document.getElementById("resetBtn").addEventListener("click", () => {
  window.segments = [];
  document.getElementById("result").innerText = "";
  alert("Wheel has been reset.");
});
