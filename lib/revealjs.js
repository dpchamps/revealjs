// Uses AMD or browser globals to create a module.

// Grabbed from https://github.com/umdjs/umd/blob/master/amdWeb.js.
// Check out https://github.com/umdjs/umd for more patterns.

// Defines a module "revealjs".
// Note that the name of the module is implied by the file name. It is best
// if the file name and the exported global have matching names.

// If you do not want to support the browser global path, then you
// can remove the `root` use and the passing `this` as the first arg to
// the top function.

(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else {
        // Browser globals
        root.revealjs = factory();
    }
}(this, function () {
    'use strict';


    var lastTime = 0;
    var vendors = ['webkit', 'moz'];
    for (var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
        window.cancelAnimationFrame =
            window[vendors[x] + 'CancelAnimationFrame'] || window[vendors[x] + 'CancelRequestAnimationFrame'];
    }

    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function (callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function () {
                    callback(currTime + timeToCall);
                },
                timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
    }
    if (!window.cancelAnimationFrame) {
        window.cancelAnimationFrame = function (id) {
            clearTimeout(id);
        };
    }
    /**
     * https://gist.github.com/cferdinandi/4f8a0e17921c5b46e6c4
     * Merge defaults with user options
     * @private
     * @param {Object} defaults Default settings
     * @param {Object} options User options
     * @returns {Object} Merged values of defaults and options
     */



    var extend = function (defaults, options) {
        var extended = {};
        var prop;
        for (prop in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
                extended[prop] = defaults[prop];
            }
        }
        for (prop in options) {
            if (Object.prototype.hasOwnProperty.call(options, prop)) {
                extended[prop] = options[prop];
            }
        }
        return extended;
    };
    var firstChildByTag = function (node, tagName) {
        return node.getElementsByTagName(tagName)[0];
    };
    var createCanvasObject = function (width, height) {
        var canvas = document.createElement('canvas'),
            context = canvas.getContext('2d');

        if (width && height) {
            canvas.width = width;
            canvas.height = height;
        }

        return {
            canvas  : canvas,
            context : context,
            width   : width,
            height  : height,
            x       :
            {
                start : undefined,
                end   : undefined
            },
            y       :
            {
                start : undefined,
                end   : undefined
            },
            setX : function (start, end) {
                this.x.start = start;
                this.x.end = end;
            },
            setY : function (start, end) {
                this.y.start = start;
                this.y.end = end;
            }
        };
    };
    var setImageStyle = function (image) {
        image.style.visibility = 'hidden';
        image.style.top = '0';
        image.style.left = '0';
        image.style.display = 'block';
        image.style.opacity = '0';
        image.style.transition = 'opacity 750ms ease-in 250ms';
    };
    var setCanvasStyle = function (canvas) {
        canvas.style.position = 'absolute';
        canvas.style.zIndex = '10';
        canvas.style.top = '0';
        canvas.style.left = '0';
    };
    var defaults = {
        autoPlay : true,
        timeout : 250,
        videoSrc: undefined,
        imageSrc: undefined,
        crossOrigin: false,
        videoPlaybackRate: 1,
        videoCutoff: undefined,
        videoScale: 1,
        transparentColor : "rgb(250,250,250)",
        transparent : false,
        videoCallback : function (image, canvasObject) {
            image.style.visibility = 'visible';
            image.style.opacity = '1';
            image.addEventListener('transitionend', function () {
                canvasObject.context.clearRect(0, 0, canvasObject.canvas.width, canvasObject.canvas.height);

            });
        }
    };
    function revealjs(parent, options) {
        if (typeof parent === 'undefined') {
            throw new Error("RevealJS needs a parent container to bind to.");
        }

        var
            videoNode,
            imageNode,
            canvasLayerVisible,
            canvasLayerImage,
            canvasLayerVideo,
            parentBox,
            width,
            height;


        options = extend(defaults, options);

        if (typeof parent === 'string') {
            parent = document.getElementById(parent);
        }
        /*
         *  Set the video node internally.
         *
         *  A video tag is required to be defined within the parent.
         *  The video source will be overidden if options.src is supplied
         */

        videoNode = firstChildByTag(parent, 'video');
        if (!videoNode) {
            throw new Error('Video node must appear in parent container.');
        }
        videoNode.style.display = 'none';
        if (!options.videoSrc && !firstChildByTag(videoNode, 'source')) {
            throw new Error("Video node has no source.");
        }
        if (options.videoSrc) {
            var sourceArray = [].slice.call(videoNode.getElementsByTagName('source'));
            sourceArray.forEach(function (node) {
                node.remove();
            });
            videoNode.src = options.videoSrc;
        }
        if (options.videoPlaybackRate) {
            videoNode.playbackRate = options.videoPlaybackRate;
        }
        /*
         * Set the image node
         */
        imageNode = firstChildByTag(parent, 'img');
        if (!imageNode) {
            throw new Error('Image node must appear in parent container.');
        }
        setImageStyle(imageNode);
        if (options.imageSrc) {
            imageNode.src = options.imageSrc;
        }



        /*
         * If loading an image/video from a cdn, anticipate Access-Control-Allow-Origin : *
         *
         * This could be more intuitive, for specific CDN's, we could do a xmlhttp request for the image and the video
         * and check to see what the Access-Control-Allow-Origin is set to.
         *
         * Then, RevealJS could issue a warning if the header value is unexpected.
         *
         * Actually, we'd probably need to throw an error because cross origin request without the appropriate headers
         * will prevent canvas from reading the resource data / write the data to the canvas I can't remember off of
         * the top of my head
         *
          * For now though, just set to anonymous and expect everything to be magical.
         */
        if (options.crossOrigin) {
            videoNode.crossOrigin = 'anonymous';
            imageNode.crossOrigin = 'anonymous';
        }


        canvasLayerVisible = createCanvasObject();
        canvasLayerImage   = createCanvasObject();
        canvasLayerVideo   = createCanvasObject();
        setCanvasStyle(canvasLayerVisible.canvas);
        parent.appendChild(canvasLayerVisible.canvas);

        var animationFrameId;
        var rgbTransArray = options.transparentColor.split(/[\(\)]+/)[1].split(',').map(Number);

        var drawImage = function () {
            if (options.transparent) {
                canvasLayerImage.context.fillStyle = options.transparentColor;
                canvasLayerImage.context.fillRect(0, 0, width, height);
            }
            canvasLayerImage.context.drawImage(imageNode, canvasLayerImage.x.start, canvasLayerImage.y.start, canvasLayerImage.x.end, canvasLayerImage.y.end);
        };

        var render = function () {
            canvasLayerVideo.context.drawImage(videoNode, canvasLayerVideo.x.start, canvasLayerVideo.y.start, canvasLayerVideo.x.end, canvasLayerVideo.y.end);
            drawImage();

            var videoIdata = canvasLayerVideo.context.getImageData(0, 0, width, height),
                videoData  = videoIdata.data,
                imageIdata = canvasLayerImage.context.getImageData(0, 0, width, height),
                imageData  = imageIdata.data;

            for (var i = 0, len = videoData.length; i < len; i += 4) {
                var r = videoData[i],
                    g = videoData[i + 1],
                    b = videoData[i + 2];

                imageData[i + 3] = colorToAlpha(r, g, b);
                if (options.transparent) {
                    if (imageData[i] === rgbTransArray[0] &&
                        imageData[i + 1] === rgbTransArray[1] &&
                        imageData[i + 2] === rgbTransArray[2]) {
                        imageData[i + 3] = 0;
                    }
                }
            }
            canvasLayerImage.context.putImageData(imageIdata, 0, 0);
            canvasLayerVisible.context.clearRect(0, 0, width, height);
            canvasLayerVisible.context.drawImage(canvasLayerImage.canvas, 0, 0);
        };
        var initialize = function () {
            /*
             * Get width and Height of parent element, which is the container for the canvas
             */
            parentBox = parent.getBoundingClientRect();
            var imageBox = imageNode.getBoundingClientRect();
            width = parentBox.width;
            height = parentBox.height;


            canvasLayerVisible.canvas.width = imageBox.width;
            canvasLayerVisible.canvas.height = imageBox.height;

            canvasLayerImage.canvas.width = imageNode.width;
            canvasLayerImage.canvas.height = imageNode.height;

            canvasLayerVideo.canvas.width = imageBox.width * options.videoScale;
            canvasLayerVideo.canvas.height = imageBox.height * options.videoScale;

            var
                videoPosX = {
                    start: (-(canvasLayerVideo.canvas.width / 2)) + imageBox.width / 2,
                    end  : canvasLayerVideo.canvas.width
                },
                videoPosY = {
                    start: (-(canvasLayerVideo.canvas.height / 2)) + imageBox.height / 2,
                    end :   canvasLayerVideo.canvas.height
                };


            canvasLayerVideo.setX(videoPosX.start, videoPosX.end);
            canvasLayerVideo.setY(videoPosY.start, videoPosY.end);
            canvasLayerImage.setX(0, imageBox.width);
            canvasLayerImage.setY(0, imageBox.height);
            if (!videoNode.paused && !videoNode.ended) {
                animationLoop();
            }
            setTimeout(function () {
                if (videoNode.paused) {
                    play();
                }
            }, options.timeout);
        };

        var colorToAlpha = function (r, g, b) {
            return (3 * r + 4 * g + b) >>> 3;
        };
        var play = function () {
            if (videoNode.paused || videoNode.ended) {
                videoNode.currentTime = 0;
                videoNode.play();
            }
        };
        var videoPlayListener = function () {
            if (typeof options.videoCutoff === 'undefined') {
                options.videoCutoff = videoNode.duration - 0.50;
            }
            if (!animationFrameId) {
                animationLoop();
            }
            videoNode.removeEventListener('play', videoPlayListener);
        };
        var videoCanPlayListener = function () {
            setTimeout(function () {
                if (videoNode.paused || videoNode.ended) {
                    play();
                }
                videoNode.removeEventListener('canplay', videoCanPlayListener);
            }, options.timeout);
        };
        videoNode.addEventListener('play', videoPlayListener);
        videoNode.addEventListener('canplay', videoCanPlayListener);
        function animationLoop() {
            if (videoNode.paused || videoNode.ended || videoNode.currentTime >= options.videoCutoff) {
                cancelAnimationFrame(animationFrameId);
                options.videoCallback(imageNode, canvasLayerVisible);
                return false;
            } else {
                render();
                animationFrameId = requestAnimationFrame(animationLoop);
            }
        }

        if (!imageNode.complete) {
            imageNode.addEventListener('load', function () {
                initialize();
            });
        } else {
            initialize();
        }

        return play;
    }

    // Return a value to define the module export.
    // This example returns a functions, but the module
    // can return an object as the exported value.
    return revealjs;
}));
