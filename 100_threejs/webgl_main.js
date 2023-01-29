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


    /* ----------------------- *
     *  main loop
     * ----------------------- */
    render();

    function render()
    {
        box.rotation.x = THREE.MathUtils.degToRad(30.0);
        box.rotation.y += 0.01;
        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
}

