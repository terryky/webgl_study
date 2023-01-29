/* ---------------------------------------------------------------- *
 *      M A I N    F U N C T I O N
 * ---------------------------------------------------------------- */
function startWebGL()
{
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
        gl.clear (gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        r2d.draw_2d_texture (gl, texid, width * 0.1, height * 0.1, width * 0.8, height * 0.8, 0);

        /* ------------------------------------------- *
         *  Three.js
         * ------------------------------------------- */
        if (mixer)
        {
            mixer.update(clock.getDelta());
        }
        if (fbxobj)
        {
            fbxobj.rotation.y += 0.01;
        }
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

