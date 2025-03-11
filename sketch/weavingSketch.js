let sketchInstance;
let currentText = "";
let apiKey =
  "k-proj-79SbzXwF3wCT1jMXfJJ9EyWaBWwziJCj0IppOSoLOtxM7vaS32P-bZ1_LY-nZXi0g2bwEEhNUTT3BlbkFJT40HZZpMsguIk_7pP2ds-OlgliHGSg9hu3R658zWS5QLSTTUNGj5RyakyVKiczrj2BsnmdvaQA"; 

function startWeavingSketch(text) {
    if (sketchInstance) {
        sketchInstance.remove(); // Remove any existing sketch before creating a new one
    }

    currentText = text; // Store the text from the selected street/intersection

    sketchInstance = new p5((p) => {
        let colors = [];
        let checks = [];
        let step = 8;
        let empty = 2;
        let loomMargin = 14;
        let noteSounds = [];
        let verticalColorSequence = [];
        let totalColors = 10;
        let verticalColorCount = 5;
        let horizontalColorCount = 5;
        let CW = 3;
        let direction = 1; // 1 for left-to-right, -1 for right-to-left


        p.preload = function () {
            img = p.loadImage('sketch/assets/loom.png');
            for (let i = 0; i < 16; i++) {
                noteSounds[i] = new p5.Oscillator("sine");
                noteSounds[i].freq(100 + i * 50);
                noteSounds[i].amp(0.2);
            }
        };

        p.setup = function () {
            let canvas = p.createCanvas(800, 800);
            canvas.parent("weaving-container");
            p.background(255);
            p.image(img, 0, 0);

            CW = p.int(p.random(1, 4));

            // Immediately analyze and start weaving
            analyzeText(currentText).then(() => {
                weave(); // Start weaving as soon as text is analyzed
            });
        };


        async function analyzeText(text) {
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
                                content: `Generate a list of at least ${totalColors} colors that are a part of one harmonious palette that represent the meaning of this text in color-theory: "${text}". Format each color as "rgb(r, g, b)" where r, g, and b are integers between 0 and 255.`,
                            },
                        ],
                        max_tokens: 300,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }

                let data = await response.json();

                if (data.choices && data.choices.length > 0) {
                    let colorString = data.choices[0].message.content.trim();
                    colors = colorString.match(/rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)/g) || [];
                    colors = colors.map((c) => p.color(c));

                    if (colors.length > totalColors) colors = colors.slice(0, totalColors);

                    initiate(text);
                    p.redraw();
                }
            } catch (error) {
                console.error("Error during API call:", error.message);
                colors = [
                    p.color(180, 40, 60),
                    p.color(120, 30, 70),
                    p.color(180, 70, 50),
                    p.color(160, 100, 40),
                    p.color(150, 20, 90),
                    p.color(170, 30, 40),
                ];
                initiate(text);
                p.redraw();
            }
        }

        function initiate(inputString) {
            const binaryString = inputString
                .split("")
                .map((char) => char.charCodeAt(0).toString(2).padStart(8, "0"))
                .join("");

            let charsPerRow = p.width / step - loomMargin * 2;
            const numRows = Math.ceil(binaryString.length / charsPerRow);

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
            drawVerticalLines();
        }

        function drawVerticalLines() {
            verticalColorSequence = [];
            let verticalColors = colors.slice(0, verticalColorCount);

            for (let i = p.int(step / 2), count = 0; i < p.width - 2 * loomMargin * step; i += step, count++) {
                let colorIndex = Math.floor(count / CW) % verticalColors.length;
                verticalColorSequence.push(colorIndex);

                p.drawingContext.shadowBlur = 4;
                p.drawingContext.shadowColor = 'rgba(0, 0, 0, 0.6)';
                p.drawingContext.shadowOffsetX = 2;
                p.drawingContext.shadowOffsetY = 4;

                p.stroke(verticalColors[colorIndex]);
                p.line(i + loomMargin * step, 0, i + loomMargin * step, p.height);
            }
            drawRow(0);
        }

        function drawRow(i = 0) {
    console.log(`Drawing row ${i}`); // ✅ Debugging

    p.strokeWeight(step - empty);
    let horizontalColors = colors.slice(verticalColorCount, verticalColorCount + horizontalColorCount);
    let charsPerRow = Math.floor((p.width - 2 * loomMargin * step) / step);

    p.drawingContext.shadowBlur = 4;
    p.drawingContext.shadowColor = 'rgba(0, 0, 0, 0.2)';
    p.drawingContext.shadowOffsetX = 0;
    p.drawingContext.shadowOffsetY = 4;

    if (i >= checks.length) {
        console.log("✅ Finished all rows");
        return; // ✅ Stop when all rows are drawn
    }

    let y = p.height - (i + 1) * step - loomMargin * step - 10;
    p.stroke(horizontalColors[Math.floor(i / CW) % horizontalColors.length]);

    if (i === 0) {
        console.log("➡ Drawing first line");
        p.line(0, y, loomMargin * step + empty / 2, y);
    }

    p.drawingContext.shadowBlur = 0;

    function drawChar(j) {
        if (j >= checks[i].length) {
            console.log(`✅ Finished row ${i}, moving to row ${i + 1}`);
            setTimeout(() => drawRow(i + 1), 50);
            direction *= -1;
            return;
        }

        let x = (direction === 1) ? (j + loomMargin) * step : (charsPerRow - j + loomMargin - 1) * step;
        let value = checks[i][j].value ? 1 : 0;
        let colorIndex = verticalColorSequence[j % verticalColorSequence.length];
        let noteBaseIndex = value === 1 ? 0 : 1;

        let adjustedNoteIndex = (noteBaseIndex + colorIndex) % noteSounds.length;

        if (checks[i][j].value) {
            console.log(`🎵 Playing sound ${adjustedNoteIndex}`);
            p.line(x - empty / 2, y, x + step + empty / 2, y);
            noteSounds[adjustedNoteIndex].start();
            setTimeout(() => noteSounds[adjustedNoteIndex].stop(), 1000);
        } else {
            console.log(`- Skipping weave at x=${x}, y=${y}`);
            p.line(x - empty / 2, y, x + empty / 2, y);
            noteSounds[(adjustedNoteIndex + 2) % noteSounds.length].start();
            setTimeout(() => noteSounds[(adjustedNoteIndex + 2) % noteSounds.length].stop(), 100);
        }

        setTimeout(() => drawChar(j + 1), 60);
    }

    drawChar(0);
}


        class Check {
            constructor(rang, index, value) {
                this.index = index;
                this.rang = rang;
                this.value = value;
            }
        }
    });
}

function stopWeavingSketch() {
    if (sketchInstance) {
        sketchInstance.remove();
        sketchInstance = null;
    }
}
