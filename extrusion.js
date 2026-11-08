// extrusion.js

function extrude2D(vertices2D, depth, red, green, blue) {
    //Convert the RGB value with value compatible with this function way of reading colours
    let newR = red / 255;
    let newG = green / 255;
    let newB = blue / 255;
    let RB = newR * 0.4;
    let GB = newG * 0.4;
    let BB = newB * 0.4;
    let RS = newR * 0.6;
    let GS = newG * 0.6;
    let BS = newB * 0.6;

    //To avoid and handle negative value
    if (RB < 0)
    {
        RB = 0.0;
    }
    if (GB < 0)
    {
        GB = 0.0;
    }
    if (BB < 0)
    {
        BB = 0.0;
    }
    if (RS < 0)
    {
        RS = 0.0;
    }
    if (GS < 0)
    {
        GS = 0.0;
    }
    if (BS < 0)
    {
        BS = 0.0;
    }


    // Negative Z brings the front face closer to the camera
    const z = -(depth / 2.0);
    const positions = [];
    const colors = [];

    // Define different shades of colour to imitate 3D lighting
    const colorFront = [newR, newG, newB, 1.0]; // Bright Cyan
    const colorBack  = [RB, GB, BB, 1.0]; // Dark Cyan  (Note for offset: (-0.4,-0.4,-0.4,NA))
    const colorSide  = [RS, GS, BS, 1.0]; // Darkest Cyan (Note for offset: (-0.6,-0.6,-0.6,NA))

    function addColor(colorArray, vertexCount) {
        for (let j = 0; j < vertexCount; j++) {
            colors.push(...colorArray);
        }
    }

    // Loop through the 2D array (2 coordinates per vertex, 3 vertices per triangle = 6 elements)
    for (let i = 0; i < vertices2D.length; i += 6) {
        const x1 = vertices2D[i],   y1 = vertices2D[i+1];
        const x2 = vertices2D[i+2], y2 = vertices2D[i+3];
        const x3 = vertices2D[i+4], y3 = vertices2D[i+5];

        // 1. FRONT FACE (Standard winding: v1, v2, v3)
        positions.push(x1, y1, z,  x2, y2, z,  x3, y3, z);
        addColor(colorFront, 3);

        // 2. BACK FACE (Reversed winding: v1, v3, v2)
        positions.push(x1, y1, -z,  x3, y3, -z,  x2, y2, -z);
        addColor(colorBack, 3);

        // 3. SIDE WALLS (Connecting front to back for all 3 edges of the triangle)
        positions.push(
            x1, y1, z,   x2, y2, z,   x1, y1, -z,
            x1, y1, -z,  x2, y2, z,   x2, y2, -z,

            x2, y2, z,   x3, y3, z,   x2, y2, -z,
            x2, y2, -z,  x3, y3, z,   x3, y3, -z,
            
            x3, y3, z,   x1, y1, z,   x3, y3, -z,
            x3, y3, -z,  x1, y1, z,   x1, y1, -z
        );
        addColor(colorSide, 18);
    }
    
    return {
        positions: new Float32Array(positions),
        colors: new Float32Array(colors)
    };
}