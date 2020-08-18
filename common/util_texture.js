/* ------------------------------------------------ *
 * The MIT License (MIT)
 * Copyright (c) 2020 terryky1220@gmail.com
 * ------------------------------------------------ */
GLUtil.video_ready  = false;
GLUtil.camera_ready = false;

/* ---------------------------------------------------------------- *
 *  Initialize Image Texture
 * ---------------------------------------------------------------- */
GLUtil.load_image_texture = function (gl, url)
{
    let texid = gl.createTexture();
    let teximage = new Image();

    teximage.onload = function ()
    {
        gl.bindTexture(gl.TEXTURE_2D, texid);
        gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, teximage);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    teximage.src = url;

    return texid;
}


/* ---------------------------------------------------------------- *
 *  Initialize Video Texture
 * ---------------------------------------------------------------- */
GLUtil.load_video = function (url)
{
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted    = true;
    video.loop     = true;

    var playing    = false;
    var timeupdate = false;

    // Waiting for these 2 events ensures there is data in the video
    video.addEventListener('playing',    function(){playing    = true; checkReady();}, true);
    video.addEventListener('timeupdate', function(){timeupdate = true; checkReady();}, true);

    video.src = url;
    video.play();

    function checkReady() 
    {
        if (playing && timeupdate)
        {
            GLUtil.video_ready = true;
        }
    }

    return video;
}

GLUtil.is_video_ready = function ()
{
    return GLUtil.video_ready;
}

GLUtil.update_video_texture = function (gl, texid, video)
{
    gl.bindTexture(gl.TEXTURE_2D, texid);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
}


/* ---------------------------------------------------------------- *
 *  Initialize Web Camera Texture
 * ---------------------------------------------------------------- */
GLUtil.init_camera = function ()
{
    var camera = document.createElement('video');
    camera.autoplay = true;
    camera.loop     = true;

    navigator.getUserMedia = navigator.getUserMedia ||
                             navigator.webkitGetUserMedia ||
                             navigator.mozGetUserMedia;
    if (!navigator.getUserMedia)
    {
        alert('not supported getUserMedia');
    }

    function on_camera_ready (stream)
    {
        function on_camera_metadata_loaded()
        {
            GLUtil.camera_ready = true;
        }
        camera.onloadedmetadata = on_camera_metadata_loaded;
        camera.srcObject        = stream;
    }

    function on_camera_failed (err)
    {
        alert('failed to initialize a camera');
    }

    navigator.getUserMedia(
        {
            video: true,
            audio: false
        },
        on_camera_ready,
        on_camera_failed
    );

    return camera;
}


GLUtil.is_camera_ready = function ()
{
    return GLUtil.camera_ready;
}

GLUtil.update_camera_texture = function (gl, texid, camera)
{
    gl.bindTexture(gl.TEXTURE_2D, texid);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, camera);
}

