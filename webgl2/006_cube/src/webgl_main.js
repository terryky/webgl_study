"use strict";
import * as GLUtil from "../../common/glutil.js"

let theApp = null;

const s_vtx = [
    -1.0, 1.0,  1.0,
    -1.0,-1.0,  1.0,
     1.0, 1.0,  1.0,
     1.0,-1.0,  1.0,

     1.0, 1.0, -1.0,
     1.0,-1.0, -1.0,
    -1.0, 1.0, -1.0,
    -1.0,-1.0, -1.0,

     1.0,  1.0, 1.0,
     1.0, -1.0, 1.0,
     1.0,  1.0,-1.0,
     1.0, -1.0,-1.0,

    -1.0,  1.0,-1.0,
    -1.0, -1.0,-1.0,
    -1.0,  1.0, 1.0,
    -1.0, -1.0, 1.0,

     1.0,  1.0, 1.0,
     1.0,  1.0,-1.0,
    -1.0,  1.0, 1.0,
    -1.0,  1.0,-1.0,

    -1.0, -1.0, 1.0,
    -1.0, -1.0,-1.0,
     1.0, -1.0, 1.0,
     1.0, -1.0,-1.0,
];

const s_nrm = [
     0.0,  0.0,  1.0,
     0.0,  0.0, -1.0,
     1.0,  0.0,  0.0,
    -1.0,  0.0,  0.0,
     0.0,  1.0,  0.0,
     0.0, -1.0,  0.0,
];

const s_uv = [
     0.0, 0.0,
     0.0, 1.0,
     1.0, 0.0,
     1.0, 1.0,
];


const s_strVS = `
    attribute vec4  a_Vertex;
    attribute vec4  a_Normal;
    attribute vec2  a_TexCoord;
    uniform   mat4  u_PMVMatrix;
    uniform   mat4  u_MVMatrix;
    uniform   mat4  u_MVITMatrix;
    varying   vec3  v_diffuse;
    varying   vec3  v_specular;
    varying   vec2  v_texcoord;
    const     float shiness = 16.0;
    const     vec3  LightPos = vec3(4.0, 4.0, 4.0);
    const     vec3  LightCol = vec3(0.5, 0.5, 0.5);

    void DirectionalLight (vec3 normal, vec3 eyePos)
    {
        vec3  lightDir = normalize (LightPos);
        vec3  halfV    = normalize (LightPos - eyePos);
        float dVP      = max(dot(normal, lightDir), 0.0);
        float dHV      = max(dot(normal, halfV   ), 0.0);

        float pf = 0.0;
        if(dVP > 0.0)
            pf = pow(dHV, shiness);

        v_diffuse += dVP * LightCol;
        v_specular+= pf  * LightCol;
    }

    void main(void)
    {
        gl_Position = u_PMVMatrix * a_Vertex;
        vec3 normal = normalize(vec3(u_MVITMatrix * a_Normal));
        vec3 eyePos = normalize(vec3(u_MVMatrix   * a_Vertex));

        v_diffuse  = vec3(0.0);
        v_specular = vec3(0.0);
        DirectionalLight(normal, eyePos);

        v_texcoord  = a_TexCoord;
    }
`;

const s_strFS = `
    precision mediump float;

    uniform vec3    u_color;
    uniform float   u_alpha;
    varying vec3    v_diffuse;
    varying vec3    v_specular;
    varying vec2    v_texcoord;
    uniform sampler2D u_sampler;

    void main(void)
    {
        vec3 color;
        color = vec3(texture2D(u_sampler,  v_texcoord));
        color += (u_color * v_diffuse);
        color += v_specular;
        gl_FragColor = vec4(color, u_alpha);
    }
`;



class GLApp
{
    constructor()
    {
        this.gl     = null;
        this.sobj   = null;
        this.vao    = null;
        this.texid  = null;
        this.video  = null;

        this.matPrj = new Array(16);
        this.count  = 0;
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

        const vboVtx = gl.createBuffer();
        gl.bindBuffer (gl.ARRAY_BUFFER, vboVtx);
        gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(s_vtx), gl.STATIC_DRAW);

        const vboUv = gl.createBuffer();
        gl.bindBuffer (gl.ARRAY_BUFFER, vboUv);
        gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(s_uv), gl.STATIC_DRAW);

        const sobj = GLUtil.Shader.generate_shader (gl, s_strVS, s_strFS);
        this.locMtxMV  = gl.getUniformLocation (sobj.program, `u_MVMatrix`);
        this.locMtxPMV = gl.getUniformLocation (sobj.program, `u_PMVMatrix`);
        this.locMtxMVIT= gl.getUniformLocation (sobj.program, `u_MVITMatrix`);
        this.locColor  = gl.getUniformLocation (sobj.program, `u_color`);
        this.locAlpha  = gl.getUniformLocation (sobj.program, `u_alpha`);

        GLUtil.Matrix.proj_perspective (this.matPrj, 72.0, 640/480, 1, 1000);

        const texid = GLUtil.Texture.create_image_texture (gl, "../../assets/webgl.png");
        const video = GLUtil.Texture.create_video_texture (gl, "../../assets/BigBuckBunny_640x360.mp4");

        this.sobj   = sobj;
        this.vboVtx = vboVtx;
        this.vboUv  = vboUv;
        this.texid  = texid;
        this.video  = video;
    }

    renderMain(now)
    {
        let gl      = this.gl;
        let sobj    = this.sobj;
        let texid   = this.texid;
        let count   = this.count;

        gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable (gl.DEPTH_TEST);

        gl.useProgram (sobj.program);

        {
            var matMV   = new Array( 16 );
            var matPMV  = new Array( 16 );
            var matMVIT = new Array( 16 );

            GLUtil.Matrix.identity (matMV);
            GLUtil.Matrix.translate (matMV, 0.0, 0.0, -3.5);
            GLUtil.Matrix.rotate (matMV, 30.0 * Math.sin(count*0.01), 1.0, 0.0, 0.0);
            GLUtil.Matrix.rotate (matMV, count*1.0, 0.0, 1.0, 0.0);

            GLUtil.Matrix.copy (matMVIT, matMV);
            GLUtil.Matrix.invert   (matMVIT);
            GLUtil.Matrix.transpose(matMVIT);

            GLUtil.Matrix.mult (matPMV, this.matPrj, matMV);

            gl.uniformMatrix4fv (this.locMtxMV,   false, matMV );
            gl.uniformMatrix4fv (this.locMtxPMV,  false, matPMV);
            gl.uniformMatrix4fv (this.locMtxMVIT, false, matMVIT);
        }

        gl.uniform3f (this.locColor, 0.5, 0.5, 0.5);
        gl.uniform1f (this.locAlpha, 0.8);

        gl.activeTexture (gl.TEXTURE0);
        if (this.video.ready)
        {
            GLUtil.Texture.update_video_texture (gl, this.video)
            gl.bindTexture (gl.TEXTURE_2D, this.video.texid);
        }
        else
            gl.bindTexture (gl.TEXTURE_2D, texid);
        gl.uniform1i (sobj.loc_smp, 0);

        gl.enableVertexAttribArray  (sobj.loc_vtx);
        gl.enableVertexAttribArray  (sobj.loc_uv );
        gl.disableVertexAttribArray (sobj.loc_nrm);

        gl.bindBuffer (gl.ARRAY_BUFFER, this.vboUv);
        gl.vertexAttribPointer (sobj.loc_uv, 2, gl.FLOAT, false, 0, 0);

        gl.enable (gl.BLEND);
        gl.blendFuncSeparate (gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        for (let i = 0; i < 6; i ++)
        {
            gl.bindBuffer (gl.ARRAY_BUFFER, this.vboVtx);
            gl.vertexAttribPointer (sobj.loc_vtx, 3, gl.FLOAT, false, 0, 4 * 4 * 3 * i);

            var nx = s_nrm[3 * i + 0];
            var ny = s_nrm[3 * i + 1];
            var nz = s_nrm[3 * i + 2];
            gl.vertexAttrib3f (sobj.loc_nrm, nx, ny, nz);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }
        gl.disable (gl.BLEND);

        this.count ++;
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
