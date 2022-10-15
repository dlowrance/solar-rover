var cfg = {
	canvas_id: 'canvas',
	cursor_id: 'cursor',
	origin_id: 'origin',
	canvas_diameter: $('body').width() * 0.8,
	cursor_diameter: 60, //pixels
	cursor_origin: null
}
function draw() {
	var canvas = $('#'+cfg.canvas_id);
	var cursor = $('#'+cfg.cursor_id);
	var origin = $('#'+cfg.origin_id);
	var window_height = $('body').height();
	var window_width = $('body').width();
    if (window_width > window_height) {
        cfg.canvas_diameter = window_height * 0.8;
    }
    $('#diameter').html(parseInt(cfg.canvas_diameter));

	canvas.css({width: cfg.canvas_diameter, height: cfg.canvas_diameter});
	cursor
		.css({width: cfg.cursor_diameter, height: cfg.cursor_diameter})
		.offset({
				left: canvas.offset().left + (cfg.canvas_diameter*0.5 - cfg.cursor_diameter*0.5),
				top: canvas.offset().top + (cfg.canvas_diameter*0.5 - cfg.cursor_diameter*0.5)
			});
	//set adjusted origin for view port
	cfg.cursor_origin = {
		x: cursor.offset().left,
		y: cursor.offset().top
	};
	//this is static
	origin
		.css({width: cfg.cursor_diameter*0.25, height: cfg.cursor_diameter*0.25})
		.offset({
			left: canvas.offset().left + canvas.width()*0.5 - cfg.cursor_diameter*0.25/2,
			top: canvas.offset().top + canvas.height()*0.5 - cfg.cursor_diameter*0.25/2
		});
}



var socket = io({
    path: '/ws',
    //these two values help with prolonged periods of no activity but remaining connected
    transports: ['websocket'],
    upgrade: false
});

// STATUS
socket.on('connect', function() {
    status('connected');
});
socket.on('disconnect', function() {
    status('disconnected');
});

var _settings = {
    camera: {},
};

$(document).ready(function() {
	//init
	draw();

    var window_height = $('body').height();
    $('.app-container').css({height: window_height + 'px'});

    var currentMousePos = {x:0, y:0};
    $('#canvas').on('click', function(event) {
        currentMousePos.x = event.pageX;
        currentMousePos.y = event.pageY;
        console.log(currentMousePos);
    });

    $('#camera-feed img').css({'height': ($('body').width() * 0.75) + 'px'}); // 4:3 aspect ratio // was min-height
    //set position after image is loaded
    $('#camera-feed img').one('load', function() {
        $('.dial.abs, .dial.max').css({top: ($('#canvas-container').position().top + $('#canvas').height()/2) + 'px'});
    });

    $('#front-camera').on('click', function() {
        if ($('#front-camera').hasClass('offline') == false) {
            $('#front-camera').attr('src', '/stream?' + Date.now());
        }
    });

    // settings
    $('.toggle-settings').on('click', function() {
        if ($('#settings').hasClass('active')) {
            $('#settings').removeClass('active');
        }
        else {
            $('#settings').addClass('active');
        }

        setSettingsTime();
    });

    $('.option-camera').on('click', function(e) {
        if ($('.option-camera').is(':checked') == true) {
			setState({camera: 'on'});
        }
        else {
            setState({camera: 'off'});
        }
    });

    $('.option-status .form-check').on('click', function() {
        socket.emit('get', 'uptime');
		
		$('#uptime span').css({opacity: 0});
		setTimeout(function() {
			$('#uptime span').removeAttr('style');
		}, 100);
    });

    $('.restart').on('click', function() {
        if ($('.restart').hasClass('active')) {
            if (confirm('Are you sure you want to restart?')) {
                $('.option-restart .form-check').html('<label class="form-check-label inline-block text-gray-800" style="text-align: center">RESTARTING...</label>');
                socket.emit('RESTART');
            }
            else {
                resetRestart();
            }
        }
    });

    //setup before functions
    var typingTimer;
    var doneTypingInterval = 1000;
    var $input = $('.option-restart');
    var clicksToUnlock = 5;

    //on keyup, start the countdown
    $input.on('mouseup', function () {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(doneTyping, doneTypingInterval);
    });

    //on keydown, clear the countdown
    $input.on('mousedown', function () {
        clearTimeout(typingTimer);
        $('#clicksToUnlock').html('(Tap again ' + clicksToUnlock + ')');
        if (clicksToUnlock <= 0) {
            $('#clicksToUnlock').html('');
            $input.addClass('slide-to-unlock');

            setTimeout(function() {
                resetRestart();
            }, 7500);
        }
        clicksToUnlock--;
    });

    //user is "finished typing," do something
    function doneTyping () {
      //do something
      console.log('reset clicks');
      clicksToUnlock = 5;
      $('#clicksToUnlock').html('');
    }

    $('.option-restart').on('click', function() {
        console.log('clicked');
    });

});


// set settings - from server
socket.on('setSettings-server', function(settings) {
    _settings = settings;
    setState(_settings);
});
function setState(newSetting) {
    setSettingsTime();

	// update global state object (_settings);
	var change = 0;
    for (const [key, value] of Object.entries(newSetting)) {
        if (key in _settings == false) {
            _settings[key] = value;
            console.log(`{ ${key}: ${value} } - added`);
            change++;
        }
        else {
            if (_settings[key] != newSetting[key]) {
                _settings[key] = newSetting[key];
                console.log(`{ ${key}: ${value} } - updated`);
                change++;
            }
        }
    }

    if (_settings === 0 || _settings === undefined) return {};

    if (_settings.camera == 'on') {
        $('.option-camera').attr('checked', true);
        $('#front-camera').removeClass('offline');
    }
    else {
        $('.option-camera').attr('checked', false);
        $('#front-camera').addClass('offline').attr('src', 'img/onerr.png?' + Date.now());
    }

    if ('uptime' in _settings) {
        $('#uptime span').html(_settings.uptime);
    }

	//if ('lines' in settings && settings.lines !== true) { // this also works as expected - wtf?
	if ('lines' in _settings && _settings.lines === true) { // this one makes sense to me - but above works too?
		$('.lines').addClass('active');
		$('.option-lines').attr('checked', true);
	}
	else {
		$('.lines').removeClass('active');
		$('.option-lines').attr('checked', false);
	}

	if (change > 0) {
		//console.log('Changes! emit and update');
		socket.emit('setSettings-client', newSetting);
	}
	else {
		//console.log('avoided traffic - hooray');
	}

	return _settings;
}


$(function() {
    var x_coord = 0;
    var y_coord = 0;
    $('#' + cfg.cursor_id).draggable({
        start: function() {
            //$('.hidden').addClass('show').removeClass('hidden');
            $('.dial').css({
                opacity: 1
            });
        },
        drag: function(e, ui) {
            var r = cfg.canvas_diameter * 0.5,
                small_r = cfg.cursor_diameter * 0.5,
                origin_x = r - small_r,
                origin_y = r - small_r,
                x = ui.position.left - origin_x,
                y = ui.position.top - origin_y,
                l = Math.sqrt(x * x + y * y),
                l_in = Math.min(r - small_r, l),
                left = parseInt(x / l * l_in + origin_x),
                top = parseInt(y / l * l_in + origin_y);

            ui.position = {
                left: left,
                top: top
            };
            //coords upper left
            x_coord = parseInt(left - (parseInt(cfg.canvas_diameter) / 2 - cfg.cursor_diameter / 2));
            y_coord = -parseInt(top - (parseInt(cfg.canvas_diameter) / 2 - cfg.cursor_diameter / 2));



            var radius = parseInt((cfg.canvas_diameter / 2) - (cfg.cursor_diameter / 2));
            var decimal = {x:0, y:0};
            decimal.x = x_coord / radius;
            decimal.y = y_coord / radius;

            $('#posX').text(parseInt(decimal.x * 100)  + '%');
            $('#posY').text(parseInt(decimal.y * 100) + '%');

            var theta = Math.atan(y_coord / x_coord) * 180 / Math.PI;
            if (x_coord >= 0 && y_coord >= 0) {
                theta = theta
            } else if (x_coord < 0 && y_coord) {
                theta = 180 - Math.atan(y_coord / -x_coord) * 180 / Math.PI;
                if (theta == 270) theta = 90;
            } else if (y_coord <= 0 && x_coord < 0) {
                if (theta == 0) theta = 180;
            } else if (y_coord < 0 && x_coord >= 0) {
                theta = 360 + theta;
            } else {
                //nothing
            }


            var direction = Math.cos(theta * Math.PI / 180) * 100;
            var power_direction = (decimal.y >= 0) ? 1 : -1;
            var power = power_direction * parseInt(Math.sqrt(decimal.x * decimal.x + decimal.y * decimal.y) * 100);

            //console.log(direction);

            // Drive the rover!
            driveRover({
                direction: direction,
                power: power
            });



            $('.dial').css({
                transform: 'rotate(-' + theta + 'deg)'
            });
        },
        stop: function() {
            //$('.show').addClass('hidden').removeClass('show');
            $('.dial').css({
                opacity: 0
            });

            driveRover({
                direction: 0,
                power: 0
            });
        },
        revert: true,
        revertDuration: 100
    });

    var dial = $('.dial');
    var dialMax = $('.dial.max');
    setInterval(function() {
        dial.css({
            width: (cfg.canvas_diameter / 2) + Math.sqrt((Math.pow(x_coord, 2) + Math.pow(y_coord, 2)))
        });
        dialMax.css({
            width: cfg.canvas_diameter - cfg.cursor_diameter * 0.5
        });
    }, 100);


});
$(window).resize(function() {
	draw();
});


/*
 *      Drive the rover
 */
driveCmd = {d: 0, p: 0};
function driveRover(input) {
    $('#direction').html('Direction: ' + parseInt(input.direction)  + '% Power: ' + input.power + '%');

    if (driveCmd.d != input.direction || driveCmd.p != input.power) {
        driveCmd.d = input.direction;
        driveCmd.p = input.power;
        socket.emit('drive', {
            d: input.direction,
            p: input.power
        });
    }
    else {
        //cuts down on traffic by not sending the same input twice
        //console.log('ignore', input);
    }
}




/**
 *      Utility functions
 */
function status(status) {
    if (status == 'connected') {
        $('#origin')
            .addClass('active')
            .removeClass('inactive');
    }
    else {
        $('#origin')
            .addClass('inactive')
            .removeClass('active');
    }
}

function setSettingsTime() {
    var time = new Date().toLocaleString('en-GB', {hour12: false, hourCycle: 'h23'}).split(',')[1].trim();
    $('#current-time').html('').html(time.substring(0, time.length - 3));
}


var inputRange = document.getElementsByClassName('pullee')[0],
maxValue = 150, // the higher the smoother when dragging
speed = 12, // thanks to @pixelass for this
currValue, rafID;

// set min/max value
inputRange.min = 0;
inputRange.max = maxValue;

// listen for unlock
function unlockStartHandler() {
    // clear raf if trying again
    window.cancelAnimationFrame(rafID);

    // set to desired value
    currValue = +this.value;
}

function unlockEndHandler() {

    // store current value
    currValue = +this.value;

    // determine if we have reached success or not
    if(currValue >= maxValue) {
        successHandler();
    }
    else {
        rafID = window.requestAnimationFrame(animateHandler);
    }
}

// handle range animation
function animateHandler() {

    // update input range
    inputRange.value = currValue;

    // determine if we need to continue
    if(currValue > -1) {
        window.requestAnimationFrame(animateHandler);
    }

    // decrement value
    currValue = currValue - speed;
}

// handle successful unlock
function successHandler() {
    $('.restart').addClass('active');
};

function resetRestart() {
    $('.restart').removeClass('active');
    $('.pullee').val(0);
    $('.option-restart').removeClass('slide-to-unlock');
}

$(document).ready(function() {
    // bind events
    inputRange.addEventListener('mousedown', unlockStartHandler, false);
    inputRange.addEventListener('mousestart', unlockStartHandler, false);
    inputRange.addEventListener('mouseup', unlockEndHandler, false);
    inputRange.addEventListener('touchend', unlockEndHandler, false);
});
