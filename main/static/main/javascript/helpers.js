$(document).ready(function () {
    $(window).scroll(function () {
        var scroll = $(window).scrollTop();
        if (scroll > 50) {
            $("#navbar").css("background", "var(--accent-dull)");
        }
        else {
            $("#navbar").css("background", "rgb(0,0,0,0)");
        }
    })
})

async function openGlobalInfo(message, time) {  
    document.getElementById('info').innerHTML = message;
    document.getElementById('global-message').style.display = 'block';
    await new Promise(r => setTimeout(r, time));
    document.getElementById('info').innerHTML = '';
    document.getElementById('global-message').style.display = 'none';
}

async function openGlobalError(message, time) {
    document.getElementById('error').innerHTML = message;
    document.getElementById('global-error').style.display = 'block';
    await new Promise(r => setTimeout(r, time));
    document.getElementById('error').innerHTML = '';
    document.getElementById('global-error').style.display = 'none';
}