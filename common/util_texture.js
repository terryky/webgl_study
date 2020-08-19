/* ------------------------------------------------ *
 * The MIT License (MIT)
 * Copyright (c) 2020 terryky1220@gmail.com
 * ------------------------------------------------ */


GLUtil.create_texture = function (gl)
{
    let texid = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texid);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return texid;
}


/* ---------------------------------------------------------------- *
 *  Create Image Texture
 * ---------------------------------------------------------------- */
GLUtil.create_image_texture = function (gl, url)
{
    let texid = GLUtil.create_texture (gl);
    let teximage = new Image();

    teximage.onload = function ()
    {
        gl.bindTexture(gl.TEXTURE_2D, texid);
        gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, teximage);
    }
    teximage.src = url;

    return texid;
}


/* ---------------------------------------------------------------- *
 *  Create Video Texture
 * ---------------------------------------------------------------- */
GLUtil.create_video_texture = function (gl, url)
{
    let video_tex = {};
    video_tex.ready = false;
    video_tex.texid = GLUtil.create_texture (gl);

    let video = document.createElement('video');
    video.autoplay = true;
    video.muted    = true;
    video.loop     = true;

    let playing    = false;
    let timeupdate = false;

    // Waiting for these 2 events ensures there is data in the video
    video.addEventListener('playing',    function(){playing    = true; checkReady();}, true);
    video.addEventListener('timeupdate', function(){timeupdate = true; checkReady();}, true);

    video.src = url;
    video.play();

    function checkReady()
    {
        if (playing && timeupdate)
        {
            video_tex.ready = true;
        }
    }

    video_tex.video = video;
    return video_tex;
}

GLUtil.is_video_ready = function (video_tex)
{
    return video_tex.ready;
}

GLUtil.update_video_texture = function (gl, video_tex)
{
    if (video_tex.ready)
    {
        gl.bindTexture(gl.TEXTURE_2D, video_tex.texid);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video_tex.video);
    }
}


/* ---------------------------------------------------------------- *
 *  Create Web Camera Texture
 * ---------------------------------------------------------------- */
GLUtil.create_camera_texture = function (gl)
{
    let camera_tex = {};
    camera_tex.ready = false;
    camera_tex.texid = GLUtil.create_texture (gl);

    let video = document.createElement('video');
    video.autoplay = true;
    video.loop     = true;

    navigator.mediaDevices = navigator.mediaDevices ||
                             navigator.mozGetUserMedia
                             navigator.webkitGetUserMedia;
    if (!navigator.mediaDevices)
    {
        alert('not supported navigator.mediaDevices');
        return camera_tex;
    }

    function on_camera_ready (stream)
    {
        function on_camera_metadata_loaded()
        {
            camera_tex.ready = true;
        }
        video.onloadedmetadata = on_camera_metadata_loaded;
        video.srcObject        = stream;
        video.play();
    }

    function on_camera_failed (err)
    {
        alert('failed to initialize a camera');
        return camera_tex;
    }

    const constraints = {
        audio : false,
        video : true
    };

    const promise = navigator.mediaDevices.getUserMedia (constraints);
    promise.then (on_camera_ready)
           .catch(on_camera_failed);

    camera_tex.video = video;
    return camera_tex;
}


GLUtil.is_camera_ready = function (camera_tex)
{
    return camera_tex.ready;
}

GLUtil.update_camera_texture = function (gl, camera_tex)
{
    if (camera_tex.ready)
    {
        gl.bindTexture(gl.TEXTURE_2D, camera_tex.texid);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, camera_tex.video);
    }
}

