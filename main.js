
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl");

if (!gl) {
    alert("WebGL not supported in this browser.");
}

//Define the 2D vertices for the letter "T" and "V"
const verticesTV = new Float32Array([
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

//Load 2D Position Data directly into the GPU
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, verticesTV, gl.STATIC_DRAW);

//Shaders
const vsSource = `
    attribute vec2 a_position;
    void main() {
        // Hardcode Z to 0.0 and W to 1.0 for a flat 2D view
        gl_Position = vec4(a_position, 0.0, 1.0);
    }
`;
const fsSource = `
    void main() {
        // Render the shape in solid Cyan
        gl_FragColor = vec4(0.0, 0.8, 1.0, 1.0); 
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

//Bind Attributes
const positionLocation = gl.getAttribLocation(program, "a_position");
gl.enableVertexAttribArray(positionLocation);
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
//Instruct WebGL to pull 2 coordinates (X, Y) per vertex
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

//Draw the Static 2D Scene
gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

const vertexCount = verticesTV.length / 2; // Divide by 2 because we have X and Y
gl.drawArrays(gl.TRIANGLES, 0, vertexCount);