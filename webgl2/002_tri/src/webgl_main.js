import * as GLUtil from "../../common/glutil.js"


const vsSource = `#version 300 es
    in  vec4 a_Vertex;
    in  vec4 a_Color;
    out vec4 v_color;
    void main()
    {
        gl_Position = a_Vertex;
        v_color     = a_Color;
    }
`;

const fsSource = `#version 300 es
    precision mediump float;
    in  vec4 v_color;
    out vec4 o_color;
    void main()
    {
        o_color = v_color;
    }
`;

const positions = [
    -0.5,  0.5,
    -0.5, -0.5,
     0.5,  0.5,
];

const colors = [
     1.0, 0.0, 0.0, 1.0,
     0.0, 1.0, 0.0, 1.0,
     0.0, 0.0, 1.0, 1.0,
];

function init_vbos (gl)
{
    const buf_vtx = gl.createBuffer();
    gl.bindBuffer (gl.ARRAY_BUFFER, buf_vtx);
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    const buf_col = gl.createBuffer();
    gl.bindBuffer (gl.ARRAY_BUFFER, buf_col);
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    return {
        vbo_vtx: buf_vtx,
        vbo_col: buf_col,
    };
}

function init_vaos (gl, sobj, vbos)
{
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbos.vbo_vtx);
    gl.enableVertexAttribArray(sobj.loc_vtx);
    gl.vertexAttribPointer    (sobj.loc_vtx, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbos.vbo_col);
    gl.enableVertexAttribArray(sobj.loc_clr);
    gl.vertexAttribPointer    (sobj.loc_clr, 4, gl.FLOAT, false, 0, 0);

    return vao;
}

function drawScene(gl, sobj, vao)
{
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(sobj.program);

    gl.bindVertexArray(vao);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);
}


function
startWebGL()
{
    const canvas = document.querySelector('#glcanvas');
    const gl = canvas.getContext('webgl2');
    if (!gl)
    {
        alert('Failed to initialize WebGL2.');
        return;
    }

    gl.clearColor (0.5, 0.5, 0.5, 1.0);
    gl.clear (gl.COLOR_BUFFER_BIT);

    const sobj = GLUtil.Shader.generate_shader (gl, vsSource, fsSource);
    const vbos = init_vbos (gl);
    const vao  = init_vaos(gl, sobj, vbos);

    drawScene(gl, sobj, vao);
}

window.startWebGL = startWebGL;
