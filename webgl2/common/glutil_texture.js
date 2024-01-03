export let Texture = {};


Texture.create_texture = function (gl)
{
    let texid = gl.createTexture();

    gl.bindTexture(gl.TEXTURE_2D, texid);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    return texid;
}

Texture.delete_texture = function (gl, texid)
{
    gl.deleteTexture(texid);
}

/* ---------------------------------------------------------------- *
 *  Create Image Texture
 * ---------------------------------------------------------------- */
Texture.create_image_texture = function (gl, url)
{
    let texid = Texture.create_texture (gl);
    let teximage = new Image();
    teximage.crossOrigin = "Anonymous";

    teximage.onload = function ()
    {
        gl.bindTexture(gl.TEXTURE_2D, texid);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, teximage);
        gl.generateMipmap (gl.TEXTURE_2D);
    }
    teximage.src = url;

    return texid;
}

Texture.create_image_texture_from_file = function (gl, url)
{
    let texid = Texture.create_texture (gl);
    let teximage = new Image();
    let reader = new FileReader();

    teximage.onload = function ()
    {
        gl.bindTexture(gl.TEXTURE_2D, texid);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D (gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, teximage);
        gl.generateMipmap (gl.TEXTURE_2D);
    }

    reader.onload = function (event)
    {
        let src = event.target.result;
        teximage.src = src;
    }
    reader.readAsDataURL(url);

    return texid;
}


/* ---------------------------------------------------------------- *
 *  Create Video Texture
 * ---------------------------------------------------------------- */
Texture.create_video_texture = function (gl, url)
{
    let video_tex = {};
    video_tex.ready = false;
    video_tex.texid = Texture.create_texture (gl);

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

Texture.get_video_resolution = function (video_tex)
{
    let width  = 0;
    let height = 0;
    if (video_tex.ready)
    {
        width  = video_tex.video.videoWidth;
        height = video_tex.video.videoHeight;
    }
    return {
        w: width,
        h: height,
    };
}

Texture.is_video_ready = function (video_tex)
{
    return video_tex.ready;
}

Texture.update_video_texture = function (gl, video_tex)
{
    if (video_tex.ready)
    {
        gl.bindTexture(gl.TEXTURE_2D, video_tex.texid);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video_tex.video);
    }
}


/* ---------------------------------------------------------------- *
 *  Create Web Camera Texture
 * ---------------------------------------------------------------- */
Texture.create_camera_texture = function (gl)
{
    let camera_tex = {};
    camera_tex.ready = false;
    camera_tex.texid = Texture.create_texture (gl);

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
        video: {
            width:  {ideal: 640},
            height: {ideal: 480}
        }
    };

    const promise = navigator.mediaDevices.getUserMedia (constraints);
    promise.then (on_camera_ready)
           .catch(on_camera_failed);

    camera_tex.video = video;
    return camera_tex;
}

Texture.get_camera_resolution = function (camera_tex)
{
    let width  = 0;
    let height = 0;
    if (camera_tex.ready)
    {
        width  = camera_tex.video.videoWidth;
        height = camera_tex.video.videoHeight;
    }
    return {
        w: width,
        h: height,
    };
}

Texture.is_camera_ready = function (camera_tex)
{
    return camera_tex.ready;
}

Texture.update_camera_texture = function (gl, camera_tex)
{
    if (camera_tex.ready)
    {
        gl.bindTexture(gl.TEXTURE_2D, camera_tex.texid);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, camera_tex.video);
    }
}

