"use strict";
import * as GLUtil from "../../common/glutil.js"

let theApp = null;

const vsSource = `#version 300 es
    in  vec4 a_Vertex;
    in  vec4 a_Color;
    in  vec2 a_TexCoord;
    out vec4 v_color;
    out vec2 v_texcoord;
    void main()
    {
        gl_Position = a_Vertex;
        v_color     = a_Color;
        v_texcoord  = a_TexCoord;
    }
`;

const fsSource = `#version 300 es
    precision mediump float;
    in  vec4 v_color;
    in  vec2 v_texcoord;
    out vec4 o_color;
    uniform sampler2D u_sampler;
    void main()
    {
        o_color = v_color * texture(u_sampler, v_texcoord);
    }
`;

const positions = [
    -0.5,  0.5,
    -0.5, -0.5,
     0.5,  0.5,
];

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


class GLApp
{
    constructor()
    {
        this.gl     = null;
        this.sobj   = null;
        this.vao    = null;
        this.texid  = null;
        this.video  = null;
    }

    initialize(args)
    {
        const canvas = document.querySelector('#glcanvas');
        const gl = canvas.getContext('webgl2');
        if (!gl)
        {
            alert('Failed to initialize WebGL2.');
            return;
        }

        gl.clearColor (0.5, 0.5, 0.5, 1.0);

        this.gl = gl;
    }

    loadScene()
    {
        const gl = this.gl;

        const sobj = GLUtil.Shader.generate_shader (gl, vsSource, fsSource);
        const vbos = this.init_vbos (gl);
        const vao  = this.init_vaos(gl, sobj, vbos);
        const texid = GLUtil.Texture.create_image_texture (gl, "../../assets/webgl.png");
        const video = GLUtil.Texture.create_video_texture (gl, "../../assets/BigBuckBunny_640x360.mp4");

        this.sobj   = sobj;
        this.vao    = vao;
        this.texid  = texid;
        this.video  = video;
    }

    init_vbos (gl)
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

    init_vaos (gl, sobj, vbos)
    {
        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, vbos.vbo_vtx);
        gl.enableVertexAttribArray(sobj.loc_vtx);
        gl.vertexAttribPointer    (sobj.loc_vtx, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, vbos.vbo_col);
        gl.enableVertexAttribArray(sobj.loc_clr);
        gl.vertexAttribPointer    (sobj.loc_clr, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, vbos.vbo_uv);
        gl.enableVertexAttribArray(sobj.loc_uv);
        gl.vertexAttribPointer    (sobj.loc_uv, 2, gl.FLOAT, false, 0, 0);

        return vao;
    }

    renderMain(now)
    {
        let gl      = this.gl;
        let sobj    = this.sobj;
        let vao     = this.vao;
        let texid   = this.texid;

        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(sobj.program);

        gl.activeTexture (gl.TEXTURE0);
        if (this.video.ready)
        {
            GLUtil.Texture.update_video_texture (gl, this.video)
            gl.bindTexture (gl.TEXTURE_2D, this.video.texid);
        }
        else
            gl.bindTexture (gl.TEXTURE_2D, texid);
        gl.uniform1i (sobj.loc_smp, 0);

        gl.bindVertexArray(vao);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 3);

        requestAnimationFrame((now) => this.renderMain(now));
    }

    runMainLoop()
    {
        requestAnimationFrame((now) => this.renderMain(now));
    }
}

/* ---------------------------------------------------------------- *
 *      M A I N    F U N C T I O N
 * ---------------------------------------------------------------- */
function
startWebGL(args)
{
    try
    {
        theApp = new GLApp();
        theApp.initialize(args);
        theApp.loadScene();
        theApp.runMainLoop();
    }
    catch (e)
    {
        alert("エラーが発生しました。\n" + `${e.message}(${e.stack})`);
    }
}

window.startWebGL = startWebGL;
