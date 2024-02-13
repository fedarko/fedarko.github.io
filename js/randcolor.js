// There isn't enough whimsy in the world, so this changes the color of the
// page background to a random light-ish color

const MIN_CHANNEL = 220;
const MAX_CHANNEL = 255;
const CHANNEL_RANGE = MAX_CHANNEL - MIN_CHANNEL;

function getRandomRGBChannel() {
    return Math.round((Math.random() * CHANNEL_RANGE) + MIN_CHANNEL);
}

function getRandomRGB() {
    return "rgb(" + getRandomRGBChannel() + " " + getRandomRGBChannel() + " " + getRandomRGBChannel() + ")";
}

document.getElementsByTagName("body")[0].style.setProperty(
    "background-color", getRandomRGB()
);
