// First, add this to your HTML file in the head section before your other scripts:
// <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const namesInput = document.getElementById('namesInput');
  const spinButton = document.getElementById('spinButton');
  const wheelWrapper = document.querySelector('.wheel-wrapper');
  
  // High-DPI fix
  const dpr = window.devicePixelRatio || 1;
  const CANVAS_SIZE = 400;
  canvas.style.width = `${CANVAS_SIZE}px`;
  canvas.style.height = `${CANVAS_SIZE}px`;
  canvas.width = CANVAS_SIZE * dpr;
  canvas.height = CANVAS_SIZE * dpr;
  ctx.scale(dpr, dpr);

  let names = [];
  let segments = [];
  let rotation = 0;
  let spinning = false;
  let gif = null;
  let abortController = null;

  // Initialize GIF constructor
  const GIF = window.GIF;

  namesInput.addEventListener('input', updateWheel);
  spinButton.addEventListener('click', spin);

  function getColor(index) {
    return `hsl(${(index * 137.5) % 360}, 70%, 60%)`;
  }

  function updateWheel() {
    names = namesInput.value.split('\n')
             .map(n => n.trim())
             .filter(n => n.length > 0);

    if (names.length > 20) {
      namesInput.classList.add('error');
      document.getElementById('nameError')?.remove();
      const error = document.createElement('div');
      error.id = 'nameError';
      error.textContent = 'Maximum 20 names allowed';
      error.style.color = 'red';
      error.style.marginTop = '0.5rem';
      namesInput.parentNode.insertBefore(error, namesInput.nextSibling);
      segments = [];
      drawWheel();
      return;
    } else {
      namesInput.classList.remove('error');
      document.getElementById('nameError')?.remove();
    }

    segments = names.map((name, i) => ({
      name,
      color: getColor(i)
    }));
    drawWheel();
  }

  function drawWheel(currentRotation = 0) {
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    if (segments.length === 0) return;

    ctx.save();
    ctx.translate(CANVAS_SIZE/2, CANVAS_SIZE/2);
    ctx.rotate((currentRotation % 360) * Math.PI / 180);
    ctx.translate(-CANVAS_SIZE/2, -CANVAS_SIZE/2);

    const center = CANVAS_SIZE / 2;
    const radius = center;
    const anglePerSegment = (2 * Math.PI) / segments.length;

    segments.forEach((seg, i) => {
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, i * anglePerSegment, (i + 1) * anglePerSegment);
      ctx.fillStyle = seg.color;
      ctx.fill();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(i * anglePerSegment + anglePerSegment / 2);
      ctx.fillStyle = 'white';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(seg.name, radius - 20, 8);
      ctx.restore();
    });

    ctx.restore();
  }

  async function captureWheelContainer() {
    try {
      // Get the dimensions of the wheel wrapper each time we capture
      const wrapperRect = wheelWrapper.getBoundingClientRect();
      
      // Use html2canvas to capture the entire wheel wrapper
      const capturedCanvas = await html2canvas(wheelWrapper, {
        backgroundColor: null,
        scale: dpr,
        logging: false,
        useCORS: true,
        x: 0,
        y: 0,
        width: wrapperRect.width,
        height: wrapperRect.height + 20 // Add extra padding to ensure arrow is fully captured
      });
      
      return capturedCanvas;
    } catch (error) {
      console.error('Error capturing wheel container:', error);
      // Fallback to just the canvas if html2canvas fails
      return canvas;
    }
  }

  async function spin() {
    if (!GIF) {
      alert('Please reload the page to initialize spinner');
      return;
    }

    if (spinning || segments.length < 2) return;
    
    // Check if html2canvas is available
    if (typeof html2canvas === 'undefined') {
      console.error('html2canvas library not loaded');
      alert('Required library not loaded. Please reload the page.');
      return;
    }

    // Cleanup previous instances
    if (abortController) abortController.abort();
    abortController = new AbortController();

    console.log("Creating new GIF instance");
    
    // Get the size of the wheel wrapper for the GIF
    const wrapperRect = wheelWrapper.getBoundingClientRect();
    
    // Initialize GIF with the size of the wheel wrapper
    gif = new GIF({
      workers: 4,
      quality: 10,
      width: wrapperRect.width * dpr,
      height: (wrapperRect.height + 20) * dpr, // Add extra space for the arrow
      workerScript: 'js/gif.worker.js'
    });
    
    console.log("GIF instance created");

    // Add event listeners for debugging
    gif.on('progress', function(p) {
      const percent = Math.round(p * 100);
      console.log('GIF generation progress:', percent + '%');
      
      // Update the loading message with progress
      const loadingText = document.querySelector('.gif-loading p');
      if (loadingText) {
        loadingText.textContent = `Generating GIF... ${percent}%`;
      }
    });

    gif.on('error', function(error) {
      console.error('GIF generation error:', error);
    });

    spinning = true;
    
    // Add true randomness to winner selection
    const targetSegment = Math.floor(Math.random() * segments.length);
    const extraSpins = 5; // Minimum number of full rotations
    const segmentAngle = 360 / segments.length;
    // Calculate target rotation to land on random segment
    const targetRotation = (extraSpins * 360) + (360 - (targetSegment * segmentAngle)) + 
                          (Math.random() * (segmentAngle/2)); // Add some randomness within segment
    
    const startRotation = rotation;
    const startTime = performance.now();
    const duration = 5000 + Math.random() * 1000;

    canvas.style.transform = 'none';
    
    let frameCount = 0;
    
    async function animate(now) {
      if (abortController.signal.aborted) return;

      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smoother animations
      const eased = 1 - Math.pow(1 - progress, 3);
      
      // Use targetRotation instead of fixed 360 * 5
      rotation = startRotation + (targetRotation * eased);

      drawWheel(rotation);
      
      // Capture frames more frequently for smoother animation
      if (frameCount % 2 === 0) { // Every 2nd frame instead of every 3rd
        try {
          const capturedCanvas = await captureWheelContainer();
          gif.addFrame(capturedCanvas, { delay: 50, copy: true }); // 50ms delay instead of 100ms
        } catch (e) {
          console.error('Error adding frame:', e);
        }
      }
      frameCount++;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        console.log(`Animation complete. Added approximately ${frameCount/2} frames.`);
        spinning = false;
        const winner = calculateWinner();
        const confetti = createConfetti();
        const resultDiv = showResult(winner, confetti);

        console.log('Starting GIF render...');
        gif.render();
        
        gif.on('finished', blob => {
          console.log('GIF finished!', blob);
          if (abortController.signal.aborted) {
            console.log('Aborted, not showing GIF');
            return;
          }
          
          try {
            const gifUrl = URL.createObjectURL(blob);
            console.log('Created blob URL:', gifUrl);

            const gifImg = document.createElement('img');
            gifImg.src = gifUrl;
            gifImg.className = 'gif-preview';
            console.log('Created image element');

            const downloadBtn = document.createElement('button');
            downloadBtn.id = 'downloadGif';
            downloadBtn.className = 'btn';
            downloadBtn.textContent = 'Download GIF';
            console.log('Created download button');

            // Find the container
            const contentDiv = resultDiv.querySelector('.result-content');
            if (!contentDiv) {
              console.error('Could not find .result-content');
              return;
            }
            
            // Remove loading message
            const loading = contentDiv.querySelector('.gif-loading');
            if (loading) {
              console.log('Removing loading message');
              loading.remove();
            } else {
              console.warn('Loading element not found with class .gif-loading');
            }
            
            // Insert elements before share buttons
            const shareButtons = contentDiv.querySelector('.share-buttons');
            if (!shareButtons) {
              console.error('Could not find .share-buttons');
              contentDiv.appendChild(gifImg);
              contentDiv.appendChild(downloadBtn);
            } else {
              console.log('Inserting elements before share buttons');
              contentDiv.insertBefore(gifImg, shareButtons);
              contentDiv.insertBefore(downloadBtn, shareButtons);
            }

            // Add download handler
            downloadBtn.addEventListener('click', () => {
              console.log('Download button clicked');
              const link = document.createElement('a');
              link.href = gifUrl;
              link.download = 'spin-result.gif';
              link.click();
            });
          } catch (e) {
            console.error('Error in GIF finished callback:', e);
          }
        });

        setTimeout(() => {
          if (!resultDiv.querySelector('img')) {
            console.log('No image found after timeout, aborting');
            abortController.abort();
            cleanup();
          }
        }, 30000); // Extended timeout to 30 seconds
      }
    }

    requestAnimationFrame(animate);
  }

  function calculateWinner() {
    const effectiveRotation = (270 - rotation) % 360;
    const segmentAngle = 360 / segments.length;
    const winningIndex = Math.floor((effectiveRotation < 0 ? effectiveRotation + 360 : effectiveRotation) / segmentAngle);
    return segments[winningIndex].name;
  }

  function createConfetti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      confetti.textContent = Math.random() > 0.5 ? '🎉' : '🎊';
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.animationDelay = `${Math.random() * 2}s`;
      confettiContainer.appendChild(confetti);
    }
    
    document.body.appendChild(confettiContainer);
    return confettiContainer;
  }

  function showResult(winnerName, confetti) {
    const resultDiv = document.createElement('div');
    resultDiv.className = 'result-popup';
    resultDiv.innerHTML = `
      <div class="result-content">
        <h3>🎉 Winner!</h3>
        <p>${winnerName}</p>
        <div class="gif-loading">
          <div class="loader"></div>
          <p>Generating GIF...</p>
        </div>
        <div class="share-buttons">
          <button id="closeResult" class="btn">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(resultDiv);

    resultDiv.querySelector('#closeResult').addEventListener('click', () => {
      cleanup();
      resultDiv.remove();
      confetti.remove();
    });

    return resultDiv;
  }

  function cleanup() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    if (gif) {
      gif.abort();
      gif = null;
    }
  }

  updateWheel();
});