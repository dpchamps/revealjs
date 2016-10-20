/*! revealjs - v0.1.0 - 2016-10-20
* http://www.youtube.com/watch?v=cDuG95DXbw8
* Copyright (c) 2016 Obi-Wan Kenobi; Licensed  */
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
    /**
     * https://gist.github.com/cferdinandi/4f8a0e17921c5b46e6c4
     * Merge defaults with user options
     * @private
     * @param {Object} defaults Default settings
     * @param {Object} options User options
     * @returns {Object} Merged values of defaults and options
     */
    var requestAnimationFrame = window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame;


    var cancelAnimationFrame = window.cancelAnimationFrame          ||
        window.webkitCancelRequestAnimationFrame    ||
        window.mozCancelRequestAnimationFrame       ||
        window.oCancelRequestAnimationFrame         ||
        window.msCancelRequestAnimationFrame;

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
            imageClone,
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

        imageClone = imageNode.cloneNode(true);
        canvasLayerVisible = createCanvasObject();
        canvasLayerImage   = createCanvasObject();
        canvasLayerVideo   = createCanvasObject();
        setCanvasStyle(canvasLayerVisible.canvas);
        parent.appendChild(canvasLayerVisible.canvas);

        var animationFrameId;
        var render = function () {
            if (typeof options.videoCutoff === 'undefined') {
                options.videoCutoff = videoNode.duration - 0.50;
            }
            if (videoNode.paused || videoNode.ended || videoNode.currentTime >= options.videoCutoff) {
                cancelAnimationFrame(animationFrameId);
                options.videoCallback(imageNode, canvasLayerVisible);
                return false;
            }
            canvasLayerVideo.context.clearRect(0, 0, canvasLayerVideo.width, canvasLayerVideo.height);
            canvasLayerVideo.context.drawImage(videoNode, canvasLayerVideo.x.start, canvasLayerVideo.y.start, canvasLayerVideo.x.end, canvasLayerVideo.y.end);
            if (options.transparent) {
                canvasLayerImage.context.fillStyle = options.transparentColor;
                canvasLayerImage.context.fillRect(0, 0, width, height);
            }
            canvasLayerImage.context.drawImage(imageClone, canvasLayerImage.x.start, canvasLayerImage.y.start, canvasLayerImage.x.end, canvasLayerImage.y.end);
            var videoIdata = canvasLayerVideo.context.getImageData(0, 0, width, height),
                videoData  = videoIdata.data,
                imageIdata = canvasLayerImage.context.getImageData(0, 0, width, height),
                imageData  = imageIdata.data;
            for (var i = 0; i < videoData.length; i += 4) {
                var r = videoData[i],
                    g = videoData[i + 1],
                    b = videoData[i + 2];

                imageData[i + 3] = colorToAlpha(r, g, b);
                if (options.transparent) {
                    var pixelRGB = "rgb(" + imageData[i] + "," + imageData[i + 1] + "," + imageData[i + 2] + ")";
                    if (pixelRGB === options.transparentColor) {
                        imageData[i + 3] = 0;
                    }
                }

            }
            imageIdata.data.set(imageData);
            canvasLayerImage.context.putImageData(imageIdata, 0, 0);
            canvasLayerVisible.context.clearRect(0, 0, width, height);
            canvasLayerVisible.context.drawImage(canvasLayerImage.canvas, 0, 0);
            requestAnimationFrame(render);
        };
        var initialize = function () {

            /*
             * Get width and Height of parent element, which is the container for the canvas
             */
            parentBox = parent.getBoundingClientRect();
            var imageBox = imageNode.getBoundingClientRect();
            width = parentBox.width;
            height = parentBox.height;
            console.log(imageBox);

            canvasLayerVisible.canvas.width = width;
            canvasLayerVisible.canvas.height = height;

            canvasLayerImage.canvas.width = imageNode.width;
            canvasLayerImage.canvas.height = imageNode.height;

            canvasLayerVideo.canvas.width = imageNode.width * 1;
            canvasLayerVideo.canvas.height = imageNode.height * 1;

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
            canvasLayerImage.setX(imageBox.left, imageBox.right);
            canvasLayerImage.setY(imageBox.top, imageBox.height);

            if (options.autoPlay) {
                setTimeout(function () {
                    play();
                }, options.timeout);
            }
        };

        var colorToAlpha = function (r, g, b) {
            //convert to luminosity greyscale
            return Math.round((0.21 * r) + (0.72 * g) + (0.07 * b));
        };
        var play = function () {
            if (videoNode.paused || videoNode.ended) {
                videoNode.currentTime = 0;
                videoNode.play();
            }
        };
        videoNode.addEventListener('play', function () {
            requestAnimationFrame(render);
        });
        if (!imageClone.complete) {
            imageClone.addEventListener('load', function () {
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
