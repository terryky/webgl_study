/* ---------------------------------------------------------------- *
 *      M A I N    F U N C T I O N
 * ---------------------------------------------------------------- */
function startWebGL()
{
    const width  = 640;
    const height = 480;

    /* renderer */
    const renderer = new THREE.WebGLRenderer({
        alpha : false,
        preserveDrawingBuffer: false,
        canvas: document.querySelector('#glcanvas')
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.autoClearColor = false;
    const gl = renderer.getContext();

    const scene  = new THREE.Scene();


    /* camera */
    const camera = new THREE.PerspectiveCamera(72.0, width / height, 1.0, 1000.0);
    camera.position.set(0, 0, 3.5);


    /* light */
    const light = new THREE.PointLight(0xffffff);
    light.position.set(5, 1, 5);
    scene.add(light);


    /* geometry */
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const box = new THREE.Mesh(geometry, material);
    scene.add(box);


    r2d.init_2d_render (gl, 640, 480);
    init_dbgstr (gl, 640, 480);
    pmeter.init_pmeter (gl, 640, 480, 480 - 100);

    const texid  = GLUtil.create_image_texture (gl, "../assets/uv_checker.png");
    const texid2 = GLUtil.create_image_texture (gl, "../assets/webgl.png");


    /* ----------------------- *
     *  main loop
     * ----------------------- */
    let prev_time_ms = performance.now();
    render();

    function render()
    {
        pmeter.reset_lap (0);
        pmeter.set_lap (0);

        let cur_time_ms = performance.now();
        let interval_ms = cur_time_ms - prev_time_ms;
        prev_time_ms = cur_time_ms;

        gl.clearColor (0.7, 0.7, 1.0, 1.0);
        gl.clear (gl.COLOR_BUFFER_BIT);

        r2d.draw_2d_texture (gl, texid, width * 0.1, height * 0.1, width * 0.8, height * 0.8, 0);

        /* ------------------------------------------- *
         *  Three.js
         * ------------------------------------------- */
        box.rotation.x = THREE.MathUtils.degToRad(30.0);
        box.rotation.y += 0.01;
        renderer.render(scene, camera);

        /* ------------------------------------------- *
         *  rendering routines outside of Three.js
         * ------------------------------------------- */
        renderer.resetState();

        r2d.draw_2d_texture (gl, texid2, 0, 0, 960 * 0.2, 540 * 0.2, 0);
        pmeter.draw_pmeter (gl, 0, 40);

        let str = "Interval: " + interval_ms.toFixed(1) + " [ms]";
        dbgstr.draw_dbgstr (gl, str, 10, 10);

        requestAnimationFrame(render);
    }
}

