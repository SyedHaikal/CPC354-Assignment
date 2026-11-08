
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

const geometry3D = extrude2D(vertices, 0.2);

//Load Position Data directly into the GPU
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, geometry3D.positions, gl.STATIC_DRAW);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, geometry3D.colors, gl.STATIC_DRAW);

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
const animationTypeInput = document.getElementById("animationType");
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

animationTypeInput.addEventListener("change", () => {
    animationType = animationTypeInput.value;
    animationTime = 0;
    lastFrameTime = performance.now();
});

speedInput.addEventListener("input", () => {
    animationSpeed = Number(speedInput.value);
    speedValue.textContent = `${animationSpeed}x`;
});

directionButton.addEventListener("click", () => {
    animationDirection *= -1;
    directionButton.textContent = animationDirection === 1
        ? "Direction: Right"
        : "Direction: Left";
});

function drawScene() {
    const now = performance.now();
    if (isPlaying) {
        animationTime += (now - lastFrameTime) * animationSpeed;
    }
    lastFrameTime = now;

    const time = animationTime / 1000;
    const direction = animationDirection;
    let angle = 0;
    let scale = 1;
    let x = 0;
    let y = 0;

    switch (animationType) {
        case "rotate":
            angle = Math.sin(time * 2) * 0.7 * direction;
            break;
        case "float":
            y = Math.sin(time * 2) * 0.22;
            angle = Math.sin(time * 2) * 0.12 * direction;
            break;
        case "orbit":
            x = Math.cos(time * 1.5) * 0.25;
            y = Math.sin(time * 1.5) * 0.18;
            angle = Math.sin(time * 1.5) * 0.3 * direction;
            break;
        case "pulse":
            scale = 1 + Math.sin(time * 2) * 0.12;
            angle = Math.sin(time * 2) * 0.15 * direction;
            break;
        case "spin":
        default:
            angle = time * 1.5 * direction;
            break;
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

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const vertexCount = geometry3D.positions.length / 3;
    gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
    
    requestAnimationFrame(drawScene); 
}

drawScene();