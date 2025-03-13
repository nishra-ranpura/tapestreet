let userText = "";

function startWeaveSketch(text) {
    userText = text;
    if (window.sketchInstance) {
        window.sketchInstance.remove();
    }
    window.sketchInstance = new p5(weaveSketch, document.getElementById("sketch-container"));
}

const weaveSketch = (p) => {
    let apiKey =
      "-proj-79SbzXwF3wCT1jMXfJJ9EyWaBWwziJCj0IppOSoLOtxM7vaS32P-bZ1_LY-nZXi0g2bwEEhNUTT3BlbkFJT40HZZpMsguIk_7pP2ds-OlgliHGSg9hu3R658zWS5QLSTTUNGj5RyakyVKiczrj2BsnmdvaQA"; // LocalModel AI API key
    // let input, submitButton;
    let colors = [];
    let checks = [];
    let step = 10; // yarn thickness
    let empty = 2; // reed space
    let loomMargin = 10;
    let noteSounds = []; // Array to hold note sounds
    let verticalColorSequence = []; // To store the sequence of vertical colors
    let totalColors = 10; // Change this to however many total colors
    let verticalColorCount = 5; // Number of colors to use for vertical lines
    let horizontalColorCount = 5; // Number of colors to use for horizontal lines
    let numRows = 0; // Number of rows needed
    let canvas;

    p.preload = function() {
      for (let i = 0; i < 16; i++) {
        noteSounds[i] = new p5.Oscillator("sine");
        noteSounds[i].freq(100 + i * 50);
        noteSounds[i].amp(0.2);
      }
    }
    
    p.setup = function() {
        p.createCanvas(1200, 800);
        p.noLoop();
        CW = p.int(p.random(1, 4));
        p.strokeCap(p.SQUARE);
        analyzeText(userText);
    };

    function processText(text) {
      analyzeText(text);
    }

    p.draw = function() {
      // The weave function will be called after generating colors
      if (checks.length > 0) {
        weave();
      }
    }

    async function analyzeText(inputText) {
      try {
        let response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "user",
                content: `Generate a list of at least ${totalColors} colors that are a part of one harmonious palette that represent the meaning of this text in color-theory: "${inputText}". Format each color as "rgb(r, g, b)" where r, g, and b are integers between 0 and 255.`,
              },
            ],
            max_tokens: 300,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        let data = await response.json();
        let colorString = data.choices[0].message.content.trim();
        colors = colorString.match(/rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)/g) || [];
        colors = colors.map((c) => p.color(c));  // 

        if (colors.length > totalColors) colors = colors.slice(0, totalColors);

        initiate(inputText);
        p.redraw();  
      } catch (error) {
        console.error("Error during API call:", error.message);

        // Assign fallback colors if API fails
        colors = [
          p.color(180, 40, 60), 
          p.color(120, 30, 70), 
          p.color(180, 70, 50), 
          p.color(100, 150, 200), 
          p.color(80, 100, 120), 
        ];

        initiate(inputText);
        p.redraw();  
      }
    }


    function initiate(inputString) {
      const binaryString = inputString
        .split("")
        .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
        .join("");

      let charsPerRow = Math.floor((p.width - 2 * loomMargin * step) / step);  // ✅ p.width
      numRows = Math.ceil(binaryString.length / charsPerRow);

      p.resizeCanvas(p.width, numRows * step + 2 * loomMargin * step + 70);  // ✅ p.resizeCanvas
      // p.background(68, 48, 40, 20);  // ✅ p.background
      
      p.drawingContext.shadowBlur = 6;  // ✅ p.drawingContext
      p.drawingContext.shadowColor = "rgba(0, 0, 0, 0.6)";
      p.drawingContext.shadowOffsetX = 10;
      p.drawingContext.shadowOffsetY = 10;
      p.noStroke();  // ✅ p.noStroke
      
      p.fill(68, 48, 40);  // ✅ p.fill
      
      // Horizontal sections
      p.rect(20, 40, p.width - 40, 40, 8);  // ✅ p.rect
      // p.rect(20, 100, p.width - 40, 20, 8);
      p.rect(20, p.height - 80, p.width - 40, 40, 8);  // ✅ p.height

      // Vertical sections
      p.fill(68, 48, 40);
      p.rect(40, 10, 40, p.height - 20, 8);  // ✅ p.height
      p.rect(p.width - 80, 10, 40, p.height - 20, 8);  // ✅ p.width, p.height
      
      p.drawingContext.shadowBlur = 0;  // ✅ p.drawingContext

      checks = [];
      for (let i = 0; i < numRows; i++) {
        let row = [];
        for (let j = 0; j < charsPerRow; j++) {
          const index = i * charsPerRow + j;
          if (index < binaryString.length) {
            row.push(new Check(i, j, binaryString[index] === "1"));
          } else {
            row.push(new Check(i, j, "None"));
          }
        }
        checks.push(row);
      }
    }

    function weave() {
      p.strokeWeight(step - empty);
      drawVerticalLines(); // Call the function to draw vertical lines
    }

    function drawVerticalLines() {
      verticalColorSequence = [];
      let verticalColors = colors.slice(0, verticalColorCount);

      for (
        let i = p.int(step / 2), count = 0;  // ✅ p.int
        i < p.width - 2 * loomMargin * step;  // ✅ p.width
        i += step, count++
      ) {
        let colorIndex = Math.floor(count / CW) % verticalColors.length;
        verticalColorSequence.push(colorIndex);

        p.drawingContext.shadowBlur = 4;  // ✅ p.drawingContext
        p.drawingContext.shadowColor = "rgba(0, 0, 0, 0.6)";
        p.drawingContext.shadowOffsetX = 2;
        p.drawingContext.shadowOffsetY = 4;

        p.stroke(verticalColors[colorIndex]);  // ✅ p.stroke
        p.line(i + loomMargin * step, 0, i + loomMargin * step, p.height);  // ✅ p.line, p.height

        // p.drawingContext.shadowBlur = 0;  // (optional reset if needed)
      }
      
      p.noStroke();  // ✅ p.noStroke
      p.fill(68, 48, 40);  // ✅ p.fill

      // Horizontal sections
      p.rect(20, 90, p.width - 40, 20, 8);  // ✅ p.rect, p.width

      // Vertical sections
      p.fill(68, 48, 40);
      p.rect(40, 10, 40, p.height - 20, 8);  // ✅ p.rect, p.height
      p.rect(p.width - 80, 10, 40, p.height - 20, 8);  // ✅ p.width, p.height

      drawRow(0);  // ✅ Assuming drawRow is a custom function, no need for p.
    }

    let direction = 1; // 1 for left-to-right, -1 for right-to-left

    function drawRow(i = 0) {
      p.strokeWeight(step - empty);  // ✅ p.strokeWeight
      let horizontalColors = colors.slice(
        verticalColorCount,
        verticalColorCount + horizontalColorCount
      ); // Remaining for horizontal lines

      // If API fails, ensure fallback colors are used
      if (horizontalColors.length === 0) {
        horizontalColors = colors; // Use the full fallback colors list
      }

      let charsPerRow = Math.floor((p.width - 2 * loomMargin * step) / step);  // ✅ p.width

      p.drawingContext.shadowBlur = 4;  // ✅ p.drawingContext
      p.drawingContext.shadowColor = "rgba(0, 0, 0, 0.2)";
      p.drawingContext.shadowOffsetX = 0;
      p.drawingContext.shadowOffsetY = 4;
      if (i >= checks.length) {
        setTimeout(() => {
            document.getElementById("popupModal").style.display = "block";
        }, 1000); // Show pop-up after the animation ends
        return;
    }

      let y = p.height - (i + 1) * step - loomMargin * step - 10;  // ✅ p.height
      
      p.stroke(horizontalColors[Math.floor(i / CW) % horizontalColors.length]);  // ✅ p.stroke
      if (i === 0) {
        p.line(0, y + 20, loomMargin * step + empty / 2, y); // ✅ p.line - starting weft section
      }

      p.drawingContext.shadowBlur = 0;

      function drawChar(j) {
        if (j >= checks[i].length) {
          if (i === checks.length - 1) {
            if (direction === 1) {
              p.line(
                charsPerRow * step + (loomMargin * step - empty / 2),
                y,
                p.width,  // ✅ p.width
                y - 20
              ); // Right side loose end
            } else {
              p.line(0, y - 20, loomMargin * step + empty / 2, y); // ✅ p.line - Left side loose end
            }
          } else {
            let nextY = p.height - (i + 1) * step - loomMargin * step;  // ✅ p.height
            let connectX =
              direction === 1 ? (charsPerRow + loomMargin) * step
                : loomMargin * step;

            p.noFill();  // ✅ p.noFill

            if (direction === 1) {
              // Right selvedge
              p.arc(
                connectX - 1,
                nextY - step - 2 * empty,
                step + empty,
                step,
                p.PI + p.HALF_PI,  // ✅ p.PI, p.HALF_PI
                p.HALF_PI  // ✅ p.HALF_PI
              );
            } else {
              // Left selvedge
              p.arc(
                connectX + 1,
                nextY - step - 2 * empty,
                step + empty,
                step,
                p.HALF_PI,  // ✅ p.HALF_PI
                p.PI + p.HALF_PI  // ✅ p.PI, p.HALF_PI
              );
            }
          }

          setTimeout(() => drawRow(i + 1), 50); // Start next row after a delay
          direction *= -1;
          return;
        }

        let x =
          direction === 1 ? (j + loomMargin) * step
            : (charsPerRow - j + loomMargin - 1) * step;
        let value = checks[i][j].value ? 1 : 0; // 1 for binary '1', 0 for binary '0'
        let colorIndex = verticalColorSequence[j % verticalColorSequence.length];
        let noteBaseIndex = value === 1 ? 0 : 1;

        let adjustedNoteIndex = (noteBaseIndex + colorIndex) % noteSounds.length;

        if (checks[i][j].value) {
          p.line(x - empty / 2, y, x + step + empty / 2, y); // ✅ p.line - weft up
          // noteSounds[adjustedNoteIndex].start(); //uncomment for sound
          setTimeout(() => noteSounds[adjustedNoteIndex].stop(), 1000);
        } else {
          p.line(x - empty / 2, y, x + empty / 2, y); // ✅ p.line - weft in gaps
          // Alternative weft gap rendering
          // p.line(x - empty / 2, y, x, y);
          // p.line(x + step, y, x + step + empty / 2, y);

          // noteSounds[(adjustedNoteIndex + 2) % noteSounds.length].start(); //uncomment for sound
          setTimeout(
            // () => noteSounds[(adjustedNoteIndex + 2) % noteSounds.length].stop(), //uncomment for sound
            100
          );
        }

        setTimeout(() => drawChar(j + 1), 2);
      }

      drawChar(0);
    }

    class Check {
      constructor(rang, index, value) {
        this.index = index;
        this.rang = rang;
        this.value = value;
      }

      display(p) {  // ✅ Pass the p5 instance as a parameter
        p.fill(255, 200);  // ✅ p.fill
        p.stroke(0);  // ✅ p.stroke
        p.strokeWeight(2);  // ✅ p.strokeWeight
      }
    }
};


function stopWeavingSketch() {
    if (sketchInstance) {
        sketchInstance.remove();
        sketchInstance = null;
    }
}




