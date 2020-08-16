const vsSource = `
    attribute vec4 a_Vertex;
    attribute vec4 a_Color;
    attribute vec2 a_TexCoord;
    varying   vec4 v_color;
    varying   vec2 v_texcoord;
    void main()
    {
        gl_Position = a_Vertex;
        v_color     = a_Color;
        v_texcoord  = a_TexCoord;
    }
`;

const fsSource = `
    precision mediump float;
    varying   vec4 v_color;
    varying   vec2 v_texcoord;
    uniform   sampler2D u_sampler;
    void main()
    {
        gl_FragColor = v_color * texture2D(u_sampler, v_texcoord);
    }
`;

const positions = [     // 0       2
    -0.5,  0.5,         // +-------+
    -0.5, -0.5,         // |       |
     0.5,  0.5,         // +-------+
];                      // 1       3

const colors = [
     1.0, 1.0, 1.0, 1.0,
     1.0, 1.0, 1.0, 1.0,
     1.0, 1.0, 1.0, 1.0,
];

const texcoord = [
     0.0, 0.0,
     0.0, 1.0,
     1.0, 0.0,
];

function init_vbos (gl)
{
    const buf_vtx = gl.createBuffer();
    gl.bindBuffer (gl.ARRAY_BUFFER, buf_vtx);
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const buf_col = gl.createBuffer();
    gl.bindBuffer (gl.ARRAY_BUFFER, buf_col);
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    const buf_uv  = gl.createBuffer();
    gl.bindBuffer (gl.ARRAY_BUFFER, buf_uv);
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(texcoord), gl.STATIC_DRAW);

    return {
        vbo_vtx: buf_vtx,
        vbo_col: buf_col,
        vbo_uv : buf_uv,
    };
}


function handleLoadedTexture (gl, teximage, texid)
{
    gl.bindTexture (gl.TEXTURE_2D, texid);
    gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, teximage);
    gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri (gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindTexture (gl.TEXTURE_2D, null);
}

function load_texture (gl, fname)
{
    texid = gl.createTexture();
    teximage = new Image();

    teximage.onload = function ()
    {
        gl.bindTexture(gl.TEXTURE_2D, texid);
        gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, teximage);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    teximage.src = fname;

    return texid;
}

function init_texture (gl)
{
    texid = load_texture (gl, "webgl.png");
    return texid;
}

function drawScene(gl, sobj, vbos, texid)
{
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(sobj.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbos.vbo_vtx);
    gl.enableVertexAttribArray(sobj.loc_vtx);
    gl.vertexAttribPointer    (sobj.loc_vtx, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbos.vbo_col);
    gl.enableVertexAttribArray(sobj.loc_clr);
    gl.vertexAttribPointer    (sobj.loc_clr, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbos.vbo_uv);
    gl.enableVertexAttribArray(sobj.loc_uv);
    gl.vertexAttribPointer    (sobj.loc_uv, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture (gl.TEXTURE0);
    gl.bindTexture (gl.TEXTURE_2D, texid);
    gl.uniform1i (sobj.loc_smp, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
}


function startWebGL()
{
    const canvas = document.querySelector('#glcanvas');
    const gl = canvas.getContext('webgl');
    if (!gl) 
    {
        alert('Failed to initialize WebGL.');
        return;
    }

    gl.clearColor (0.5, 0.5, 0.5, 1.0);
    gl.clear (gl.COLOR_BUFFER_BIT);

    const sobj = GLUtil.generate_shader (gl, vsSource, fsSource);
    const vbos = init_vbos (gl);
    const texid = init_texture (gl);

    function render (now)
    {
        drawScene(gl, sobj, vbos, texid);
        requestAnimationFrame (render);
    }
    requestAnimationFrame (render);
}

