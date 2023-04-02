var     g_sobj;
var     g_matPrj = new Array(16);
var     g_loc_mtx_mv;
var     g_loc_mtx_pmv;
var     g_loc_mtx_nrm;
var     g_loc_color;
var     g_loc_alpha;
var     g_vbo_vtx;
var     g_vbo_uv;



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
     0.0, 1.0,
     0.0, 0.0,
     1.0, 1.0,
     1.0, 0.0,
];


const s_strVS = `
    attribute vec4  a_Vertex;
    attribute vec3  a_Normal;
    attribute vec2  a_TexCoord;
    uniform   mat4  u_PMVMatrix;
    uniform   mat4  u_MVMatrix;
    uniform   mat3  u_ModelViewIT;
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
        vec3 normal = normalize(u_ModelViewIT * a_Normal);
        vec3 eyePos = vec3(u_MVMatrix * a_Vertex);

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


/* ---------------------------------------------------------------- *
 *  Render Cube
 * ---------------------------------------------------------------- */
function init_cube (gl)
{
    g_vbo_vtx = gl.createBuffer();
    gl.bindBuffer (gl.ARRAY_BUFFER, g_vbo_vtx);
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(s_vtx), gl.STATIC_DRAW);

    g_vbo_uv = gl.createBuffer();
    gl.bindBuffer (gl.ARRAY_BUFFER, g_vbo_uv);
    gl.bufferData (gl.ARRAY_BUFFER, new Float32Array(s_uv), gl.STATIC_DRAW);

    g_sobj = GLUtil.generate_shader (gl, s_strVS, s_strFS);
    g_loc_mtx_mv  = gl.getUniformLocation (g_sobj.program, `u_MVMatrix`);
    g_loc_mtx_pmv = gl.getUniformLocation (g_sobj.program, `u_PMVMatrix`);
    g_loc_mtx_nrm = gl.getUniformLocation (g_sobj.program, `u_ModelViewIT`);
    g_loc_color   = gl.getUniformLocation (g_sobj.program, `u_color`);
    g_loc_alpha   = gl.getUniformLocation (g_sobj.program, `u_alpha`);

    matrix_proj_perspective (g_matPrj, 72.0, 640/480, 1, 1000);
}

function draw_cube(gl, texid, count)
{
    gl.enable (gl.DEPTH_TEST);

    gl.useProgram (g_sobj.program);

    {
        var matMV     = new Array( 16 );
        var matPMV    = new Array( 16 );
        var matMVI4x4 = new Array( 16 );
        var matMVI3x3 = new Array( 9 );

        matrix_identity (matMV);
        matrix_translate (matMV, 0.0, 0.0, -3.5);
        matrix_rotate (matMV, 30.0 * Math.sin(count*0.01), 1.0, 0.0, 0.0);
        matrix_rotate (matMV, count*1.0, 0.0, 1.0, 0.0);

        matrix_copy (matMVI4x4, matMV);
        matrix_invert   (matMVI4x4);
        matrix_transpose(matMVI4x4);
        matMVI3x3[0] = matMVI4x4[0];
        matMVI3x3[1] = matMVI4x4[1];
        matMVI3x3[2] = matMVI4x4[2];
        matMVI3x3[3] = matMVI4x4[4];
        matMVI3x3[4] = matMVI4x4[5];
        matMVI3x3[5] = matMVI4x4[6];
        matMVI3x3[6] = matMVI4x4[8];
        matMVI3x3[7] = matMVI4x4[9];
        matMVI3x3[8] = matMVI4x4[10];

        matrix_mult (matPMV, g_matPrj, matMV);
        gl.uniformMatrix4fv (g_loc_mtx_mv,   false, matMV );
        gl.uniformMatrix4fv (g_loc_mtx_pmv,  false, matPMV);
        gl.uniformMatrix3fv (g_loc_mtx_nrm,  false, matMVI3x3);
    }

    gl.uniform3f (g_loc_color, 0.5, 0.5, 0.5);
    gl.uniform1f (g_loc_alpha, 0.8);

    gl.activeTexture (gl.TEXTURE0);
    gl.bindTexture (gl.TEXTURE_2D, texid);
    gl.uniform1i (g_sobj.loc_smp, 0);

    gl.enableVertexAttribArray  (g_sobj.loc_vtx);
    gl.enableVertexAttribArray  (g_sobj.loc_uv );
    gl.disableVertexAttribArray (g_sobj.loc_nrm);

    gl.bindBuffer (gl.ARRAY_BUFFER, g_vbo_uv);
    gl.vertexAttribPointer (g_sobj.loc_uv, 2, gl.FLOAT, false, 0, 0);

    gl.enable (gl.BLEND);
    gl.blendFuncSeparate (gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    for (let i = 0; i < 6; i ++)
    {
        gl.bindBuffer (gl.ARRAY_BUFFER, g_vbo_vtx);
        gl.vertexAttribPointer (g_sobj.loc_vtx, 3, gl.FLOAT, false, 0, 4 * 4 * 3 * i);

        var nx = s_nrm[3 * i + 0];
        var ny = s_nrm[3 * i + 1];
        var nz = s_nrm[3 * i + 2];
        gl.vertexAttrib3f (g_sobj.loc_nrm, nx, ny, nz);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    gl.disable (gl.BLEND);
}

function init_stats ()
{
    var stats = new Stats();
    var xPanel = stats.addPanel( new Stats.Panel( 'x', '#ff8', '#221' ) );
    var yPanel = stats.addPanel( new Stats.Panel( 'y', '#f8f', '#212' ) );
    stats.showPanel( 0 );
    document.body.appendChild( stats.dom );

    return stats;
}


/* ---------------------------------------------------------------- *
 *      M A I N    F U N C T I O N
 * ---------------------------------------------------------------- */
function startWebGL()
{
    let debug_log = document.getElementById('debug_log');

    const width  = 640;
    const height = 480;

    /* renderer */
    const renderer = new THREE.WebGLRenderer({
        alpha                : false,
        preserveDrawingBuffer: false,
        antialias            : true,
        canvas               : document.querySelector('#glcanvas')
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.autoClearColor = false;
    const gl = renderer.getContext();

    const scene  = new THREE.Scene();


    /* camera */
    const camera = new THREE.PerspectiveCamera(72.0, width / height, 1.0, 1000.0);
    camera.position.set(0, 300, 300);
    camera.lookAt(0, 0, 0);


    /* light */
    {
        const light = new THREE.AmbientLight(0xFFFFFF, 0.3);
        scene.add(light);
    }
    {
        const light = new THREE.DirectionalLight(0xffffff);
        light.position.set(100, 200, 200);
        scene.add(light);
    }


    /* load FBX */
    let mixer;
    let clock = new THREE.Clock();

    const loader = new THREE.FBXLoader();
    let fbxobj = null;
    loader.load('../assets/fbx/male_BasicWalk_30f.FBX', function (object) {
        object.scale.set(1, 1, 1)
        mixer = new THREE.AnimationMixer(object);

        // Animation Action
        const action = mixer.clipAction(object.animations[0]);
        action.play();

        scene.add(object);
        fbxobj = object;
    });


    init_cube (gl);
    const texid2 = GLUtil.create_image_texture (gl, "../assets/webgl.png");

    r2d.init_2d_render (gl, 640, 480);
    init_dbgstr (gl, 640, 480);
    pmeter.init_pmeter (gl, 640, 480, 480 - 100);

    const stats = init_stats ();


    let rtgt0   = GLUtil.create_render_target(gl, 0, 0, 0);
    let rtarget = GLUtil.create_render_target(gl, 500, 500, 3);

    /* ----------------------- *
     *  main loop
     * ----------------------- */
    let count = 0;
    let prev_time_ms = performance.now();
    render();

    function render()
    {
        pmeter.reset_lap (0);
        pmeter.set_lap (0);

        let cur_time_ms = performance.now();
        let interval_ms = cur_time_ms - prev_time_ms;
        prev_time_ms = cur_time_ms;

        stats.begin();
        debug_log.innerHTML = count;

        gl.clearColor (0.7, 0.7, 1.0, 1.0);
        gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        /* save current FBO */
        GLUtil.get_render_target(gl, rtgt0);
        GLUtil.set_render_target(gl, rtarget);
        {
            gl.clearColor (0.7, 1.0, 0.7, 1.0);
            gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

            /* ------------------------------------------- *
             *  Three.js
             * ------------------------------------------- */
            {
                /* save current FBO before Three.js */
                let rtgt00 = GLUtil.create_render_target(gl, 0, 0, 0);
                GLUtil.get_render_target(gl, rtgt00);

//              camera.aspect = 500.0 / 500.0;
//              renderer.setViewport(0, 0, 500, 500);

                if (mixer)
                {
                    mixer.update(clock.getDelta());
                }
                if (fbxobj)
                {
                    fbxobj.rotation.y += 0.01;
                }
                renderer.render(scene, camera);

                renderer.resetState();

                /* restore FBO after Three.js */
                GLUtil.set_render_target(gl, rtgt00);
                r2d.resize_viewport(gl, rtgt00.width, rtgt00.height);
            }
            r2d.draw_2d_texture (gl, texid2, 0, 0, 500, 500, 0);
        }
        GLUtil.set_render_target(gl, rtgt0);

        /* ------------------------------------------- *
         *  rendering routines outside of Three.js
         * ------------------------------------------- */

        draw_cube (gl, rtarget.texid, count);

        pmeter.draw_pmeter (gl, 0, 40);

        let str = "Interval: " + interval_ms.toFixed(1) + " [ms]";
        dbgstr.draw_dbgstr (gl, str, 10, 10);

        count ++;
        stats.end();
        requestAnimationFrame(render);
    }
}

