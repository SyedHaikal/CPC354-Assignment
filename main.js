
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
    alert("WebGL not supported in this browser.");
}

//Define the 2D vertices for the word "LAG"
const vertices = new Float32Array([
    // --- LETTER "L" ---
    -0.95,0.5,   -0.95,-0.4,  -0.8,0.4,
    -0.8,-0.5,  -0.95,-0.4,  -0.8,0.4,
    -0.8,-0.35, -0.4,-0.35, -0.8,-0.5,
    -0.4,-0.5,  -0.4,-0.35, -0.8,-0.5,

    // --- LETTER "A" ---
    -0.30,-0.4, -0.30,0.4,  -0.15,-0.5,
    -0.15,0.5,   -0.30,0.4,  -0.15,-0.5,
    0.33,-0.5,  -0.15,0.5,   0.15,-0.5,
    -0.15,0.14,  -0.15,0.5,   0.15,-0.5,
    -0.03,-0.15, -0.10,0.0,  -0.15,-0.15,
    -0.15,0.0,   -0.10,0.0,  -0.15,-0.15,

    // --- LETTER "G" ---
    0.4,0.5, 0.55,0.5, 0.4,-0.4,
    0.55,-0.5, 0.55,0.5, 0.4,-0.4,
    0.55,0.5, 0.8,0.5, 0.55,0.35,
    0.8,0.35, 0.8,0.5, 0.55,0.35,
    0.8,0.5, 0.95,0.4, 0.8,0.05,
    0.95,0.05, 0.95,0.4, 0.8,0.05,
    0.6,-0.05, 0.95,-0.05, 0.6,-0.2,
    0.95,-0.2, 0.95,-0.05, 0.6,-0.2,
    0.8,-0.2, 0.95,-0.2, 0.8,-0.35,
    0.95,-0.35, 0.95,-0.2, 0.8,-0.35,
    0.55,-0.35, 0.95,-0.35, 0.55,-0.5,
    0.95,-0.5, 0.95,-0.35, 0.55,-0.5
]);

//Default depth extrusion value
let depth = 0.2;

//Variable to store colour value
let colorRed = 0;
let colorGreen = 204;
let colorBlue = 255;

//Making the "LAG" TV ident 3D
let geometry3D = extrude2D(vertices, depth, colorRed, colorGreen, colorBlue);

//Load Position Data directly into the GPU
let positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, geometry3D.positions, gl.STATIC_DRAW);

//Load Colour Data directly into the GPU
let colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, geometry3D.colors, gl.STATIC_DRAW);

//Slider to let the user change the extrusion depth of the TV ident
const extDepth = document.getElementById("extDepth");
extDepth.addEventListener('input', (event) => {
    depth = parseFloat(event.target.value);
    //Making the "LAG" TV ident 3D
    geometry3D = extrude2D(vertices, depth, colorRed, colorGreen, colorBlue);

    //Load Position Data directly into the GPU again so that the extrusion depth change can be applied
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry3D.positions, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry3D.colors, gl.STATIC_DRAW);
});

//Colour picker to let the user change the TV ident colour
const logoCol = document.getElementById("logoCol");
logoCol.addEventListener('input', (event) => {
    let colorHex = event.target.value;

    // Convert Hex Colour value to RGB Colour value
    colorRed = parseInt(colorHex.substring(1, 3), 16);
    colorGreen = parseInt(colorHex.substring(3, 5), 16);
    colorBlue = parseInt(colorHex.substring(5, 7), 16);

    //Making the "LAG" TV ident 3D
    let geometry3D = extrude2D(vertices, depth, colorRed, colorGreen, colorBlue);

    //Load Colour Data directly into the GPU
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, geometry3D.colors, gl.STATIC_DRAW);
});

//Shaders
const vsSource = `
    attribute vec4 a_position;
    attribute vec4 a_color;
    uniform mat4 u_matrix;
    varying vec4 v_color;
    
    void main() {
        gl_Position = u_matrix * a_position;
        v_color = a_color; // Pass the color to the fragment shader
    }
`;
const fsSource = `
    precision mediump float;
    varying vec4 v_color;
    void main() {
        gl_FragColor = v_color; 
    }
`;

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

const program = gl.createProgram();
gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vsSource));
gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fsSource));
gl.linkProgram(program);
gl.useProgram(program);

const positionLocation = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
// Instruct WebGL to pull 3 coordinates (X, Y, Z) per vertex
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

const colorLocation = gl.getAttribLocation(program, "a_color");
gl.enableVertexAttribArray(colorLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
// Instruct WebGL to pull 4 coordinates (R, G, B, A) per vertex
gl.vertexAttribPointer(colorLocation, 4, gl.FLOAT, false, 0, 0);

const matrixLocation = gl.getUniformLocation(program, "u_matrix");

// 7. Enable Depth Testing so front faces hide back faces
gl.enable(gl.DEPTH_TEST);

// 8. Animation loops selected by the user.
let animationTime = 0;
let lastFrameTime = performance.now();
let isPlaying = true;
let animationDirection = 1;
let animationSpeed = 1;
let animationType = "spin";

const playPauseButton = document.getElementById("playPause");
const resetButton = document.getElementById("reset");
const speedInput = document.getElementById("speed");
const speedValue = document.getElementById("speedValue");
const directionButton = document.getElementById("direction");

playPauseButton.addEventListener("click", () => {
    isPlaying = !isPlaying;
    playPauseButton.textContent = isPlaying ? "Pause" : "Play";
    lastFrameTime = performance.now();
});

resetButton.addEventListener("click", () => {
    animationTime = 0;
    isPlaying = true;
    playPauseButton.textContent = "Pause";
    lastFrameTime = performance.now();
});

speedInput.addEventListener("input", () => {
    animationSpeed = Number(speedInput.value);
    speedValue.textContent = `${animationSpeed}x`;
});

function drawScene() {
    const now = performance.now();
    if (isPlaying) {
        animationTime += (now - lastFrameTime) * animationSpeed;
    }
    lastFrameTime = now;

    //Time in seconds
    const time = animationTime / 1000;
    let angle = 0;
    let scale = 0.5;
    let x = 0;
    let y = 0;


    // Phase 1: Rotate right by 180 degrees
    if (time <= 2.0)
    {
        let animProg = time / 2.0;
        angle = animProg * Math.PI;
    }

    // Phase 2: Rotate back to original
    else if (time <= 4.0)
    {
        let animProg = (time - 2.0) / 2.0;
        angle = Math.PI - (animProg * Math.PI);
    }

    // Phase 3: Rotate left by 180 degrees
    else if (time <= 6.0)
    {
        let animProg = (time - 4.0) / 2.0;
        angle = -(animProg * Math.PI);
    }

    // Phase 4: Rotate back to original
    else if (time <= 8.0)
    {
        let animProg = (time - 6.0) / 2.0;
        angle = -Math.PI + (animProg * Math.PI);
    }

    // Phase 5: Gradually enlarge
    else if (time <= 10.0)
    {
        let animProg = (time - 8.0) / 2.0;
        scale = 0.5 + (animProg * 0.5);
    }

    // Phase 6: Continuous "move about" loop
    else
    {
        scale = 1.0;
        y = Math.sin((time - 10.0) * 2.0) * 0.15;
        angle = Math.sin((time - 10.0) * 1.5) * 0.2;
    }

    const cos = Math.cos(angle) * scale;
    const sin = Math.sin(angle) * scale;

    const rotationMatrix = new Float32Array([
         cos,  0.0,  sin,  0.0,
         0.0,  scale, 0.0,  0.0,
        -sin,  0.0,  cos,  0.0,
         x,    y,     0.0, 1.0
    ]);

    gl.uniformMatrix4fv(matrixLocation, false, rotationMatrix);

    gl.clearColor(0.192, 0.200, 0.220, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const vertexCount = geometry3D.positions.length / 3;
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    
    requestAnimationFrame(drawScene); 
}

drawScene();