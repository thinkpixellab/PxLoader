$(document).ready(function() {

    $('#sample5-run').click(function() {
        var loader = new PxLoader(),
            fatface = loader.addFont('Abril Fatface'),
            arvil = loader.addFont('ArvilSansRegular'),
            outage = loader.addFont('OutageRegular'),
            wisdom = loader.addFont('WisdomScriptAIRegular'),
            i, len, url;

        // callback that will be run once all fonts are ready
        loader.addCompletionListener(function() {
            var canvas = document.getElementById('sample5-canvas'),
                ctx = canvas.getContext('2d'),

                // helper to draw text
                drawText = function(px, font, x, y, text) {
                    ctx.font = px + 'px ' + font.fontFamily;
                    ctx.fillText(text, x, y);
                };

            // solid color background
            ctx.fillStyle = '#FEC759';
            ctx.fillRect(0,0, canvas.width, canvas.height);

            // all text is black
            ctx.fillStyle = 'black';

            // draw our quote
            drawText(94, fatface, 125, 115, 'Here’s to');
            drawText(94, fatface, 43, 170, 'the crazy ones');
            drawText(38, arvil, 50, 230, 'the misfits, the rebels, the troublemakers, the round pegs');
            drawText(38, arvil, 60, 270, 'in the square holes. The ones who see things differently');
            drawText(23, outage, 63, 310, 'they’re not fond of rules and they have');
            drawText(37.5, outage, 46, 350, 'no respect');
            drawText(27, wisdom, 318, 345, 'for the');
            drawText(37.5, outage, 404, 350, 'status quo');
            drawText(38, arvil, 58, 405, 'You can quote them, diagree with them, glorify, or vilify');
            drawText(38, arvil, 64, 445, 'them. About the only thing you can’t do is ignore them');
            drawText(28, wisdom, 120, 495, 'because');
            drawText(70, fatface, 48, 540, 'they change things');
            drawText(27, outage, 53, 588, 'they push the human race forward.');
            drawText(38, arvil, 48, 640, 'And while some may see them as');
            drawText(38, arvil, 230, 675, 'the crazy ones');
            drawText(72, fatface, 440, 677, 'we see');
            drawText(200, fatface, 52, 788, 'genius');
            drawText(38, arvil, 226, 835, 'because the people who are crazy enough');
            drawText(38, arvil, 283, 870, 'to think they can change the world');
            drawText(33, outage, 226, 915, 'are the ones who do!');
        });

        // begin downloading images
        loader.start();
    });

    $('#sample5-clear').click(function() {
        var canvas = document.getElementById('sample5-canvas'),
            ctx = canvas.getContext('2d');

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });

    // TODO: the font load doesn't seem consistent - it appears to fire
    // even when the font hasn't actually loaded. Sometimes occurs if we
    // run the test case immediately (without waiting for user to hit Run)
    $('#sample5-run').trigger('click');

});
